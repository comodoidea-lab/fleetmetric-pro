#!/usr/bin/env node
/**
 * Spreadsheet -> Firestore one-time migration script.
 *
 * Required env vars:
 * - GOOGLE_SERVICE_ACCOUNT_JSON: path to service account json
 * - SPREADSHEET_ID: source Google Spreadsheet ID
 *
 * Optional env vars:
 * - FIREBASE_PROJECT_ID: target Firebase project id
 * - DRY_RUN=true: do not write to Firestore
 */

import fs from 'node:fs';
import { google } from 'googleapis';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SHEETS = [
  { sheetName: '車両マスタ', collection: 'vehicles', idKey: '車両ID' },
  { sheetName: 'メンテナンス記録', collection: 'maintenanceRecords', idKey: '記録ID' },
  { sheetName: '給油記録', collection: 'fuelRecords', idKey: '記録ID' },
  { sheetName: '事故・修理履歴', collection: 'accidentRecords', idKey: '記録ID' },
  { sheetName: 'ドライバーマスタ', collection: 'drivers', idKey: 'ドライバーID' },
  { sheetName: '運行記録', collection: 'operationRecords', idKey: '記録ID' },
];

function readServiceAccount() {
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is required');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw);
}

function normalizeCell(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value;
  return String(value);
}

async function getSheetRows(authClient, spreadsheetId, range) {
  const sheetsApi = google.sheets({ version: 'v4', auth: authClient });
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return res.data.values ?? [];
}

async function main() {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID is required');
  const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === 'true';

  const serviceAccount = readServiceAccount();
  const authClient = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  const db = getFirestore();

  const summary = [];
  for (const target of SHEETS) {
    const rows = await getSheetRows(authClient, spreadsheetId, `${target.sheetName}!A:ZZ`);
    if (rows.length <= 1) {
      summary.push({ ...target, rows: 0, duplicates: 0 });
      continue;
    }

    const headers = rows[0].map((h) => String(h).trim());
    const body = rows.slice(1);
    const idSet = new Set();
    const docs = [];
    let duplicateCount = 0;

    for (const row of body) {
      const doc = {};
      headers.forEach((header, index) => {
        doc[header] = normalizeCell(row[index]);
      });
      const id = String(doc[target.idKey] || '').trim();
      if (!id) continue;
      if (idSet.has(id)) {
        duplicateCount += 1;
        continue;
      }
      idSet.add(id);
      docs.push({ id, data: doc });
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

    summary.push({ ...target, rows: docs.length, duplicates: duplicateCount });
  }

  console.log('Migration summary:');
  for (const s of summary) {
    console.log(`- ${s.sheetName} -> ${s.collection}: ${s.rows} rows (duplicates skipped: ${s.duplicates})`);
  }
  console.log(dryRun ? 'DRY_RUN completed. No writes were made.' : 'Migration completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
