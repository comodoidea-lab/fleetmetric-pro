"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLegacySpreadsheetRestore = exports.getStatisticsData = exports.getDashboardData = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const googleapis_1 = require("googleapis");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const LEGACY_SHEET_MAP = [
    { sheetName: '車両マスタ', collection: 'vehicles', idKey: '車両ID' },
    { sheetName: 'メンテナンス記録', collection: 'maintenanceRecords', idKey: '記録ID' },
    { sheetName: '給油記録', collection: 'fuelRecords', idKey: '記録ID' },
    { sheetName: '事故・修理履歴', collection: 'accidentRecords', idKey: '記録ID' },
    { sheetName: 'ドライバーマスタ', collection: 'drivers', idKey: 'ドライバーID' },
    { sheetName: '運行記録', collection: 'operationRecords', idKey: '記録ID' },
];
function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}
function toDate(value) {
    if (typeof value !== 'string' || !value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
function normalizeCell(value) {
    if (value === undefined || value === null)
        return '';
    if (typeof value === 'string')
        return value.trim();
    if (typeof value === 'number')
        return value;
    return String(value);
}
async function getSheetRows(spreadsheetId, range) {
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return res.data.values ?? [];
}
exports.getDashboardData = (0, https_1.onCall)({ region: 'asia-northeast1' }, async () => {
    const [vehiclesSnap, maintenanceSnap, fuelSnap] = await Promise.all([
        db.collection('vehicles').get(),
        db.collection('maintenanceRecords').get(),
        db.collection('fuelRecords').get(),
    ]);
    const vehicles = vehiclesSnap.docs.map((d) => d.data());
    const maintenance = maintenanceSnap.docs.map((d) => d.data());
    const fuel = fuelSnap.docs.map((d) => d.data());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts = [];
    for (const vehicle of vehicles) {
        for (const [key, label] of [['車検期限', '車検'], ['法定点検期限', '法定点検']]) {
            const date = toDate(vehicle[key]);
            if (!date)
                continue;
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
exports.getStatisticsData = (0, https_1.onCall)({ region: 'asia-northeast1' }, async () => {
    const [maintenanceSnap, fuelSnap, accidentsSnap] = await Promise.all([
        db.collection('maintenanceRecords').get(),
        db.collection('fuelRecords').get(),
        db.collection('accidentRecords').get(),
    ]);
    const maintenance = maintenanceSnap.docs.map((d) => d.data());
    const fuel = fuelSnap.docs.map((d) => d.data());
    const accidents = accidentsSnap.docs.map((d) => d.data());
    const monthlyFuel = {};
    const vehicleMaintCost = {};
    const vehicleFuelCost = {};
    for (const row of fuel) {
        const month = String(row['日付'] ?? '').replace(/-/g, '/').slice(0, 7);
        if (month)
            monthlyFuel[month] = (monthlyFuel[month] || 0) + toNumber(row['費用(円)']);
        const vehicleName = String(row['車両名'] ?? '');
        if (vehicleName)
            vehicleFuelCost[vehicleName] = (vehicleFuelCost[vehicleName] || 0) + toNumber(row['費用(円)']);
    }
    for (const row of maintenance) {
        const vehicleName = String(row['車両名'] ?? '');
        if (vehicleName)
            vehicleMaintCost[vehicleName] = (vehicleMaintCost[vehicleName] || 0) + toNumber(row['費用(円)']);
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
exports.runLegacySpreadsheetRestore = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const callerEmail = String(req.auth.token.email || '').toLowerCase();
    const callerUid = String(req.auth.uid || '');
    const spreadsheetId = String(req.data?.spreadsheetId || '').trim();
    const dryRun = Boolean(req.data?.dryRun);
    if (!spreadsheetId) {
        throw new https_1.HttpsError('invalid-argument', 'spreadsheetId は必須です。');
    }
    const summary = [];
    try {
        for (const target of LEGACY_SHEET_MAP) {
            const rows = await getSheetRows(spreadsheetId, `${target.sheetName}!A:ZZ`);
            if (rows.length <= 1) {
                summary.push({ sheetName: target.sheetName, collection: target.collection, rows: 0, duplicates: 0 });
                continue;
            }
            const headers = rows[0].map((h) => String(h).trim());
            const body = rows.slice(1);
            const idSet = new Set();
            const docs = [];
            let duplicateCount = 0;
            for (const row of body) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = normalizeCell(row[index]);
                });
                const id = String(record[target.idKey] || '').trim();
                if (!id)
                    continue;
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
                if (opCount > 0)
                    await batch.commit();
            }
            summary.push({
                sheetName: target.sheetName,
                collection: target.collection,
                rows: docs.length,
                duplicates: duplicateCount,
            });
        }
        await db.collection('restoreRuns').add({
            uid: callerUid,
            email: callerEmail,
            spreadsheetId,
            dryRun,
            summary,
            status: 'success',
            createdAt: new Date().toISOString(),
        });
        return {
            success: true,
            dryRun,
            summary,
            message: dryRun
                ? 'ドライランが完了しました。書き込みは実行していません。'
                : '復旧処理が完了しました。',
        };
    }
    catch (error) {
        await db.collection('restoreRuns').add({
            uid: callerUid,
            email: callerEmail,
            spreadsheetId,
            dryRun,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            createdAt: new Date().toISOString(),
        });
        const msg = error instanceof Error ? error.message : '復旧処理で不明なエラーが発生しました。';
        throw new https_1.HttpsError('internal', `復旧に失敗しました: ${msg}`);
    }
});
