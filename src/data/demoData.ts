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

const DEMO_OWNER_UID = 'demo-user';

const vehicles: Vehicle[] = [
  {
    ownerUid: DEMO_OWNER_UID,
    '車両ID': 'V-DEMO-001',
    '車両名': 'ハイエース',
    'ナンバー': '品川 400 あ 12-34',
    'メーカー': 'トヨタ',
    '車種': 'バン',
    '年式': '2021',
    '車検期限': '2026-06-15',
    '法定点検期限': '2026-05-10',
    'ステータス': '稼働中',
    '備考': 'デモ用データ',
    '登録日': '2025-01-10',
  },
  {
    ownerUid: DEMO_OWNER_UID,
    '車両ID': 'V-DEMO-002',
    '車両名': 'プロボックス',
    'ナンバー': '品川 500 い 45-67',
    'メーカー': 'トヨタ',
    '車種': 'ワゴン',
    '年式': '2020',
    '車検期限': '2026-09-20',
    '法定点検期限': '2026-07-15',
    'ステータス': '整備中',
    '備考': 'デモ用データ',
    '登録日': '2025-02-03',
  },
];

const maintenance: MaintenanceRecord[] = [
  {
    ownerUid: DEMO_OWNER_UID,
    '記録ID': 'M-DEMO-001',
    '車両ID': 'V-DEMO-001',
    '車両名': 'ハイエース',
    '日付': '2026-03-01',
    '走行距離(km)': 45210,
    '作業内容': 'オイル交換',
    '費用(円)': 9800,
    '業者': 'サンプル整備工場',
    '次回予定日': '2026-06-01',
    '備考': '',
  },
  {
    ownerUid: DEMO_OWNER_UID,
    '記録ID': 'M-DEMO-002',
    '車両ID': 'V-DEMO-002',
    '車両名': 'プロボックス',
    '日付': '2026-02-20',
    '走行距離(km)': 38100,
    '作業内容': 'タイヤ交換',
    '費用(円)': 42000,
    '業者': 'サンプルタイヤ',
    '次回予定日': '2026-08-20',
    '備考': '冬タイヤから交換',
  },
];

const fuel: FuelRecord[] = [
  {
    ownerUid: DEMO_OWNER_UID,
    '記録ID': 'F-DEMO-001',
    '車両ID': 'V-DEMO-001',
    '車両名': 'ハイエース',
    '日付': '2026-04-01',
    '走行距離(km)': 46000,
    '給油量(L)': 45.2,
    '単価(円/L)': 171,
    '費用(円)': 7729,
    'スタンド名': 'サンプルSS',
    '備考': '',
  },
  {
    ownerUid: DEMO_OWNER_UID,
    '記録ID': 'F-DEMO-002',
    '車両ID': 'V-DEMO-002',
    '車両名': 'プロボックス',
    '日付': '2026-04-03',
    '走行距離(km)': 38920,
    '給油量(L)': 32.1,
    '単価(円/L)': 169,
    '費用(円)': 5425,
    'スタンド名': 'サンプルSS',
    '備考': '',
  },
];

const accidents: AccidentRecord[] = [
  {
    ownerUid: DEMO_OWNER_UID,
    '記録ID': 'A-DEMO-001',
    '車両ID': 'V-DEMO-002',
    '車両名': 'プロボックス',
    '日付': '2026-01-12',
    '事故・修理内容': '左ドア擦り傷修理',
    '損傷箇所': '左前ドア',
    '費用(円)': 28000,
    '業者': 'サンプル板金',
    '完了日': '2026-01-20',
    '備考': '',
  },
];

const drivers: Driver[] = [
  {
    ownerUid: DEMO_OWNER_UID,
    'ドライバーID': 'D-DEMO-001',
    '氏名': '山田 太郎',
    '電話番号': '090-1234-5678',
    'ステータス': '稼働中',
    '備考': 'デモ用',
    '登録日': '2025-01-10',
  },
  {
    ownerUid: DEMO_OWNER_UID,
    'ドライバーID': 'D-DEMO-002',
    '氏名': '佐藤 花子',
    '電話番号': '090-9876-5432',
    'ステータス': '休止',
    '備考': 'デモ用',
    '登録日': '2025-02-03',
  },
];

const operationRecords: OperationRecord[] = [
  {
    ownerUid: DEMO_OWNER_UID,
    '記録ID': 'R-DEMO-001',
    '車両ID': 'V-DEMO-001',
    '車両名': 'ハイエース',
    'ドライバーID': 'D-DEMO-001',
    'ドライバー名': '山田 太郎',
    '出発日時': '2026-04-05 09:00',
    '帰着日時': '2026-04-05 12:10',
    '出発時走行距離(km)': 46000,
    '帰着時走行距離(km)': 46124.3,
    '走行距離(km)': 124.3,
    '用途': '仕事',
    '目的地': '品川エリア配送',
    '備考': '',
  },
];

const dashboard: DashboardData = {
  vehicleCount: vehicles.length,
  activeCount: vehicles.filter((v) => v['ステータス'] === '稼働中').length,
  maintenanceCount: maintenance.length,
  alerts: [
    {
      type: 'warning',
      vehicleName: 'ハイエース',
      plateNumber: '品川 400 あ 12-34',
      message: 'あと59日',
      daysLeft: 59,
      category: '車検',
    },
  ],
  recentMaintenance: maintenance,
  monthlyFuelCost: fuel.reduce((sum, x) => sum + Number(x['費用(円)'] || 0), 0),
};

const statistics: Statistics = {
  monthlyFuel: {
    '2026-04': 13154,
  },
  vehicleMaintCost: {
    ハイエース: 9800,
    プロボックス: 42000,
  },
  vehicleFuelCost: {
    ハイエース: 7729,
    プロボックス: 5425,
  },
  totalFuelCost: 13154,
  totalMaintCost: 51800,
  totalAccidentCost: 28000,
};

export function createDemoSnapshot() {
  return {
    dashboard: { ...dashboard, alerts: [...dashboard.alerts], recentMaintenance: maintenance.map((x) => ({ ...x })) },
    vehicles: vehicles.map((x) => ({ ...x })),
    maintenance: maintenance.map((x) => ({ ...x })),
    fuel: fuel.map((x) => ({ ...x })),
    accidents: accidents.map((x) => ({ ...x })),
    statistics: {
      ...statistics,
      monthlyFuel: { ...statistics.monthlyFuel },
      vehicleMaintCost: { ...statistics.vehicleMaintCost },
      vehicleFuelCost: { ...statistics.vehicleFuelCost },
    },
    drivers: drivers.map((x) => ({ ...x })),
    operationRecords: operationRecords.map((x) => ({ ...x })),
  };
}
