"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLegacySpreadsheetRestore = exports.joinOrganizationByInviteCode = exports.issueInviteCode = exports.createOrganization = exports.getStatisticsData = exports.getDashboardData = void 0;
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
function toOrganizationId(email, uid) {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@'))
        return uid;
    return normalized.split('@')[1] || uid;
}
function createOrganizationId() {
    const rand = Math.random().toString(36).slice(2, 8);
    return `org_${Date.now()}_${rand}`;
}
function createInviteCode() {
    return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}
function toIso(value) {
    if (value && typeof value === 'object' && 'toDate' in value) {
        return (value.toDate()).toISOString();
    }
    if (typeof value === 'string')
        return value;
    return '';
}
async function getUserProfile(uid) {
    const snap = await db.doc(`users/${uid}/profile/main`).get();
    if (!snap.exists)
        return {};
    return snap.data();
}
function requireOrganizationId(profile) {
    const organizationId = String(profile.organizationId || '').trim();
    if (!organizationId) {
        throw new https_1.HttpsError('failed-precondition', '組織に参加していません。');
    }
    return organizationId;
}
async function fetchScopedDocs(collectionName, organizationId, ownerUid) {
    const [orgSnap, ownerSnap] = await Promise.all([
        db.collection(collectionName).where('organizationId', '==', organizationId).get(),
        db.collection(collectionName).where('ownerUid', '==', ownerUid).get(),
    ]);
    const merged = new Map();
    for (const snap of [orgSnap, ownerSnap]) {
        for (const row of snap.docs) {
            merged.set(row.id, row.data());
        }
    }
    return Array.from(merged.values());
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
exports.getDashboardData = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const ownerUid = req.auth.uid;
    const profile = await getUserProfile(ownerUid);
    const organizationId = requireOrganizationId(profile);
    const [vehicles, maintenance, fuel] = await Promise.all([
        fetchScopedDocs('vehicles', organizationId, ownerUid),
        fetchScopedDocs('maintenanceRecords', organizationId, ownerUid),
        fetchScopedDocs('fuelRecords', organizationId, ownerUid),
    ]);
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
exports.getStatisticsData = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const ownerUid = req.auth.uid;
    const profile = await getUserProfile(ownerUid);
    const organizationId = requireOrganizationId(profile);
    const [maintenance, fuel, accidents] = await Promise.all([
        fetchScopedDocs('maintenanceRecords', organizationId, ownerUid),
        fetchScopedDocs('fuelRecords', organizationId, ownerUid),
        fetchScopedDocs('accidentRecords', organizationId, ownerUid),
    ]);
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
exports.createOrganization = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const uid = req.auth.uid;
    const email = String(req.auth.token.email || '').toLowerCase();
    const displayName = String(req.auth.token.name || '');
    const name = String(req.data?.name || '').trim();
    if (!name) {
        throw new https_1.HttpsError('invalid-argument', '組織名は必須です。');
    }
    const profileRef = db.doc(`users/${uid}/profile/main`);
    const current = await profileRef.get();
    const currentOrgId = String(current.data()?.organizationId || '').trim();
    if (currentOrgId) {
        throw new https_1.HttpsError('failed-precondition', '既に組織へ参加しています。');
    }
    const organizationId = createOrganizationId();
    const now = new Date().toISOString();
    const orgRef = db.doc(`organizations/${organizationId}`);
    const memberRef = db.doc(`organizations/${organizationId}/members/${uid}`);
    const batch = db.batch();
    batch.set(orgRef, {
        organizationId,
        name,
        createdByUid: uid,
        createdAt: now,
    });
    batch.set(memberRef, {
        organizationId,
        uid,
        role: 'admin',
        email,
        displayName,
        joinedAt: now,
    });
    batch.set(profileRef, {
        organizationId,
        role: 'admin',
        email,
        displayName,
        joinedAt: now,
        updatedAt: now,
    }, { merge: true });
    await batch.commit();
    return { organizationId };
});
exports.issueInviteCode = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const uid = req.auth.uid;
    const profile = await getUserProfile(uid);
    const organizationId = requireOrganizationId(profile);
    if (profile.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', '管理者のみ招待コードを発行できます。');
    }
    const expiresInDays = Number(req.data?.expiresInDays ?? 7);
    const validDays = Number.isFinite(expiresInDays) && expiresInDays > 0 ? Math.floor(expiresInDays) : 7;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);
    for (let i = 0; i < 10; i += 1) {
        const code = createInviteCode();
        const ref = db.collection('inviteCodes').doc(code);
        const snap = await ref.get();
        if (snap.exists)
            continue;
        await ref.set({
            code,
            organizationId,
            createdByUid: uid,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active',
        });
        return {
            code,
            organizationId,
            expiresAt: expiresAt.toISOString(),
        };
    }
    throw new https_1.HttpsError('resource-exhausted', '招待コードの発行に失敗しました。再試行してください。');
});
exports.joinOrganizationByInviteCode = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const uid = req.auth.uid;
    const email = String(req.auth.token.email || '').toLowerCase();
    const displayName = String(req.auth.token.name || '');
    const code = String(req.data?.code || '').replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
        throw new https_1.HttpsError('invalid-argument', '招待コードは6桁で入力してください。');
    }
    const profileRef = db.doc(`users/${uid}/profile/main`);
    const profile = await getUserProfile(uid);
    if (String(profile.organizationId || '').trim()) {
        throw new https_1.HttpsError('failed-precondition', '既に組織へ参加しています。');
    }
    const codeRef = db.doc(`inviteCodes/${code}`);
    const now = new Date();
    await db.runTransaction(async (tx) => {
        const inviteSnap = await tx.get(codeRef);
        if (!inviteSnap.exists) {
            throw new https_1.HttpsError('not-found', '招待コードが見つかりません。');
        }
        const invite = inviteSnap.data();
        const organizationId = String(invite.organizationId || '').trim();
        if (!organizationId) {
            throw new https_1.HttpsError('failed-precondition', '無効な招待コードです。');
        }
        if (String(invite.status || '') !== 'active') {
            throw new https_1.HttpsError('failed-precondition', 'この招待コードは既に使用済みです。');
        }
        if (invite.usedAt) {
            throw new https_1.HttpsError('failed-precondition', 'この招待コードは既に使用済みです。');
        }
        const expiresAt = toIso(invite.expiresAt);
        if (!expiresAt || new Date(expiresAt).getTime() < now.getTime()) {
            throw new https_1.HttpsError('deadline-exceeded', 'この招待コードは期限切れです。');
        }
        const orgRef = db.doc(`organizations/${organizationId}`);
        const orgSnap = await tx.get(orgRef);
        if (!orgSnap.exists) {
            throw new https_1.HttpsError('not-found', '組織が見つかりません。');
        }
        const memberRef = db.doc(`organizations/${organizationId}/members/${uid}`);
        tx.set(memberRef, {
            organizationId,
            uid,
            role: 'member',
            email,
            displayName,
            joinedAt: now.toISOString(),
        });
        tx.set(profileRef, {
            organizationId,
            role: 'member',
            email,
            displayName,
            joinedAt: now.toISOString(),
            updatedAt: now.toISOString(),
        }, { merge: true });
        tx.set(codeRef, {
            status: 'used',
            usedByUid: uid,
            usedAt: now.toISOString(),
        }, { merge: true });
    });
    const finalProfile = await getUserProfile(uid);
    return { organizationId: requireOrganizationId(finalProfile) };
});
exports.runLegacySpreadsheetRestore = (0, https_1.onCall)({ region: 'asia-northeast1' }, async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const callerEmail = String(req.auth.token.email || '').toLowerCase();
    const callerUid = String(req.auth.uid || '');
    const callerProfile = await getUserProfile(callerUid);
    const organizationId = requireOrganizationId(callerProfile);
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
                record.ownerUid = callerUid;
                record.organizationId = organizationId;
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
            ownerUid: callerUid,
            organizationId,
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
            ownerUid: callerUid,
            organizationId,
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
