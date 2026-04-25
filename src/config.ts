// ============================================================
// FleetMetric Pro - Configuration
// ============================================================
// Firebase移行後は、クライアント設定のみを管理する。

import { db } from './firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { AppUserSettings } from './types/firestore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};

// ── Dev Auth Bypass ──────────────────────────────────────────
// .env.local に VITE_SKIP_AUTH=true を設定するとFirebase認証をスキップ（開発用）
export function isSkipAuth(): boolean {
  return (env.VITE_SKIP_AUTH as string) === 'true';
}

export function isDemoEnabled(): boolean {
  return (env.VITE_ENABLE_DEMO as string) !== 'false';
}

const DOMAIN_STORAGE_KEY    = 'fleetmetric_allowed_domain';
const ORGANIZATION_STORAGE_KEY = 'fleetmetric_organization_id';

// ── Allowed Domain（env / localStorage） ─────────────────────
export function getAllowedDomain(): string {
  return localStorage.getItem(DOMAIN_STORAGE_KEY) || (env.VITE_ALLOWED_DOMAIN as string) || '';
}

export function setAllowedDomain(domain: string): void {
  if (domain.trim()) {
    localStorage.setItem(DOMAIN_STORAGE_KEY, domain.trim().toLowerCase());
  } else {
    localStorage.removeItem(DOMAIN_STORAGE_KEY);
  }
}

export function getOrganizationId(): string {
  const fromStorage = localStorage.getItem(ORGANIZATION_STORAGE_KEY);
  if (fromStorage) return fromStorage;

  const fromEnv = (env.VITE_ORGANIZATION_ID as string) || '';
  if (fromEnv.trim()) return fromEnv.trim();

  const fromDomain = getAllowedDomain();
  if (fromDomain) return fromDomain.replace(/[^a-zA-Z0-9_-]/g, '_');

  return 'default';
}

function userSettingsRef(uid: string) {
  return doc(db, 'users', uid, 'settings', 'app');
}

export async function getAllowedDomainFromFirestore(uid: string): Promise<string> {
  try {
    const snap = await getDoc(userSettingsRef(uid));
    if (snap.exists()) {
      const data = snap.data() as AppUserSettings;
      return data.allowedDomain || '';
    }
    return '';
  } catch {
    return '';
  }
}

export async function saveAllowedDomainToFirestore(
  uid: string,
  allowedDomain: string,
): Promise<void> {
  const data: AppUserSettings = {
    allowedDomain: allowedDomain.trim().toLowerCase(),
  };
  await setDoc(
    userSettingsRef(uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
