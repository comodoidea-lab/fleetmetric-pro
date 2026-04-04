import { useCallback, useEffect, useState } from 'react';
import { apiGetConnectionInfo } from '../api/gasApi';
import { getGasUrl } from '../config';
import { GAS_API_VERSION } from '../version';

export function useGasUpdateRequired() {
  const [loading, setLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const refresh = useCallback(() => {
    const url = getGasUrl();
    if (!url) {
      setLoading(false);
      setNeedsUpdate(false);
      return;
    }
    setLoading(true);
    apiGetConnectionInfo()
      .then((info) => {
        const v = typeof info.gasApiVersion === 'number' ? info.gasApiVersion : 0;
        setNeedsUpdate(v < GAS_API_VERSION);
      })
      .catch(() => {
        setNeedsUpdate(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, needsUpdate, refresh };
}
