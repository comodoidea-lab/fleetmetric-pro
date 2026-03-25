// ============================================================
// FleetMetric Pro - Zustand Store
// Background sync with localStorage cache for snappy UI
// ============================================================

import { create } from 'zustand';
import {
  Vehicle, MaintenanceRecord, AccidentRecord, FuelRecord,
  DashboardData, Statistics, SyncStatus,
} from '../types';
import {
  apiGetDashboard, apiGetVehicles, apiGetMaintenance,
  apiGetFuel, apiGetAccidents, apiGetStatistics,
  apiAddVehicle, apiUpdateVehicle, apiDeleteVehicle,
  apiAddMaintenance, apiDeleteMaintenance,
  apiAddFuel, apiDeleteFuel,
  apiAddAccident, apiDeleteAccident,
} from '../api/gasApi';

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

  // UI state
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  initialized: boolean;

  // Actions
  loadAll: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  refreshMaintenance: () => Promise<void>;
  refreshFuel: () => Promise<void>;
  refreshAccidents: () => Promise<void>;
  refreshStatistics: () => Promise<void>;

  addVehicle: (v: Omit<Vehicle, '車両ID' | '登録日'>) => Promise<void>;
  updateVehicle: (v: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  addMaintenance: (r: Omit<MaintenanceRecord, '記録ID'>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;

  addFuel: (r: Omit<FuelRecord, '記録ID'>) => Promise<void>;
  deleteFuel: (id: string) => Promise<void>;

  addAccident: (r: Omit<AccidentRecord, '記録ID'>) => Promise<void>;
  deleteAccident: (id: string) => Promise<void>;
}

// ── Store ────────────────────────────────────────────────────
export const useStore = create<AppState>((set, get) => ({
  dashboard: cacheGet<DashboardData>('dashboard'),
  vehicles: cacheGet<Vehicle[]>('vehicles') ?? [],
  maintenance: cacheGet<MaintenanceRecord[]>('maintenance') ?? [],
  fuel: cacheGet<FuelRecord[]>('fuel') ?? [],
  accidents: cacheGet<AccidentRecord[]>('accidents') ?? [],
  statistics: cacheGet<Statistics>('statistics'),
  syncStatus: 'idle',
  lastSynced: null,
  initialized: false,

  // ── Load all data on startup ─────────────────────────────
  loadAll: async () => {
    set({ syncStatus: 'syncing' });
    try {
      const [dashboard, vehicles, maintenance, fuel, accidents, statistics] = await Promise.all([
        apiGetDashboard(),
        apiGetVehicles(),
        apiGetMaintenance(),
        apiGetFuel(),
        apiGetAccidents(),
        apiGetStatistics(),
      ]);
      cacheSet('dashboard', dashboard);
      cacheSet('vehicles', vehicles);
      cacheSet('maintenance', maintenance);
      cacheSet('fuel', fuel);
      cacheSet('accidents', accidents);
      cacheSet('statistics', statistics);
      set({ dashboard, vehicles, maintenance, fuel, accidents, statistics, syncStatus: 'success', lastSynced: new Date(), initialized: true });
    } catch (e) {
      console.error('loadAll failed:', e);
      set({ syncStatus: 'error', initialized: true });
    }
  },

  // ── Individual refresh ───────────────────────────────────
  refreshDashboard: async () => {
    const data = await apiGetDashboard();
    cacheSet('dashboard', data);
    set({ dashboard: data });
  },
  refreshVehicles: async () => {
    const data = await apiGetVehicles();
    cacheSet('vehicles', data);
    set({ vehicles: data });
  },
  refreshMaintenance: async () => {
    const data = await apiGetMaintenance();
    cacheSet('maintenance', data);
    set({ maintenance: data });
  },
  refreshFuel: async () => {
    const data = await apiGetFuel();
    cacheSet('fuel', data);
    set({ fuel: data });
  },
  refreshAccidents: async () => {
    const data = await apiGetAccidents();
    cacheSet('accidents', data);
    set({ accidents: data });
  },
  refreshStatistics: async () => {
    const data = await apiGetStatistics();
    cacheSet('statistics', data);
    set({ statistics: data });
  },

  // ── Vehicles CRUD ────────────────────────────────────────
  addVehicle: async (v) => {
    const tmpId = 'V_tmp_' + Date.now();
    const optimistic = { ...v, '車両ID': tmpId, '登録日': new Date().toLocaleDateString('ja-JP') } as Vehicle;
    set(s => ({ vehicles: [...s.vehicles, optimistic] }));
    try {
      const { id } = await apiAddVehicle(v);
      set(s => ({ vehicles: s.vehicles.map(x => x['車両ID'] === tmpId ? { ...optimistic, '車両ID': id } : x) }));
      get().refreshDashboard().catch(console.error);
    } catch {
      set(s => ({ vehicles: s.vehicles.filter(x => x['車両ID'] !== tmpId) }));
      throw new Error('車両の追加に失敗しました');
    }
  },

  updateVehicle: async (v) => {
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
    const prev = get().vehicles;
    set(s => ({ vehicles: s.vehicles.filter(x => x['車両ID'] !== id) }));
    try {
      await apiDeleteVehicle(id);
      get().refreshDashboard().catch(console.error);
    } catch {
      set({ vehicles: prev });
      throw new Error('車両の削除に失敗しました');
    }
  },

  // ── Maintenance CRUD ─────────────────────────────────────
  addMaintenance: async (r) => {
    const tmpId = 'M_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId } as MaintenanceRecord;
    set(s => ({ maintenance: [optimistic, ...s.maintenance] }));
    try {
      const { id } = await apiAddMaintenance(r);
      set(s => ({ maintenance: s.maintenance.map(x => x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x) }));
      get().refreshDashboard().catch(console.error);
    } catch {
      set(s => ({ maintenance: s.maintenance.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('メンテナンス記録の追加に失敗しました');
    }
  },

  deleteMaintenance: async (id) => {
    const prev = get().maintenance;
    set(s => ({ maintenance: s.maintenance.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteMaintenance(id);
    } catch {
      set({ maintenance: prev });
      throw new Error('メンテナンス記録の削除に失敗しました');
    }
  },

  // ── Fuel CRUD ────────────────────────────────────────────
  addFuel: async (r) => {
    const tmpId = 'F_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId } as FuelRecord;
    set(s => ({ fuel: [optimistic, ...s.fuel] }));
    try {
      const { id } = await apiAddFuel(r);
      set(s => ({ fuel: s.fuel.map(x => x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x) }));
    } catch {
      set(s => ({ fuel: s.fuel.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('給油記録の追加に失敗しました');
    }
  },

  deleteFuel: async (id) => {
    const prev = get().fuel;
    set(s => ({ fuel: s.fuel.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteFuel(id);
    } catch {
      set({ fuel: prev });
      throw new Error('給油記録の削除に失敗しました');
    }
  },

  // ── Accidents CRUD ───────────────────────────────────────
  addAccident: async (r) => {
    const tmpId = 'A_tmp_' + Date.now();
    const optimistic = { ...r, '記録ID': tmpId } as AccidentRecord;
    set(s => ({ accidents: [optimistic, ...s.accidents] }));
    try {
      const { id } = await apiAddAccident(r);
      set(s => ({ accidents: s.accidents.map(x => x['記録ID'] === tmpId ? { ...optimistic, '記録ID': id } : x) }));
    } catch {
      set(s => ({ accidents: s.accidents.filter(x => x['記録ID'] !== tmpId) }));
      throw new Error('事故・修理記録の追加に失敗しました');
    }
  },

  deleteAccident: async (id) => {
    const prev = get().accidents;
    set(s => ({ accidents: s.accidents.filter(x => x['記録ID'] !== id) }));
    try {
      await apiDeleteAccident(id);
    } catch {
      set({ accidents: prev });
      throw new Error('事故・修理記録の削除に失敗しました');
    }
  },
}));
