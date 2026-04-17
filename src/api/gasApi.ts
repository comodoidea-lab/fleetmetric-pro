import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, fn } from '../firebase';
import type {
  AccidentRecord,
  DashboardData,
  Driver,
  FuelRecord,
  MaintenanceRecord,
  OperationRecord,
  Statistics,
  Vehicle,
} from '../types';
import { COLLECTIONS, toNumber } from '../types/firestore';

function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${Date.now()}${rand}`;
}

function todayJa(): string {
  return new Date().toLocaleDateString('ja-JP');
}

async function fetchAll<T>(name: string): Promise<T[]> {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => d.data() as T);
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

function deriveDashboardData(
  vehicles: Vehicle[],
  maintenance: MaintenanceRecord[],
  fuel: FuelRecord[],
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
  const monthlyFuel: Record<string, number> = {};
  const vehicleMaintCost: Record<string, number> = {};
  const vehicleFuelCost: Record<string, number> = {};
  for (const f of fuel) {
    const month = String(f['日付']).replace(/-/g, '/').slice(0, 7);
    if (month) monthlyFuel[month] = (monthlyFuel[month] || 0) + toNumber(f['費用(円)']);
    const vName = f['車両名'];
    if (vName) vehicleFuelCost[vName] = (vehicleFuelCost[vName] || 0) + toNumber(f['費用(円)']);
  }
  for (const m of maintenance) {
    const vName = m['車両名'];
    if (vName) vehicleMaintCost[vName] = (vehicleMaintCost[vName] || 0) + toNumber(m['費用(円)']);
  }
  return {
    monthlyFuel,
    vehicleMaintCost,
    vehicleFuelCost,
    totalFuelCost: fuel.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
    totalMaintCost: maintenance.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
    totalAccidentCost: accidents.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
  };
}

export async function apiGetDashboard(): Promise<DashboardData> {
  try {
    return await callDashboardFunction();
  } catch {
    const [vehicles, maintenance, fuel] = await Promise.all([
      apiGetVehicles(),
      apiGetMaintenance(),
      apiGetFuel(),
    ]);
    return deriveDashboardData(vehicles, maintenance, fuel);
  }
}

export async function apiGetVehicles(): Promise<Vehicle[]> {
  return fetchAll<Vehicle>(COLLECTIONS.vehicles);
}

export async function apiAddVehicle(v: Omit<Vehicle, '車両ID' | '登録日'>): Promise<{ success: boolean; id: string }> {
  const id = createId('V');
  const payload: Vehicle = { ...v, '車両ID': id, '登録日': todayJa() };
  await setDoc(doc(db, COLLECTIONS.vehicles, id), payload);
  return { success: true, id };
}

export async function apiUpdateVehicle(v: Vehicle): Promise<{ success: boolean }> {
  await setDoc(doc(db, COLLECTIONS.vehicles, v['車両ID']), v);
  return { success: true };
}

export async function apiDeleteVehicle(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.vehicles, id));
  return { success: true };
}

export async function apiGetMaintenance(vehicleId?: string): Promise<MaintenanceRecord[]> {
  const base = collection(db, COLLECTIONS.maintenanceRecords);
  const q = vehicleId ? query(base, where('車両ID', '==', vehicleId)) : query(base);
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MaintenanceRecord);
}

export async function apiAddMaintenance(r: Omit<MaintenanceRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  const id = createId('M');
  await setDoc(doc(db, COLLECTIONS.maintenanceRecords, id), { ...r, '記録ID': id });
  return { success: true, id };
}

export async function apiDeleteMaintenance(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.maintenanceRecords, id));
  return { success: true };
}

export async function apiGetFuel(vehicleId?: string): Promise<FuelRecord[]> {
  const base = collection(db, COLLECTIONS.fuelRecords);
  const q = vehicleId ? query(base, where('車両ID', '==', vehicleId)) : query(base);
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FuelRecord);
}

export async function apiAddFuel(r: Omit<FuelRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  const id = createId('F');
  await setDoc(doc(db, COLLECTIONS.fuelRecords, id), { ...r, '記録ID': id });
  return { success: true, id };
}

export async function apiDeleteFuel(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.fuelRecords, id));
  return { success: true };
}

export async function apiGetAccidents(vehicleId?: string): Promise<AccidentRecord[]> {
  const base = collection(db, COLLECTIONS.accidentRecords);
  const q = vehicleId ? query(base, where('車両ID', '==', vehicleId)) : query(base);
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AccidentRecord);
}

export async function apiAddAccident(r: Omit<AccidentRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  const id = createId('A');
  await setDoc(doc(db, COLLECTIONS.accidentRecords, id), { ...r, '記録ID': id });
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
  const id = createId('D');
  const payload: Driver = { ...d, 'ドライバーID': id, '登録日': todayJa() };
  await setDoc(doc(db, COLLECTIONS.drivers, id), payload);
  return { success: true, id };
}

export async function apiUpdateDriver(d: Driver): Promise<{ success: boolean }> {
  await setDoc(doc(db, COLLECTIONS.drivers, d['ドライバーID']), d);
  return { success: true };
}

export async function apiDeleteDriver(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.drivers, id));
  return { success: true };
}

export async function apiGetOperationRecords(filters?: { vehicleId?: string; driverId?: string }): Promise<OperationRecord[]> {
  let qRef = query(collection(db, COLLECTIONS.operationRecords));
  if (filters?.vehicleId) {
    qRef = query(collection(db, COLLECTIONS.operationRecords), where('車両ID', '==', filters.vehicleId));
  }
  if (filters?.driverId) {
    qRef = query(collection(db, COLLECTIONS.operationRecords), where('ドライバーID', '==', filters.driverId));
  }
  if (filters?.vehicleId && filters?.driverId) {
    qRef = query(
      collection(db, COLLECTIONS.operationRecords),
      where('車両ID', '==', filters.vehicleId),
      where('ドライバーID', '==', filters.driverId),
    );
  }
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => d.data() as OperationRecord);
}

export async function apiAddOperationRecord(
  r: Omit<OperationRecord, '記録ID' | '走行距離(km)'>,
): Promise<{ success: boolean; id: string }> {
  const dep = toNumber(r['出発時走行距離(km)']);
  const ret = toNumber(r['帰着時走行距離(km)']);
  const distance = ret >= dep ? Math.round((ret - dep) * 1000) / 1000 : 0;
  const id = createId('R');
  await setDoc(doc(db, COLLECTIONS.operationRecords, id), {
    ...r,
    '記録ID': id,
    '走行距離(km)': distance,
  });
  return { success: true, id };
}

export async function apiDeleteOperationRecord(id: string): Promise<{ success: boolean }> {
  await deleteDoc(doc(db, COLLECTIONS.operationRecords, id));
  return { success: true };
}
