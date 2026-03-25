// ============================================================
// FleetMetric Pro - Configuration
// ============================================================
// GAS URL の優先順位:
//   1. localStorage（アプリ内セットアップで保存）
//   2. 環境変数 VITE_GAS_URL（開発者向け）
//   3. 未設定 → セットアップ画面を表示

const STORAGE_KEY = 'fleetmetric_gas_url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const envUrl = ((import.meta as any).env?.VITE_GAS_URL as string) || '';

export function getGasUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || envUrl;
}

export function setGasUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

export function clearGasUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSetupComplete(): boolean {
  return !!getGasUrl();
}

// 後方互換（既存コードで使用）
export const GAS_URL = getGasUrl();
export const USE_MOCK_DATA = !GAS_URL;
