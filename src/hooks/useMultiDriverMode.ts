import { useState, useEffect } from 'react';

const STORAGE_KEY = 'fleetmetric_multi_driver_mode';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** 同一タブ内でも購読側へ伝える（ブラウザ標準の storage は他タブのみ発火） */
function dispatchStorageSync() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('storage'));
}

/** 複数ドライバーモード（デフォルト OFF）。ドライバー管理・運行記録ナビの表示に使用 */
export function useMultiDriverMode() {
  const [enabled, setEnabledState] = useState<boolean>(readStored);

  useEffect(() => {
    const syncFromStorage = () => {
      setEnabledState(readStored());
    };
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch { /* ignore */ }
    dispatchStorageSync();
  }, [enabled]);

  function setEnabled(next: boolean) {
    setEnabledState(next);
  }

  return { multiDriverMode: enabled, setMultiDriverMode: setEnabled };
}
