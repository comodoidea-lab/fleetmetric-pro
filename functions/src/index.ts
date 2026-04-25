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
type UserProfile = {
  organizationId?: string;
  role?: 'admin' | 'member';
  email?: string;
  displayName?: string;
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

function toOrganizationId(email: string, uid: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return uid;
  return normalized.split('@')[1] || uid;
}

function createOrganizationId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `org_${Date.now()}_${rand}`;
}

function createInviteCode(): string {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  if (typeof value === 'string') return value;
  return '';
}

async function getUserProfile(uid: string): Promise<UserProfile> {
  const snap = await db.doc(`users/${uid}/profile/main`).get();
  if (!snap.exists) return {};
  return snap.data() as UserProfile;
}

function requireOrganizationId(profile: UserProfile): string {
  const organizationId = String(profile.organizationId || '').trim();
  if (!organizationId) {
    throw new HttpsError('failed-precondition', '組織に参加していません。');
  }
  return organizationId;
}

async function fetchScopedDocs(
  collectionName: string,
  organizationId: string,
  ownerUid: string,
): Promise<Array<Record<string, unknown>>> {
  const [orgSnap, ownerSnap] = await Promise.all([
    db.collection(collectionName).where('organizationId', '==', organizationId).get(),
    db.collection(collectionName).where('ownerUid', '==', ownerUid).get(),
  ]);
  const merged = new Map<string, Record<string, unknown>>();
  for (const snap of [orgSnap, ownerSnap]) {
    for (const row of snap.docs) {
      merged.set(row.id, row.data() as Record<string, unknown>);
    }
  }
  return Array.from(merged.values());
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

export const getDashboardData = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
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

export const getStatisticsData = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }
  const ownerUid = req.auth.uid;
  const profile = await getUserProfile(ownerUid);
  const organizationId = requireOrganizationId(profile);
  const [maintenance, fuel, accidents] = await Promise.all([
    fetchScopedDocs('maintenanceRecords', organizationId, ownerUid),
    fetchScopedDocs('fuelRecords', organizationId, ownerUid),
    fetchScopedDocs('accidentRecords', organizationId, ownerUid),
  ]);

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

export const createOrganization = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }
  const uid = req.auth.uid;
  const email = String(req.auth.token.email || '').toLowerCase();
  const displayName = String(req.auth.token.name || '');
  const name = String(req.data?.name || '').trim();
  if (!name) {
    throw new HttpsError('invalid-argument', '組織名は必須です。');
  }

  const profileRef = db.doc(`users/${uid}/profile/main`);
  const current = await profileRef.get();
  const currentOrgId = String(current.data()?.organizationId || '').trim();
  if (currentOrgId) {
    throw new HttpsError('failed-precondition', '既に組織へ参加しています。');
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
  batch.set(
    profileRef,
    {
      organizationId,
      role: 'admin',
      email,
      displayName,
      joinedAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  await batch.commit();
  return { organizationId };
});

export const issueInviteCode = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }
  const uid = req.auth.uid;
  const profile = await getUserProfile(uid);
  const organizationId = requireOrganizationId(profile);
  if (profile.role !== 'admin') {
    throw new HttpsError('permission-denied', '管理者のみ招待コードを発行できます。');
  }

  const expiresInDays = Number(req.data?.expiresInDays ?? 7);
  const validDays = Number.isFinite(expiresInDays) && expiresInDays > 0 ? Math.floor(expiresInDays) : 7;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 10; i += 1) {
    const code = createInviteCode();
    const ref = db.collection('inviteCodes').doc(code);
    const snap = await ref.get();
    if (snap.exists) continue;

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

  throw new HttpsError('resource-exhausted', '招待コードの発行に失敗しました。再試行してください。');
});

export const joinOrganizationByInviteCode = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }
  const uid = req.auth.uid;
  const email = String(req.auth.token.email || '').toLowerCase();
  const displayName = String(req.auth.token.name || '');
  const code = String(req.data?.code || '').replace(/\D/g, '').slice(0, 6);
  if (code.length !== 6) {
    throw new HttpsError('invalid-argument', '招待コードは6桁で入力してください。');
  }

  const profileRef = db.doc(`users/${uid}/profile/main`);
  const profile = await getUserProfile(uid);
  if (String(profile.organizationId || '').trim()) {
    throw new HttpsError('failed-precondition', '既に組織へ参加しています。');
  }

  const codeRef = db.doc(`inviteCodes/${code}`);
  const now = new Date();
  await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(codeRef);
    if (!inviteSnap.exists) {
      throw new HttpsError('not-found', '招待コードが見つかりません。');
    }
    const invite = inviteSnap.data() as {
      organizationId?: string;
      status?: string;
      expiresAt?: unknown;
      usedAt?: unknown;
    };
    const organizationId = String(invite.organizationId || '').trim();
    if (!organizationId) {
      throw new HttpsError('failed-precondition', '無効な招待コードです。');
    }
    if (String(invite.status || '') !== 'active') {
      throw new HttpsError('failed-precondition', 'この招待コードは既に使用済みです。');
    }
    if (invite.usedAt) {
      throw new HttpsError('failed-precondition', 'この招待コードは既に使用済みです。');
    }
    const expiresAt = toIso(invite.expiresAt);
    if (!expiresAt || new Date(expiresAt).getTime() < now.getTime()) {
      throw new HttpsError('deadline-exceeded', 'この招待コードは期限切れです。');
    }

    const orgRef = db.doc(`organizations/${organizationId}`);
    const orgSnap = await tx.get(orgRef);
    if (!orgSnap.exists) {
      throw new HttpsError('not-found', '組織が見つかりません。');
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
    tx.set(
      profileRef,
      {
        organizationId,
        role: 'member',
        email,
        displayName,
        joinedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      { merge: true },
    );
    tx.set(
      codeRef,
      {
        status: 'used',
        usedByUid: uid,
        usedAt: now.toISOString(),
      },
      { merge: true },
    );
  });

  const finalProfile = await getUserProfile(uid);
  return { organizationId: requireOrganizationId(finalProfile) };
});

export const runLegacySpreadsheetRestore = onCall({ region: 'asia-northeast1' }, async (req) => {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }

  const callerEmail = String(req.auth.token.email || '').toLowerCase();
  const callerUid = String(req.auth.uid || '');
  const callerProfile = await getUserProfile(callerUid);
  const organizationId = requireOrganizationId(callerProfile);

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
        record.ownerUid = callerUid;
        record.organizationId = organizationId;
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
  } catch (error) {
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
    throw new HttpsError('internal', `復旧に失敗しました: ${msg}`);
  }
});
