import { useState, useEffect } from 'react';

const STORAGE_KEY = 'fleetmetric_multi_driver_mode';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** 複数ドライバーモード（デフォルト OFF）。ドライバー管理・運行記録ナビの表示に使用 */
export function useMultiDriverMode() {
  const [enabled, setEnabledState] = useState<boolean>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch { /* ignore */ }
  }, [enabled]);

  function setEnabled(next: boolean) {
    setEnabledState(next);
  }

  return { multiDriverMode: enabled, setMultiDriverMode: setEnabled };
}
