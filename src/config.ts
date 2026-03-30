// ============================================================
// FleetMetric Pro - Configuration
// ============================================================
// GAS URL の優先順位（開発バイパス時）:
//   1. localStorage（isSkipAuth() 時のみ使用）
//   2. 環境変数 VITE_GAS_URL（開発者向け）
// 通常時: Firestore に保存・取得

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};

// ── Dev Auth Bypass ──────────────────────────────────────────
// .env.local に VITE_SKIP_AUTH=true を設定するとFirebase認証をスキップ（開発用）
export function isSkipAuth(): boolean {
  return (env.VITE_SKIP_AUTH as string) === 'true';
}

// ── GAS URL（開発バイパス用・localStorageベース） ────────────
const GAS_URL_STORAGE_KEY   = 'fleetmetric_gas_url';
const DOMAIN_STORAGE_KEY    = 'fleetmetric_allowed_domain';
const envUrl = (env.VITE_GAS_URL as string) || '';

export function getGasUrl(): string {
  return localStorage.getItem(GAS_URL_STORAGE_KEY) || envUrl;
}

export function setGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
}

export function clearGasUrl(): void {
  localStorage.removeItem(GAS_URL_STORAGE_KEY);
}

export function isSetupComplete(): boolean {
  return !!getGasUrl();
}

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

// ── Firestore（通常時のGAS URL管理） ─────────────────────────
interface UserSettings {
  gasUrl: string;
  allowedDomain?: string;
}

function userSettingsRef(uid: string) {
  return doc(db, 'users', uid, 'settings', 'app');
}

export async function getGasUrlFromFirestore(uid: string): Promise<string> {
  try {
    const snap = await getDoc(userSettingsRef(uid));
    if (snap.exists()) {
      const data = snap.data() as UserSettings;
      return data.gasUrl || '';
    }
    return '';
  } catch {
    return '';
  }
}

export async function saveGasUrlToFirestore(
  uid: string,
  gasUrl: string,
  allowedDomain?: string
): Promise<void> {
  const data: UserSettings = { gasUrl: gasUrl.trim() };
  if (allowedDomain !== undefined) {
    data.allowedDomain = allowedDomain.trim().toLowerCase();
  }
  await setDoc(userSettingsRef(uid), data, { merge: true });
}

// ── 後方互換（既存コードで使用） ──────────────────────────────
export const GAS_URL = getGasUrl();
export const USE_MOCK_DATA = !GAS_URL;
