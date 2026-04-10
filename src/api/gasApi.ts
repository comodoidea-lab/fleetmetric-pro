// ============================================================
// FleetMetric Pro - GAS API Client (JSONP)
// ============================================================
// All requests go through GAS doGet with JSONP callback.
// This bypasses CORS restrictions for external domains (GitHub Pages).

import { getGasUrl } from '../config';
import { GAS_API_VERSION } from '../version';
import {
  Vehicle, MaintenanceRecord, AccidentRecord, FuelRecord,
  Driver, OperationRecord,
  DashboardData, Statistics,
} from '../types';
import { MOCK_DATA } from './mockData';

let callbackCounter = 0;

/** Generic JSONP fetch */
function jsonpFetch<T>(params: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const cbName = `_gas_cb_${Date.now()}_${callbackCounter++}`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('GAS request timed out (30s)'));
    }, 30000);

    function cleanup() {
      clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
    }

    (window as unknown as Record<string, unknown>)[cbName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    const qs = new URLSearchParams({ ...params, callback: cbName }).toString();
    const script = document.createElement('script');
    script.id = cbName;
    script.src = `${getGasUrl()}?${qs}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('GAS script load failed'));
    };
    document.head.appendChild(script);
  });
}

/** GET request (read) */
async function gasGet<T>(action: string, extra?: Record<string, string>): Promise<T> {
  const result = await jsonpFetch<{ success: boolean; data: T; error?: string }>({
    action,
    ...extra,
  });
  if (!result.success) throw new Error(result.error || 'GAS error');
  return result.data;
}

/** Write request (via GET with encoded data) */
async function gasWrite<T>(action: string, data?: unknown, extra?: Record<string, string>): Promise<T> {
  const params: Record<string, string> = { action, ...extra };
  if (data !== undefined) params.data = JSON.stringify(data);
  const result = await jsonpFetch<T & { success: boolean; error?: string }>(params);
  if (!result.success) throw new Error((result as { error?: string }).error || 'GAS write error');
  return result;
}

// ── API functions ────────────────────────────────────────────

export async function apiGetDashboard(): Promise<DashboardData> {
  if (!getGasUrl()) return MOCK_DATA.dashboard;
  return gasGet<DashboardData>('dashboard');
}

export async function apiGetVehicles(): Promise<Vehicle[]> {
  if (!getGasUrl()) return MOCK_DATA.vehicles;
  return gasGet<Vehicle[]>('vehicles');
}

export async function apiAddVehicle(v: Omit<Vehicle, '車両ID' | '登録日'>): Promise<{ success: boolean; id: string }> {
  if (!getGasUrl()) return { success: true, id: 'V' + Date.now() };
  return gasWrite('addVehicle', v);
}

export async function apiUpdateVehicle(v: Vehicle): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('updateVehicle', v);
}

export async function apiDeleteVehicle(id: string): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('deleteVehicle', undefined, { id });
}

export async function apiGetMaintenance(vehicleId?: string): Promise<MaintenanceRecord[]> {
  if (!getGasUrl()) return vehicleId
    ? MOCK_DATA.maintenance.filter((r: MaintenanceRecord) => r['車両ID'] === vehicleId)
    : MOCK_DATA.maintenance;
  return gasGet<MaintenanceRecord[]>('maintenance', vehicleId ? { vehicleId } : undefined);
}

export async function apiAddMaintenance(r: Omit<MaintenanceRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  if (!getGasUrl()) return { success: true, id: 'M' + Date.now() };
  return gasWrite('addMaintenance', r);
}

export async function apiDeleteMaintenance(id: string): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('deleteMaintenance', undefined, { id });
}

export async function apiGetFuel(vehicleId?: string): Promise<FuelRecord[]> {
  if (!getGasUrl()) return vehicleId
    ? MOCK_DATA.fuel.filter((r: FuelRecord) => r['車両ID'] === vehicleId)
    : MOCK_DATA.fuel;
  return gasGet<FuelRecord[]>('fuel', vehicleId ? { vehicleId } : undefined);
}

export async function apiAddFuel(r: Omit<FuelRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  if (!getGasUrl()) return { success: true, id: 'F' + Date.now() };
  return gasWrite('addFuel', r);
}

export async function apiDeleteFuel(id: string): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('deleteFuel', undefined, { id });
}

export async function apiGetAccidents(vehicleId?: string): Promise<AccidentRecord[]> {
  if (!getGasUrl()) return vehicleId
    ? MOCK_DATA.accidents.filter((r: AccidentRecord) => r['車両ID'] === vehicleId)
    : MOCK_DATA.accidents;
  return gasGet<AccidentRecord[]>('accidents', vehicleId ? { vehicleId } : undefined);
}

export async function apiAddAccident(r: Omit<AccidentRecord, '記録ID'>): Promise<{ success: boolean; id: string }> {
  if (!getGasUrl()) return { success: true, id: 'A' + Date.now() };
  return gasWrite('addAccident', r);
}

export async function apiDeleteAccident(id: string): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('deleteAccident', undefined, { id });
}

export async function apiGetStatistics(): Promise<Statistics> {
  if (!getGasUrl()) return MOCK_DATA.statistics;
  return gasGet<Statistics>('statistics');
}

export async function apiInitSheets(): Promise<{ success: boolean; message: string }> {
  if (!getGasUrl()) return { success: true, message: 'モックモードで初期化スキップ' };
  return gasWrite('init');
}

export interface GasConnectionInfo {
  spreadsheetUrl: string;
  scriptId: string;
  gasApiVersion: number;
}

export async function apiGetConnectionInfo(): Promise<GasConnectionInfo> {
  if (!getGasUrl()) {
    return { spreadsheetUrl: '', scriptId: '', gasApiVersion: GAS_API_VERSION };
  }
  return gasGet<GasConnectionInfo>('connectionInfo');
}

// ── ドライバーマスタ ─────────────────────────────────────────

export async function apiGetDrivers(): Promise<Driver[]> {
  if (!getGasUrl()) return MOCK_DATA.drivers;
  return gasGet<Driver[]>('drivers');
}

export async function apiAddDriver(d: Omit<Driver, 'ドライバーID' | '登録日'>): Promise<{ success: boolean; id: string }> {
  if (!getGasUrl()) return { success: true, id: 'D' + Date.now() };
  return gasWrite('addDriver', d);
}

export async function apiUpdateDriver(d: Driver): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('updateDriver', d);
}

export async function apiDeleteDriver(id: string): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('deleteDriver', undefined, { id });
}

// ── 運行記録 ────────────────────────────────────────────────

export async function apiGetOperationRecords(filters?: { vehicleId?: string; driverId?: string }): Promise<OperationRecord[]> {
  if (!getGasUrl()) {
    let r = [...MOCK_DATA.operationRecords];
    if (filters?.vehicleId) r = r.filter(x => x['車両ID'] === filters.vehicleId);
    if (filters?.driverId) r = r.filter(x => x['ドライバーID'] === filters.driverId);
    return r;
  }
  const extra: Record<string, string> = {};
  if (filters?.vehicleId) extra.vehicleId = filters.vehicleId;
  if (filters?.driverId) extra.driverId = filters.driverId;
  return gasGet<OperationRecord[]>('operationRecords', Object.keys(extra).length ? extra : undefined);
}

export async function apiAddOperationRecord(
  r: Omit<OperationRecord, '記録ID' | '走行距離(km)'>,
): Promise<{ success: boolean; id: string }> {
  if (!getGasUrl()) return { success: true, id: 'R' + Date.now() };
  return gasWrite('addOperationRecord', r);
}

export async function apiDeleteOperationRecord(id: string): Promise<{ success: boolean }> {
  if (!getGasUrl()) return { success: true };
  return gasWrite('deleteOperationRecord', undefined, { id });
}
