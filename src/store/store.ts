// ============================================================
// FleetMetric Pro - Zustand Store
// Background sync with localStorage cache for snappy UI
// ============================================================

import { create } from 'zustand';
import {
  Vehicle, MaintenanceRecord, AccidentRecord, FuelRecord,
  Driver, OperationRecord,
  DashboardData, Statistics, SyncStatus,
} from '../types';
import {
  apiGetDashboard, apiGetVehicles, apiGetMaintenance,
  apiGetFuel, apiGetAccidents, apiGetStatistics,
  apiAddVehicle, apiUpdateVehicle, apiDeleteVehicle,
  apiAddMaintenance, apiDeleteMaintenance,
  apiAddFuel, apiDeleteFuel,
  apiAddAccident, apiDeleteAccident,
  apiGetDrivers, apiAddDriver, apiUpdateDriver, apiDeleteDriver,
  apiGetOperationRecords, apiAddOperationRecord, apiDeleteOperationRecord,
} from '../api/gasApi';
import { createDemoSnapshot } from '../data/demoData';

// ── localStorage cache helpers ───────────────────────────────
const CACHE_PREFIX = 'fleetmetric_';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function cacheSet<T>(key: string, data: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* storage full */ }
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data as T;
  } catch { return null; }
}

// ── Store types ──────────────────────────────────────────────
interface AppState {
  // Data
  dashboard: DashboardData | null;
  vehicles: Vehicle[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  accidents: AccidentRecord[];
  statistics: Statistics | null;
  drivers: Driver[];
  operationRecords: OperationRecord[];

  // UI state
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  initialized: boolean;
  demoMode: boolean;

  // Actions
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  loadAll: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  refreshMaintenance: () => Promise<void>;
  refreshFuel: () => Promise<void>;
  refreshAccidents: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
  refreshOperationRecords: () => Promise<void>;

  addVehicle: (v: Omit<Vehicle, '車両ID' | '登録日'>) => Promise<void>;
  updateVehicle: (v: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  addMaintenance: (r: Omit<MaintenanceRecord, '記録ID'>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;

  addFuel: (r: Omit<FuelRecord, '記録ID'>) => Promise<void>;
  deleteFuel: (id: string) => Promise<void>;

  addAccident: (r: Omit<AccidentRecord, '記録ID'>) => Promise<void>;
  deleteAccident: (id: string) => Promise<void>;

  addDriver: (d: Omit<Driver, 'ドライバーID' | '登録日'>) => Promise<void>;
  updateDriver: (d: Driver) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  addOperationRecord: (r: Omit<OperationRecord, '記録ID' | '走行距離(km)'>) => Promise<void>;
  deleteOperationRecord: (id: string) => Promise<void>;
}

// ── Store ────────────────────────────────────────────────────
export const useStore = create<AppState>((set, get) => ({
  dashboard: cacheGet<DashboardData>('dashboard'),
  vehicles: cacheGet<Vehicle[]>('vehicles') ?? [],
  maintenance: cacheGet<MaintenanceRecord[]>('maintenance') ?? [],
  fuel: cacheGet<FuelRecord[]>('fuel') ?? [],
  accidents: cacheGet<AccidentRecord[]>('accidents') ?? [],
  statistics: cacheGet<Statistics>('statistics'),
  drivers: cacheGet<Driver[]>('drivers') ?? [],
  operationRecords: cacheGet<OperationRecord[]>('operationRecords') ?? [],
  syncStatus: 'idle',
  lastSynced: null,
  initialized: false,
  demoMode: false,

  enableDemoMode: () => {
    const demo = createDemoSnapshot();
    set({
      ...demo,
      demoMode: true,
      syncStatus: 'success',
      lastSynced: new Date(),
      initialized: true,
    });
  },

  disableDemoMode: () => {
    set({ demoMode: false });
  },

  // ── Load all data on startup ─────────────────────────────
  loadAll: async () => {
    if (get().demoMode) {
      const demo = createDemoSnapshot();
      set({
        ...demo,
        syncStatus: 'success',
        lastSynced: new Date(),
        initialized: true,
      });
      return;
    }
    set({ syncStatus: 'syncing' });
    try {
      const [dashboard, vehicles, maintenance, fuel, accidents, statistics, drivers, operationRecords] = await Promise.all([
        apiGetDashboard(),
        apiGetVehicles(),
        apiGetMaintenance(),
        apiGetFuel(),
        apiGetAccidents(),
        apiGetStatistics(),
        apiGetDrivers(),
        apiGetOperationRecords(),
      ]);
      cacheSet('dashboard', dashboard);
      cacheSet('vehicles', vehicles);
      cacheSet('maintenance', maintenance);
      cacheSet('fuel', fuel);
      cacheSet('accidents', accidents);
      cacheSet('statistics', statistics);
      cacheSet('drivers', drivers);
      cacheSet('operationRecords', operationRecords);
      set({
        dashboard,
        vehicles,
        maintenance,
        fuel,
        accidents,
        statistics,
        drivers,
        operationRecords,
        syncStatus: 'success',
        lastSynced: new Date(),
        initialized: true,
      });
    } catch (e) {
      console.error('loadAll failed:', e);
      set({ syncStatus: 'error', initialized: true });
    }
  },

  // ── Individual refresh ───────────────────────────────────
  refreshDashboard: async () => {
    if (get().demoMode) return;
    const data = await apiGetDashboard();
    cacheSet('dashboard', data);
    set({ dashboard: data });
  },
  refreshVehicles: async () => {
    if (get().demoMode) return;
    const data = await apiGetVehicles();
    cacheSet('vehicles', data);
    set({ vehicles: data });
  },
  refreshMaintenance: async () => {
    if (get().demoMode) return;
    const data = await apiGetMaintenance();
    cacheSet('maintenance', data);
    set({ maintenance: data });
  },
  refreshFuel: async () => {
    if (get().demoMode) return;
    const data = await apiGetFuel();
    cacheSet('fuel', data);
    set({ fuel: data });
  },
  refreshAccidents: async () => {
    if (get().demoMode) return;
    const data = await apiGetAccidents();
    cacheSet('accidents', data);
    set({ accidents: data });
  },
  refreshStatistics: async () => {
    if (get().demoMode) return;
    const data = await apiGetStatistics();
    cacheSet('statistics', data);
    set({ statistics: data });
  },
  refreshDrivers: async () => {
    if (get().demoMode) return;
    const data = await apiGetDrivers();
    cacheSet('drivers', data);
    set({ drivers: data });
  },
  refreshOperationRecords: async () => {
    if (get().demoMode) return;
    const data = await apiGetOperationRecords();
    cacheSet('operationRecords', data);
    set({ operationRecords: data });
  },

  // ── Vehicles CRUD ────────────────────────────────────────
  addVehicle: async (v) => {
    if (get().demoMode) {
      const id = 'V_demo_' + Date.now();
      const item = { ...v, '車両ID': id, '登録日': new Date().toLocaleDateString('ja-JP'), ownerUid: 'demo-user' } as Vehicle;
      set(s => ({ vehicles: [...s.vehicles, item] }));
      return;
    }
    const tmpId = 'V_tmp_' + Date.now();
    const optimistic = { ...v, '車両ID': tmpId, '登録日': new Date().toLocaleDateString('ja-JP') } as Vehicle;
    set(s => ({ vehicles: [...s.vehicles, optimistic] }));
    try {
      const { id } = await apiAddVehicle(v);
      set(s => ({ vehicles: s.vehicles.map(x => x['車両ID'] === tmpId ? { ...optimistic, '車両ID': id } : x) }));
      cacheSet('vehicles', get().vehicles);
      get().refreshDashboard().catch(console.error);
    } catch {
      set(s => ({ vehicles: s.vehicles.filter(x => x['車両ID'] !== tmpId) }));
      throw new Error('車両の追加に失敗しました');
    }
  },

  updateVehicle: async (v) => {
    if (get().demoMode) {
      set(s => ({ vehicles: s.vehicles.map(x => x['車両ID'] === v['車両ID'] ? v : x) }));
      return;
    }
    const prev = get().vehicles;
    set(s => ({ vehicles: s.vehicles.map(x => x['車両ID'] === v['車両ID'] ? v : x) }));
    try {
      await apiUpdateVehicle(v);
      get().refreshDashboard().catch(console.error);
    } catch {
      set({ vehicles: prev });
      throw new Error('車両の更新に失敗しました');
    }
  },

  deleteVehicle: async (id) => {
    if (get().demoMode) {
      set(s => ({ vehicles: s.vehicles.filter(x => x['車両ID'] !== id) }));
      return;
    }
    const prev = get().vehicles;
    set(s => ({ vehicles: s.vehicles.filter(x => x['車両ID'] !== id) }));
    try {
      await apiDeleteVehicle(id);
      cacheSet('vehicles', get().vehicles);
      get().refreshDashboard().catch(console.error);
    } catch {
      set({ vehicles: prev });
      throw new Error('車両の削除に失敗しました');
    }
  },

  // ── Maintenance CRUD ─────────────────────────────────────
  addMaintenance: async (r) => {
    if (get().demoMode) {
      const id = 'M_demo_' + Date.now();
      const item = { ...r, '記録ID': id, ownerUid: 'demo-user' } as MaintenanceRecord;
      set(s => ({ maintenance: [item, ...s.maintenance] }));
      return;
    }
    const tmpId = 'M_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId } as MaintenanceRecord;
    set(s => ({ maintenance: [optimistic, ...s.maintenance] }));
    try {
      const { id } = await apiAddMaintenance(r);
      set(s => ({ maintenance: s.maintenance.map(x => x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x) }));
      cacheSet('maintenance', get().maintenance);
      get().refreshDashboard().catch(console.error);
      get().refreshMaintenance().catch(console.error);
    } catch {
      set(s => ({ maintenance: s.maintenance.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('メンテナンス記録の追加に失敗しました');
    }
  },

  deleteMaintenance: async (id) => {
    if (get().demoMode) {
      set(s => ({ maintenance: s.maintenance.filter(x => x['記録ID'] !== id) }));
      return;
    }
    const prev = get().maintenance;
    set(s => ({ maintenance: s.maintenance.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteMaintenance(id);
      cacheSet('maintenance', get().maintenance);
    } catch {
      set({ maintenance: prev });
      throw new Error('メンテナンス記録の削除に失敗しました');
    }
  },

  // ── Fuel CRUD ────────────────────────────────────────────
  addFuel: async (r) => {
    if (get().demoMode) {
      const id = 'F_demo_' + Date.now();
      const item = { ...r, '記録ID': id, ownerUid: 'demo-user' } as FuelRecord;
      set(s => ({ fuel: [item, ...s.fuel] }));
      return;
    }
    const tmpId = 'F_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId } as FuelRecord;
    set(s => ({ fuel: [optimistic, ...s.fuel] }));
    try {
      const { id } = await apiAddFuel(r);
      set(s => ({ fuel: s.fuel.map(x => x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x) }));
      cacheSet('fuel', get().fuel);
    } catch {
      set(s => ({ fuel: s.fuel.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('給油記録の追加に失敗しました');
    }
  },

  deleteFuel: async (id) => {
    if (get().demoMode) {
      set(s => ({ fuel: s.fuel.filter(x => x['記録ID'] !== id) }));
      return;
    }
    const prev = get().fuel;
    set(s => ({ fuel: s.fuel.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteFuel(id);
      cacheSet('fuel', get().fuel);
    } catch {
      set({ fuel: prev });
      throw new Error('給油記録の削除に失敗しました');
    }
  },

  // ── Accidents CRUD ───────────────────────────────────────
  addAccident: async (r) => {
    if (get().demoMode) {
      const id = 'A_demo_' + Date.now();
      const item = { ...r, '記録ID': id, ownerUid: 'demo-user' } as AccidentRecord;
      set(s => ({ accidents: [item, ...s.accidents] }));
      return;
    }
    const tmpId = 'A_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId } as AccidentRecord;
    set(s => ({ accidents: [optimistic, ...s.accidents] }));
    try {
      const { id } = await apiAddAccident(r);
      set(s => ({ accidents: s.accidents.map(x => x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x) }));
      cacheSet('accidents', get().accidents);
    } catch {
      set(s => ({ accidents: s.accidents.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('事故・修理記録の追加に失敗しました');
    }
  },

  deleteAccident: async (id) => {
    if (get().demoMode) {
      set(s => ({ accidents: s.accidents.filter(x => x['記録ID'] !== id) }));
      return;
    }
    const prev = get().accidents;
    set(s => ({ accidents: s.accidents.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteAccident(id);
      cacheSet('accidents', get().accidents);
    } catch {
      set({ accidents: prev });
      throw new Error('事故・修理記録の削除に失敗しました');
    }
  },

  // ── Drivers CRUD ─────────────────────────────────────────
  addDriver: async (d) => {
    if (get().demoMode) {
      const id = 'D_demo_' + Date.now();
      const item = { ...d, 'ドライバーID': id, '登録日': new Date().toLocaleDateString('ja-JP'), ownerUid: 'demo-user' } as Driver;
      set(s => ({ drivers: [...s.drivers, item] }));
      return;
    }
    const tmpId = 'D_tmp_' + Date.now();
    const optimistic = {
      ...d,
      'ドライバーID': tmpId,
      '登録日': new Date().toLocaleDateString('ja-JP'),
    } as Driver;
    set(s => ({ drivers: [...s.drivers, optimistic] }));
    try {
      const { id } = await apiAddDriver(d);
      set(s => ({
        drivers: s.drivers.map(x => (x['ドライバーID'] === tmpId ? { ...optimistic, 'ドライバーID': id } : x)),
      }));
      cacheSet('drivers', get().drivers);
    } catch {
      set(s => ({ drivers: s.drivers.filter(x => x['ドライバーID'] !== tmpId) }));
      throw new Error('ドライバーの追加に失敗しました');
    }
  },

  updateDriver: async (d) => {
    if (get().demoMode) {
      set(s => ({ drivers: s.drivers.map(x => (x['ドライバーID'] === d['ドライバーID'] ? d : x)) }));
      return;
    }
    const prev = get().drivers;
    set(s => ({ drivers: s.drivers.map(x => (x['ドライバーID'] === d['ドライバーID'] ? d : x)) }));
    try {
      await apiUpdateDriver(d);
      cacheSet('drivers', get().drivers);
    } catch {
      set({ drivers: prev });
      throw new Error('ドライバーの更新に失敗しました');
    }
  },

  deleteDriver: async (id) => {
    if (get().demoMode) {
      set(s => ({ drivers: s.drivers.filter(x => x['ドライバーID'] !== id) }));
      return;
    }
    const prev = get().drivers;
    set(s => ({ drivers: s.drivers.filter(x => x['ドライバーID'] !== id) }));
    try {
      await apiDeleteDriver(id);
      cacheSet('drivers', get().drivers);
    } catch {
      set({ drivers: prev });
      throw new Error('ドライバーの削除に失敗しました');
    }
  },

  // ── Operation records ───────────────────────────────────
  addOperationRecord: async (r) => {
    if (get().demoMode) {
      const depDemo = Number(r['出発時走行距離(km)']) || 0;
      const retDemo = Number(r['帰着時走行距離(km)']) || 0;
      const distDemo = retDemo >= depDemo ? Math.round((retDemo - depDemo) * 1000) / 1000 : 0;
      const id = 'R_demo_' + Date.now();
      const item = { ...r, '記録ID': id, '走行距離(km)': distDemo, ownerUid: 'demo-user' } as OperationRecord;
      set(s => ({ operationRecords: [item, ...s.operationRecords] }));
      return;
    }
    const dep = Number(r['出発時走行距離(km)']) || 0;
    const ret = Number(r['帰着時走行距離(km)']) || 0;
    const dist = ret >= dep ? Math.round((ret - dep) * 1000) / 1000 : 0;
    const tmpId = 'R_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId, '走行距離(km)': dist } as OperationRecord;
    set(s => ({ operationRecords: [optimistic, ...s.operationRecords] }));
    try {
      const { id } = await apiAddOperationRecord(r);
      set(s => ({
        operationRecords: s.operationRecords.map(x =>
          x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x,
        ),
      }));
      cacheSet('operationRecords', get().operationRecords);
    } catch {
      set(s => ({ operationRecords: s.operationRecords.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('運行記録の追加に失敗しました');
    }
  },

  deleteOperationRecord: async (id) => {
    if (get().demoMode) {
      set(s => ({ operationRecords: s.operationRecords.filter(x => x['記録ID'] !== id) }));
      return;
    }
    const prev = get().operationRecords;
    set(s => ({ operationRecords: s.operationRecords.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteOperationRecord(id);
      cacheSet('operationRecords', get().operationRecords);
    } catch {
      set({ operationRecords: prev });
      throw new Error('運行記録の削除に失敗しました');
    }
  },
}));
