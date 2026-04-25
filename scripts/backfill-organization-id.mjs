#!/usr/bin/env node
/**
 * Backfill organizationId for legacy Firestore documents.
 *
 * Required env vars:
 * - GOOGLE_SERVICE_ACCOUNT_JSON: path to service account json
 * - OWNER_UID: legacy owner uid to migrate
 * - TARGET_ORGANIZATION_ID: destination organization id
 *
 * Optional env vars:
 * - FIREBASE_PROJECT_ID: target Firebase project id
 * - DRY_RUN=true: do not write to Firestore
 * - PROFILE_ROLE: profile role to set for OWNER_UID (default: admin)
 */

import fs from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const TARGET_COLLECTIONS = [
  'vehicles',
  'maintenanceRecords',
  'fuelRecords',
  'accidentRecords',
  'drivers',
  'operationRecords',
  'restoreRuns',
];

function readServiceAccount() {
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is required');
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

async function commitBatches(db, updates, dryRun) {
  if (updates.length === 0 || dryRun) return;
  let batch = db.batch();
  let count = 0;
  for (const item of updates) {
    batch.set(item.ref, item.data, { merge: true });
    count += 1;
    if (count === 450) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

async function main() {
  const ownerUid = String(process.env.OWNER_UID || '').trim();
  const organizationId = String(process.env.TARGET_ORGANIZATION_ID || '').trim();
  if (!ownerUid) throw new Error('OWNER_UID is required');
  if (!organizationId) throw new Error('TARGET_ORGANIZATION_ID is required');
  const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
  const profileRole = String(process.env.PROFILE_ROLE || 'admin').trim() || 'admin';

  const serviceAccount = readServiceAccount();
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  const db = getFirestore();

  const summary = [];
  const now = new Date().toISOString();

  for (const collectionName of TARGET_COLLECTIONS) {
    const snap = await db.collection(collectionName).where('ownerUid', '==', ownerUid).get();
    let targetCount = 0;
    let alreadyAligned = 0;
    const updates = [];

    for (const row of snap.docs) {
      const data = row.data();
      if (String(data.organizationId || '') === organizationId) {
        alreadyAligned += 1;
        continue;
      }
      targetCount += 1;
      updates.push({
        ref: row.ref,
        data: {
          organizationId,
          ownerUid,
          updatedAt: now,
        },
      });
    }

    await commitBatches(db, updates, dryRun);
    summary.push({
      collection: collectionName,
      scanned: snap.size,
      updated: targetCount,
      alreadyAligned,
    });
  }

  const profileRef = db.doc(`users/${ownerUid}/profile/main`);
  const profileSnap = await profileRef.get();
  const profilePatch = {
    organizationId,
    role: profileSnap.data()?.role || profileRole,
    updatedAt: now,
  };
  if (!dryRun) {
    await profileRef.set(profilePatch, { merge: true });
  }

  console.log(`ownerUid: ${ownerUid}`);
  console.log(`target organizationId: ${organizationId}`);
  console.log(`mode: ${dryRun ? 'DRY_RUN' : 'WRITE'}`);
  console.log('');
  for (const item of summary) {
    console.log(
      `- ${item.collection}: scanned=${item.scanned}, updated=${item.updated}, alreadyAligned=${item.alreadyAligned}`,
    );
  }
  console.log('');
  console.log(
    dryRun
      ? 'DRY_RUN completed. No writes were made.'
      : 'Backfill completed successfully.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
