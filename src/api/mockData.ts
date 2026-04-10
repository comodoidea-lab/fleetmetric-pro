// ============================================================
// FleetMetric Pro - Mock Data (for localhost preview)
// ============================================================

import {
  Vehicle, MaintenanceRecord, FuelRecord, AccidentRecord,
  Driver, OperationRecord,
  DashboardData, Statistics,
} from '../types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '/');
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const subDays = (d: Date, n: number) => addDays(d, -n);

export const MOCK_VEHICLES: Vehicle[] = [
  { '車両ID': 'V001', '車両名': 'トヨタ プリウス', 'ナンバー': '品川 300 あ 1234', 'メーカー': 'トヨタ', '車種': 'プリウス', '年式': '2021', '車検期限': fmt(addDays(today, 45)), '法定点検期限': fmt(addDays(today, 120)), 'ステータス': '稼働中', '備考': '', '登録日': '2021/04/01', 'アイコン': 'directions_car' },
  { '車両ID': 'V002', '車両名': 'ホンダ フィット', 'ナンバー': '新宿 500 い 5678', 'メーカー': 'ホンダ', '車種': 'フィット', '年式': '2020', '車検期限': fmt(addDays(today, 20)), '法定点検期限': fmt(addDays(today, 200)), 'ステータス': '稼働中', '備考': '', '登録日': '2020/06/15', 'アイコン': 'directions_car' },
  { '車両ID': 'V003', '車両名': '日産 ノート', 'ナンバー': '渋谷 100 う 9012', 'メーカー': '日産', '車種': 'ノート', '年式': '2019', '車検期限': fmt(subDays(today, 5)), '法定点検期限': fmt(addDays(today, 60)), 'ステータス': '整備中', '備考': 'オイル交換待ち', '登録日': '2019/09/01', 'アイコン': 'directions_car' },
  { '車両ID': 'V004', '車両名': 'スズキ スイフト', 'ナンバー': '世田谷 400 え 3456', 'メーカー': 'スズキ', '車種': 'スイフト', '年式': '2022', '車検期限': fmt(addDays(today, 300)), '法定点検期限': fmt(addDays(today, 400)), 'ステータス': '稼働中', '備考': '', '登録日': '2022/01/10', 'アイコン': 'directions_car' },
  { '車両ID': 'V005', '車両名': 'マツダ デミオ', 'ナンバー': '杉並 200 お 7890', 'メーカー': 'マツダ', '車種': 'デミオ', '年式': '2018', '車検期限': fmt(addDays(today, 8)), '法定点検期限': fmt(subDays(today, 10)), 'ステータス': '稼働中', '備考': '廃車予定', '登録日': '2018/03/20', 'アイコン': 'directions_car' },
];

export const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  { '記録ID': 'M001', '車両ID': 'V001', '車両名': 'トヨタ プリウス', '日付': fmt(subDays(today, 15)), '走行距離(km)': 45230, '作業内容': 'オイル交換', '費用(円)': 8800, '業者': 'トヨタディーラー', '次回予定日': fmt(addDays(today, 90)), '備考': '' },
  { '記録ID': 'M002', '車両ID': 'V002', '車両名': 'ホンダ フィット', '日付': fmt(subDays(today, 30)), '走行距離(km)': 32100, '作業内容': '法定点検', '費用(円)': 45000, '業者': 'ホンダカーズ', '次回予定日': fmt(addDays(today, 335)), '備考': 'ブレーキパッド交換込み' },
  { '記録ID': 'M003', '車両ID': 'V003', '車両名': '日産 ノート', '日付': fmt(subDays(today, 5)), '走行距離(km)': 68900, '作業内容': 'タイヤ交換', '費用(円)': 52000, '業者': 'イエローハット', '次回予定日': fmt(addDays(today, 365)), '備考': '4本全交換' },
  { '記録ID': 'M004', '車両ID': 'V004', '車両名': 'スズキ スイフト', '日付': fmt(subDays(today, 60)), '走行距離(km)': 12500, '作業内容': 'オイル交換', '費用(円)': 7500, '業者': 'オートバックス', '次回予定日': fmt(addDays(today, 60)), '備考': '' },
  { '記録ID': 'M005', '車両ID': 'V005', '車両名': 'マツダ デミオ', '日付': fmt(subDays(today, 90)), '走行距離(km)': 95400, '作業内容': '車検', '費用(円)': 120000, '業者': 'マツダオート', '次回予定日': fmt(addDays(today, 730)), '備考': '' },
];

export const MOCK_FUEL: FuelRecord[] = [
  { '記録ID': 'F001', '車両ID': 'V001', '車両名': 'トヨタ プリウス', '日付': fmt(subDays(today, 3)), '走行距離(km)': 45500, '給油量(L)': 30, '単価(円/L)': 172, '費用(円)': 5160, 'スタンド名': 'ENEOS 渋谷店', '備考': '' },
  { '記録ID': 'F002', '車両ID': 'V002', '車両名': 'ホンダ フィット', '日付': fmt(subDays(today, 7)), '走行距離(km)': 32300, '給油量(L)': 35, '単価(円/L)': 170, '費用(円)': 5950, 'スタンド名': 'Shell 新宿店', '備考': '' },
  { '記録ID': 'F003', '車両ID': 'V001', '車両名': 'トヨタ プリウス', '日付': fmt(subDays(today, 20)), '走行距離(km)': 45100, '給油量(L)': 28, '単価(円/L)': 168, '費用(円)': 4704, 'スタンド名': 'コスモ石油 目黒店', '備考': '' },
  { '記録ID': 'F004', '車両ID': 'V004', '車両名': 'スズキ スイフト', '日付': fmt(subDays(today, 10)), '走行距離(km)': 12800, '給油量(L)': 25, '単価(円/L)': 173, '費用(円)': 4325, 'スタンド名': 'エネオス 世田谷店', '備考': '' },
  { '記録ID': 'F005', '車両ID': 'V003', '車両名': '日産 ノート', '日付': fmt(subDays(today, 14)), '走行距離(km)': 69100, '給油量(L)': 40, '単価(円/L)': 171, '費用(円)': 6840, 'スタンド名': 'JA-SS 渋谷', '備考': '' },
];

export const MOCK_ACCIDENTS: AccidentRecord[] = [
  { '記録ID': 'A001', '車両ID': 'V003', '車両名': '日産 ノート', '日付': fmt(subDays(today, 120)), '事故・修理内容': '追突事故（軽微）', '損傷箇所': 'リアバンパー', '費用(円)': 85000, '業者': '板金塗装 山田', '完了日': fmt(subDays(today, 100)), '備考': '相手方保険対応' },
];

export const MOCK_DRIVERS: Driver[] = [
  { 'ドライバーID': 'D001', '氏名': '山田 太郎', '電話番号': '090-1111-2222', 'ステータス': '稼働中', '備考': '', '登録日': '2024/01/10' },
  { 'ドライバーID': 'D002', '氏名': '佐藤 花子', '電話番号': '080-3333-4444', 'ステータス': '稼働中', '備考': '', '登録日': '2024/03/05' },
  { 'ドライバーID': 'D003', '氏名': '鈴木 一郎', '電話番号': '070-5555-6666', 'ステータス': '休止', '備考': '休職中', '登録日': '2023/11/20' },
];

const opDepart = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const MOCK_OPERATION_RECORDS: OperationRecord[] = [
  {
    '記録ID': 'R001',
    '車両ID': 'V001',
    '車両名': 'トヨタ プリウス',
    'ドライバーID': 'D001',
    'ドライバー名': '山田 太郎',
    '出発日時': opDepart(subDays(today, 1)),
    '帰着日時': opDepart(subDays(today, 1)),
    '出発時走行距離(km)': 45200,
    '帰着時走行距離(km)': 45245,
    '走行距離(km)': 45,
    '用途': '仕事',
    '目的地': '港区オフィス',
    '備考': '',
  },
  {
    '記録ID': 'R002',
    '車両ID': 'V002',
    '車両名': 'ホンダ フィット',
    'ドライバーID': 'D002',
    'ドライバー名': '佐藤 花子',
    '出発日時': opDepart(subDays(today, 3)),
    '帰着日時': opDepart(subDays(today, 3)),
    '出発時走行距離(km)': 32000,
    '帰着時走行距離(km)': 32080,
    '走行距離(km)': 80,
    '用途': 'プライベート',
    '目的地': 'スーパー',
    '備考': '',
  },
];

const alerts: import('../types').Alert[] = MOCK_VEHICLES.flatMap(v => {
  const items: import('../types').Alert[] = [];
  const checkDate = (field: '車検期限' | '法定点検期限', label: string) => {
    if (!v[field]) return;
    const d = new Date(v[field]);
    const daysLeft = Math.floor((d.getTime() - today.getTime()) / 86400000);
    if (daysLeft < 0) {
      items.push({ type: 'danger', vehicleName: v['車両名'], plateNumber: v['ナンバー'], message: `期限切れ（${Math.abs(daysLeft)}日経過）`, daysLeft, category: label });
    } else if (daysLeft <= 30) {
      items.push({ type: 'warning', vehicleName: v['車両名'], plateNumber: v['ナンバー'], message: `あと${daysLeft}日`, daysLeft, category: label });
    }
  };
  checkDate('車検期限', '車検');
  checkDate('法定点検期限', '法定点検');
  return items;
}).sort((a, b) => a.daysLeft - b.daysLeft);

export const MOCK_DATA = {
  vehicles: MOCK_VEHICLES,
  maintenance: MOCK_MAINTENANCE,
  fuel: MOCK_FUEL,
  accidents: MOCK_ACCIDENTS,
  drivers: MOCK_DRIVERS,
  operationRecords: MOCK_OPERATION_RECORDS,
  dashboard: {
    vehicleCount: MOCK_VEHICLES.length,
    activeCount: MOCK_VEHICLES.filter(v => v['ステータス'] === '稼働中').length,
    maintenanceCount: MOCK_MAINTENANCE.length,
    alerts,
    recentMaintenance: MOCK_MAINTENANCE.slice(0, 5),
    monthlyFuelCost: MOCK_FUEL
      .filter(r => String(r['日付']).startsWith(fmt(today).substring(0, 7)))
      .reduce((s, r) => s + Number(r['費用(円)']), 0) || 26979,
  } as DashboardData,
  statistics: {
    monthlyFuel: {
      [fmt(subDays(today, 150)).substring(0, 7)]: 142000,
      [fmt(subDays(today, 120)).substring(0, 7)]: 138000,
      [fmt(subDays(today, 90)).substring(0, 7)]: 155000,
      [fmt(subDays(today, 60)).substring(0, 7)]: 148000,
      [fmt(subDays(today, 30)).substring(0, 7)]: 162000,
      [fmt(today).substring(0, 7)]: 26979,
    },
    vehicleMaintCost: {
      'トヨタ プリウス': 8800,
      'ホンダ フィット': 45000,
      '日産 ノート': 52000,
      'スズキ スイフト': 7500,
      'マツダ デミオ': 120000,
    },
    vehicleFuelCost: {
      'トヨタ プリウス': 9864,
      'ホンダ フィット': 5950,
      '日産 ノート': 6840,
      'スズキ スイフト': 4325,
    },
    totalFuelCost: 26979,
    totalMaintCost: 233300,
    totalAccidentCost: 85000,
  } as Statistics,
};
