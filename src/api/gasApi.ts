import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  type QueryConstraint,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, fn } from '../firebase';
import type {
  AlcoholCheckRecord,
  AccidentRecord,
  AttendanceRecord,
  DashboardData,
  Driver,
  FuelRecord,
  MaintenanceRecord,
  OperationRecord,
  SalesCategory,
  SalesRecord,
  Statistics,
  Vehicle,
} from '../types';
import { COLLECTIONS, orgCollectionPath, toNumber } from '../types/firestore';
import { buildCostStatistics } from '../utils/costStats';

function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${Date.now()}${rand}`;
}

function requireOwnerUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('ログインが必要です');
  return uid;
}

async function requireScope(): Promise<{ ownerUid: string; organizationId: string }> {
  const ownerUid = requireOwnerUid();
  const profileSnap = await getDoc(doc(db, 'users', ownerUid, 'profile', 'main'));
  const organizationId = String(profileSnap.data()?.organizationId ?? '').trim();
  if (!organizationId) {
    throw new Error('組織に参加してから利用してください');
  }
  return {
    ownerUid,
    organizationId,
  };
}

function todayJa(): string {
  return new Date().toLocaleDateString('ja-JP');
}

function toIsoIfTimestamp(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return '';
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
}

async function orgCollection(name: 'attendance' | 'alcoholChecks') {
  const { organizationId } = await requireScope();
  return collection(db, orgCollectionPath(organizationId, name));
}
async function fetchAll<T>(name: string, constraints: QueryConstraint[] = []): Promise<T[]> {
  const { ownerUid, organizationId } = await requireScope();
  const ref = collection(db, name);
  const [orgSnap, ownerSnap] = await Promise.all([
    getDocs(query(ref, where('organizationId', '==', organizationId), ...constraints)),
    getDocs(query(ref, where('ownerUid', '==', ownerUid), ...constraints)),
  ]);
  const merged = new Map<string, T>();
  for (const snap of [orgSnap, ownerSnap]) {
    for (const row of snap.docs) {
      merged.set(row.id, row.data() as T);
    }
  }
  return Array.from(merged.values());
}

async function callDashboardFunction(): Promise<DashboardData> {
  const callable = httpsCallable(fn, 'getDashboardData');
  const res = await callable();
  return res.data as DashboardData;
}

async function callStatisticsFunction(): Promise<Statistics> {
  const callable = httpsCallable(fn, 'getStatisticsData');
  const res = await callable();
  return res.data as Statistics;
}

export interface LegacyRestoreResult {
  success: boolean;
  dryRun: boolean;
  message: string;
  summary: Array<{
    sheetName: string;
    collection: string;
    rows: number;
    duplicates: number;
  }>;
}

export async function apiRunLegacySpreadsheetRestore(
  spreadsheetId: string,
  dryRun: boolean,
): Promise<LegacyRestoreResult> {
  const callable = httpsCallable(fn, 'runLegacySpreadsheetRestore');
  const res = await callable({ spreadsheetId, dryRun });
  return res.data as LegacyRestoreResult;
}

function deriveDashboardData(
  vehicles: Vehicle[],
  maintenance: MaintenanceRecord[],
  fuel: FuelRecord[],
  alcoholChecks: AlcoholCheckRecord[] = [],
): DashboardData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts: DashboardData['alerts'] = [];
  for (const v of vehicles) {
    const targets: Array<{ key: '車検期限' | '法定点検期限'; label: string }> = [
      { key: '車検期限', label: '車検' },
      { key: '法定点検期限', label: '法定点検' },
    ];
    for (const target of targets) {
      const raw = v[target.key];
      if (!raw) continue;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) continue;
      const daysLeft = Math.floor((date.getTime() - today.getTime()) / 86400000);
      if (daysLeft < 0 || daysLeft <= 30) {
        alerts.push({
          type: daysLeft < 0 ? 'danger' : 'warning',
          vehicleName: v['車両名'],
          plateNumber: v['ナンバー'],
          message: daysLeft < 0 ? `期限切れ（${Math.abs(daysLeft)}日経過）` : `あと${daysLeft}日`,
          daysLeft,
          category: target.label,
        });
      }
    }
  }
  for (const check of alcoholChecks) {
    if (check.result !== '要確認（陽性）') continue;
    alerts.push({
      type: 'danger',
      vehicleName: check.driverName,
      plateNumber: check.vehicleName || '車両未設定',
      message: `${check.timing}：要確認（陽性）`,
      daysLeft: -9999,
      category: 'アルコールチェック',
    });
  }
  const thisMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }).replace('/', '/');
  const monthlyFuelCost = fuel
    .filter((x) => String(x['日付']).replace(/-/g, '/').startsWith(thisMonth))
    .reduce((sum, x) => sum + toNumber(x['費用(円)']), 0);
  return {
    vehicleCount: vehicles.length,
    activeCount: vehicles.filter((v) => v['ステータス'] === '稼働中').length,
    maintenanceCount: maintenance.length,
    alerts: alerts.sort((a, b) => a.daysLeft - b.daysLeft),
    recentMaintenance: [...maintenance].sort((a, b) => String(b['日付']).localeCompare(String(a['日付']))).slice(0, 5),
    monthlyFuelCost,
  };
}

function deriveStatistics(
  fuel: FuelRecord[],
  maintenance: MaintenanceRecord[],
  accidents: AccidentRecord[],
): Statistics {
  return buildCostStatistics(fuel, maintenance, accidents);
}

export async function apiGetDashboard(): Promise<DashboardData> {
  try {
    const base = await callDashboardFunction();
    const alcoholChecks = await apiGetAlcoholChecks();
    const alcoholAlerts: DashboardData['alerts'] = alcoholChecks
      .filter((check) => check.result === '要確認（陽性）')
      .map((check) => ({
        type: 'danger',
        vehicleName: check.driverName,
        plateNumber: check.vehicleName || '車両未設定',
        message: `${check.timing}：要確認（陽性）`,
        daysLeft: -9999,
        category: 'アルコールチェック',
      }));
    return {
      ...base,
      alerts: [...alcoholAlerts, ...base.alerts].sort((a, b) => a.daysLeft - b.daysLeft),
    };
  } catch {
    const [vehicles, maintenance, fuel, alcoholChecks] = await Promise.all([
      apiGetVehicles(),
      apiGetMaintenance(),
      apiGetFuel(),
      apiGetAlcoholChecks(),
    ]);
    return deriveDashboardData(vehicles, maintenance, fuel, alcoholChecks);
  }
}

export async function apiGetVehicles(): Promise<Vehicle[]> {
  return fetchAll<Vehicle>(COLLECTIONS.vehicles);
}

export async function apiAddVehicle(v: Omit<Vehicle, '車両ID' | '登録日'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('V');
  const payload: Vehicle = { ...v, ownerUid, organizationId, '車両ID': id, '登録日': todayJa() };
  await setDoc(doc(db, COLLECTIONS.vehicles, id), payload);
  return { success: true, id };
}

export async function apiUpdateVehicle(v: Vehicle): Promise<{ success: boolean }> {
  const { ownerUid, organizationId } = await requireScope();
  await setDoc(doc(db, COLLECTIONS.vehicles, v['車両ID']), { ...v, ownerUid, organizationId });
  return { success: true };
}

export async function apiDeleteVehicle(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.vehicles, id));
  return { success: true };
}

export async function apiGetMaintenance(vehicleId?: string): Promise<MaintenanceRecord[]> {
  return fetchAll<MaintenanceRecord>(
    COLLECTIONS.maintenanceRecords,
    vehicleId ? [where('車両ID', '==', vehicleId)] : [],
  );
}

export async function apiAddMaintenance(r: Omit<MaintenanceRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('M');
  await setDoc(doc(db, COLLECTIONS.maintenanceRecords, id), { ...r, ownerUid, organizationId, '記録ID': id });
  return { success: true, id };
}

export async function apiDeleteMaintenance(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.maintenanceRecords, id));
  return { success: true };
}

export async function apiGetFuel(vehicleId?: string): Promise<FuelRecord[]> {
  return fetchAll<FuelRecord>(
    COLLECTIONS.fuelRecords,
    vehicleId ? [where('車両ID', '==', vehicleId)] : [],
  );
}

export async function apiAddFuel(r: Omit<FuelRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('F');
  await setDoc(doc(db, COLLECTIONS.fuelRecords, id), { ...r, ownerUid, organizationId, '記録ID': id });
  return { success: true, id };
}

export async function apiDeleteFuel(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.fuelRecords, id));
  return { success: true };
}

export async function apiGetSalesRecords(): Promise<SalesRecord[]> {
  return fetchAll<SalesRecord>(COLLECTIONS.salesRecords);
}

export async function apiAddSalesRecord(r: Omit<SalesRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('S');
  const payload: SalesRecord = {
    ...r,
    ownerUid,
    organizationId,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COLLECTIONS.salesRecords, id), payload);
  return { success: true, id };
}

export async function apiDeleteSalesRecord(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.salesRecords, id));
  return { success: true };
}

export async function apiGetSalesCategories(): Promise<SalesCategory[]> {
  return fetchAll<SalesCategory>(COLLECTIONS.salesCategories);
}

export async function apiAddSalesCategory(r: Omit<SalesCategory, 'id'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('SC');
  await setDoc(doc(db, COLLECTIONS.salesCategories, id), { ...r, ownerUid, organizationId, id });
  return { success: true, id };
}

export async function apiDeleteSalesCategory(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.salesCategories, id));
  return { success: true };
}

export async function apiGetAccidents(vehicleId?: string): Promise<AccidentRecord[]> {
  return fetchAll<AccidentRecord>(
    COLLECTIONS.accidentRecords,
    vehicleId ? [where('車両ID', '==', vehicleId)] : [],
  );
}

export async function apiAddAccident(r: Omit<AccidentRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('A');
  await setDoc(doc(db, COLLECTIONS.accidentRecords, id), { ...r, ownerUid, organizationId, '記録ID': id });
  return { success: true, id };
}

export async function apiDeleteAccident(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.accidentRecords, id));
  return { success: true };
}

export async function apiGetStatistics(): Promise<Statistics> {
  try {
    return await callStatisticsFunction();
  } catch {
    const [fuel, maintenance, accidents] = await Promise.all([
      apiGetFuel(),
      apiGetMaintenance(),
      apiGetAccidents(),
    ]);
    return deriveStatistics(fuel, maintenance, accidents);
  }
}

export async function apiGetDrivers(): Promise<Driver[]> {
  return fetchAll<Driver>(COLLECTIONS.drivers);
}

export async function apiAddDriver(d: Omit<Driver, 'ドライバーID' | '登録日'>): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const id = createId('D');
  const payload: Driver = { ...d, ownerUid, organizationId, 'ドライバーID': id, '登録日': todayJa() };
  await setDoc(doc(db, COLLECTIONS.drivers, id), payload);
  return { success: true, id };
}

export async function apiUpdateDriver(d: Driver): Promise<{ success: boolean }> {
  const { ownerUid, organizationId } = await requireScope();
  await setDoc(doc(db, COLLECTIONS.drivers, d['ドライバーID']), { ...d, ownerUid, organizationId });
  return { success: true };
}

export async function apiDeleteDriver(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.drivers, id));
  return { success: true };
}

export async function apiGetOperationRecords(filters?: { vehicleId?: string; driverId?: string }): Promise<OperationRecord[]> {
  const constraints: QueryConstraint[] = [];
  if (filters?.vehicleId) constraints.push(where('車両ID', '==', filters.vehicleId));
  if (filters?.driverId) constraints.push(where('ドライバーID', '==', filters.driverId));
  return fetchAll<OperationRecord>(COLLECTIONS.operationRecords, constraints);
}

export async function apiAddOperationRecord(
  r: Omit<OperationRecord, '記録ID' | '走行距離(km)'>,
): Promise<{ success: boolean; id: string }> {
  const { ownerUid, organizationId } = await requireScope();
  const dep = toNumber(r['出発時走行距離(km)']);
  const ret = toNumber(r['帰着時走行距離(km)']);
  const distance = ret >= dep ? Math.round((ret - dep) * 1000) / 1000 : 0;
  const id = createId('R');
  await setDoc(doc(db, COLLECTIONS.operationRecords, id), {
    ...r,
    ownerUid,
    organizationId,
    '記録ID': id,
    '走行距離(km)': distance,
  });
  return { success: true, id };
}

export async function apiDeleteOperationRecord(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.operationRecords, id));
  return { success: true };
}

export async function apiGetAttendance(): Promise<AttendanceRecord[]> {
  const ref = await orgCollection(COLLECTIONS.attendance);
  const snap = await getDocs(query(ref));
  return snap.docs.map((d) => {
    const data = d.data() as Omit<AttendanceRecord, 'id'>;
    return {
      ...data,
      id: d.id,
      timestamp: toIsoIfTimestamp(data.timestamp),
      createdAt: toIsoIfTimestamp(data.createdAt),
    };
  });
}

export async function apiAddAttendance(
  payload: Omit<AttendanceRecord, 'id' | 'createdAt'>,
): Promise<{ success: boolean; id: string }> {
  const id = createId('AT');
  const ref = await orgCollection(COLLECTIONS.attendance);
  const data = omitUndefined({
    ...payload,
    id,
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(ref, id), data);
  return { success: true, id };
}

export async function apiDeleteAttendance(id: string): Promise<{ success: boolean }> {
  const ref = await orgCollection(COLLECTIONS.attendance);
  await deleteDoc(doc(ref, id));
  return { success: true };
}

export async function apiGetAlcoholChecks(): Promise<AlcoholCheckRecord[]> {
  const ref = await orgCollection(COLLECTIONS.alcoholChecks);
  const snap = await getDocs(query(ref));
  return snap.docs.map((d) => {
    const data = d.data() as Omit<AlcoholCheckRecord, 'id'>;
    return {
      ...data,
      id: d.id,
      timestamp: toIsoIfTimestamp(data.timestamp),
      createdAt: toIsoIfTimestamp(data.createdAt),
    };
  });
}

export async function apiAddAlcoholCheck(
  payload: Omit<AlcoholCheckRecord, 'id' | 'createdAt'>,
): Promise<{ success: boolean; id: string }> {
  const id = createId('AL');
  const ref = await orgCollection(COLLECTIONS.alcoholChecks);
  const data = omitUndefined({
    ...payload,
    id,
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(ref, id), data);
  return { success: true, id };
}

export async function apiDeleteAlcoholCheck(id: string): Promise<{ success: boolean }> {
  const ref = await orgCollection(COLLECTIONS.alcoholChecks);
  await deleteDoc(doc(ref, id));
  return { success: true };
}
