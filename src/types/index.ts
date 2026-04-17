// ============================================================
// FleetMetric Pro - TypeScript Types
// ============================================================

export interface Vehicle {
  '車両ID': string;
  '車両名': string;
  'ナンバー': string;
  'メーカー': string;
  '車種': string;
  '年式': string;
  '車検期限': string;
  '法定点検期限': string;
  'ステータス': '稼働中' | '整備中' | '廃車';
  '備考': string;
  '登録日': string;
  'アイコン'?: string;
}

export interface MaintenanceRecord {
  '記録ID': string;
  '車両ID': string;
  '車両名': string;
  '日付': string;
  '走行距離(km)': string | number;
  '作業内容': string;
  '費用(円)': string | number;
  '業者': string;
  '次回予定日': string;
  '備考': string;
}

export interface AccidentRecord {
  '記録ID': string;
  '車両ID': string;
  '車両名': string;
  '日付': string;
  '事故・修理内容': string;
  '損傷箇所': string;
  '費用(円)': string | number;
  '業者': string;
  '完了日': string;
  '備考': string;
}

export interface FuelRecord {
  '記録ID': string;
  '車両ID': string;
  '車両名': string;
  '日付': string;
  '走行距離(km)': string | number;
  '給油量(L)': string | number;
  '単価(円/L)': string | number;
  '費用(円)': string | number;
  'スタンド名': string;
  '備考': string;
}

/** ドライバーマスタ */
export interface Driver {
  'ドライバーID': string;
  '氏名': string;
  '電話番号': string;
  'ステータス': '稼働中' | '休止';
  '備考': string;
  '登録日': string;
}

/** 運行記録 */
export interface OperationRecord {
  '記録ID': string;
  '車両ID': string;
  '車両名': string;
  'ドライバーID': string;
  'ドライバー名': string;
  '出発日時': string;
  '帰着日時': string;
  '出発時走行距離(km)': string | number;
  '帰着時走行距離(km)': string | number;
  '走行距離(km)': string | number;
  '用途': '仕事' | 'プライベート';
  '目的地': string;
  '備考': string;
}

export interface Alert {
  type: 'danger' | 'warning';
  vehicleName: string;
  plateNumber: string;
  message: string;
  daysLeft: number;
  category: string;
}

export interface DashboardData {
  vehicleCount: number;
  activeCount: number;
  maintenanceCount: number;
  alerts: Alert[];
  recentMaintenance: MaintenanceRecord[];
  monthlyFuelCost: number;
}

export interface Statistics {
  monthlyFuel: Record<string, number>;
  vehicleMaintCost: Record<string, number>;
  vehicleFuelCost: Record<string, number>;
  totalFuelCost: number;
  totalMaintCost: number;
  totalAccidentCost: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
