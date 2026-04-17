import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';

initializeApp();
const db = getFirestore();

type Vehicle = Record<string, unknown>;
type MaintenanceRecord = Record<string, unknown>;
type FuelRecord = Record<string, unknown>;
type AccidentRecord = Record<string, unknown>;
type SheetMap = {
  sheetName: string;
  collection: string;
  idKey: string;
};

const LEGACY_SHEET_MAP: SheetMap[] = [
  { sheetName: '車両マスタ', collection: 'vehicles', idKey: '車両ID' },
  { sheetName: 'メンテナンス記録', collection: 'maintenanceRecords', idKey: '記録ID' },
  { sheetName: '給油記録', collection: 'fuelRecords', idKey: '記録ID' },
  { sheetName: '事故・修理履歴', collection: 'accidentRecords', idKey: '記録ID' },
  { sheetName: 'ドライバーマスタ', collection: 'drivers', idKey: 'ドライバーID' },
  { sheetName: '運行記録', collection: 'operationRecords', idKey: '記録ID' },
];

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCell(value: unknown): string | number {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value;
  return String(value);
}

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function getSheetRows(spreadsheetId: string, range: string): Promise<unknown[][]> {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return res.data.values ?? [];
}

export const getDashboardData = onCall({ region: 'asia-northeast1' }, async () => {
  const [vehiclesSnap, maintenanceSnap, fuelSnap] = await Promise.all([
    db.collection('vehicles').get(),
    db.collection('maintenanceRecords').get(),
    db.collection('fuelRecords').get(),
  ]);

  const vehicles = vehiclesSnap.docs.map((d) => d.data() as Vehicle);
  const maintenance = maintenanceSnap.docs.map((d) => d.data() as MaintenanceRecord);
  const fuel = fuelSnap.docs.map((d) => d.data() as FuelRecord);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts: Array<{
    type: 'danger' | 'warning';
    vehicleName: string;
    plateNumber: string;
    message: string;
    daysLeft: number;
    category: string;
  }> = [];

  for (const vehicle of vehicles) {
    for (const [key, label] of [['車検期限', '車検'], ['法定点検期限', '法定点検']] as const) {
      const date = toDate(vehicle[key]);
      if (!date) continue;
      const daysLeft = Math.floor((date.getTime() - today.getTime()) / 86400000);
      if (daysLeft < 0 || daysLeft <= 30) {
        alerts.push({
          type: daysLeft < 0 ? 'danger' : 'warning',
          vehicleName: String(vehicle['車両名'] ?? ''),
          plateNumber: String(vehicle['ナンバー'] ?? ''),
          message: daysLeft < 0 ? `期限切れ（${Math.abs(daysLeft)}日経過）` : `あと${daysLeft}日`,
          daysLeft,
          category: label,
        });
      }
    }
  }

  const thisMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }).slice(0, 7);
  const monthlyFuelCost = fuel
    .filter((x) => String(x['日付'] ?? '').replace(/-/g, '/').startsWith(thisMonth))
    .reduce((sum, x) => sum + toNumber(x['費用(円)']), 0);

  return {
    vehicleCount: vehicles.length,
    activeCount: vehicles.filter((v) => v['ステータス'] === '稼働中').length,
    maintenanceCount: maintenance.length,
    alerts: alerts.sort((a, b) => a.daysLeft - b.daysLeft),
    recentMaintenance: maintenance
      .sort((a, b) => String(b['日付'] ?? '').localeCompare(String(a['日付'] ?? '')))
      .slice(0, 5),
    monthlyFuelCost,
  };
});

export const getStatisticsData = onCall({ region: 'asia-northeast1' }, async () => {
  const [maintenanceSnap, fuelSnap, accidentsSnap] = await Promise.all([
    db.collection('maintenanceRecords').get(),
    db.collection('fuelRecords').get(),
    db.collection('accidentRecords').get(),
  ]);

  const maintenance = maintenanceSnap.docs.map((d) => d.data() as MaintenanceRecord);
  const fuel = fuelSnap.docs.map((d) => d.data() as FuelRecord);
  const accidents = accidentsSnap.docs.map((d) => d.data() as AccidentRecord);

  const monthlyFuel: Record<string, number> = {};
  const vehicleMaintCost: Record<string, number> = {};
  const vehicleFuelCost: Record<string, number> = {};

  for (const row of fuel) {
    const month = String(row['日付'] ?? '').replace(/-/g, '/').slice(0, 7);
    if (month) monthlyFuel[month] = (monthlyFuel[month] || 0) + toNumber(row['費用(円)']);
    const vehicleName = String(row['車両名'] ?? '');
    if (vehicleName) vehicleFuelCost[vehicleName] = (vehicleFuelCost[vehicleName] || 0) + toNumber(row['費用(円)']);
  }

  for (const row of maintenance) {
    const vehicleName = String(row['車両名'] ?? '');
    if (vehicleName) vehicleMaintCost[vehicleName] = (vehicleMaintCost[vehicleName] || 0) + toNumber(row['費用(円)']);
  }

  return {
    monthlyFuel,
    vehicleMaintCost,
    vehicleFuelCost,
    totalFuelCost: fuel.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
    totalMaintCost: maintenance.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
    totalAccidentCost: accidents.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
  };
});

export const runLegacySpreadsheetRestore = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }

  const callerEmail = String(req.auth.token.email || '').toLowerCase();
  const admins = parseAdminEmails();
  if (admins.size > 0 && !admins.has(callerEmail)) {
    throw new HttpsError('permission-denied', '管理者のみ実行できます。');
  }

  const spreadsheetId = String(req.data?.spreadsheetId || '').trim();
  const dryRun = Boolean(req.data?.dryRun);
  if (!spreadsheetId) {
    throw new HttpsError('invalid-argument', 'spreadsheetId は必須です。');
  }

  const summary: Array<{
    sheetName: string;
    collection: string;
    rows: number;
    duplicates: number;
  }> = [];

  try {
    for (const target of LEGACY_SHEET_MAP) {
      const rows = await getSheetRows(spreadsheetId, `${target.sheetName}!A:ZZ`);
      if (rows.length <= 1) {
        summary.push({ sheetName: target.sheetName, collection: target.collection, rows: 0, duplicates: 0 });
        continue;
      }

      const headers = rows[0].map((h) => String(h).trim());
      const body = rows.slice(1);
      const idSet = new Set<string>();
      const docs: Array<{ id: string; data: Record<string, unknown> }> = [];
      let duplicateCount = 0;

      for (const row of body) {
        const record: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          record[header] = normalizeCell((row as unknown[])[index]);
        });
        const id = String(record[target.idKey] || '').trim();
        if (!id) continue;
        if (idSet.has(id)) {
          duplicateCount += 1;
          continue;
        }
        idSet.add(id);
        docs.push({ id, data: record });
      }

      if (!dryRun && docs.length > 0) {
        let batch = db.batch();
        let opCount = 0;
        for (const item of docs) {
          batch.set(db.collection(target.collection).doc(item.id), item.data, { merge: true });
          opCount += 1;
          if (opCount === 450) {
            await batch.commit();
            batch = db.batch();
            opCount = 0;
          }
        }
        if (opCount > 0) await batch.commit();
      }

      summary.push({
        sheetName: target.sheetName,
        collection: target.collection,
        rows: docs.length,
        duplicates: duplicateCount,
      });
    }

    return {
      success: true,
      dryRun,
      summary,
      message: dryRun
        ? 'ドライランが完了しました。書き込みは実行していません。'
        : '復旧処理が完了しました。',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '復旧処理で不明なエラーが発生しました。';
    throw new HttpsError('internal', `復旧に失敗しました: ${msg}`);
  }
});
