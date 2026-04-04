import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { GasUpdateModal } from '../components/GasUpdateModal';
import { useGasUpdateRequired } from '../hooks/useGasUpdateRequired';
import { useStore } from '../store/store';

type GasUpdateContextValue = {
  openGasUpdateModal: () => void;
  needsGasUpdate: boolean;
  gasUpdateLoading: boolean;
  refreshGasVersion: () => void;
};

const GasUpdateContext = createContext<GasUpdateContextValue | null>(null);

export function GasUpdateModalProvider({ children }: { children: ReactNode }) {
  const { loading, needsUpdate, refresh: refetchVersion } = useGasUpdateRequired();
  const loadAll = useStore((s) => s.loadAll);
  const [modalOpen, setModalOpen] = useState(false);
  const openGasUpdateModal = useCallback(() => setModalOpen(true), []);

  const refreshGasVersion = useCallback(() => {
    refetchVersion();
    void loadAll();
  }, [refetchVersion, loadAll]);

  useEffect(() => {
    if (modalOpen && !loading && !needsUpdate) {
      setModalOpen(false);
    }
  }, [modalOpen, loading, needsUpdate]);

  const value = useMemo(
    () => ({
      openGasUpdateModal,
      needsGasUpdate: needsUpdate,
      gasUpdateLoading: loading,
      refreshGasVersion,
    }),
    [openGasUpdateModal, needsUpdate, loading, refreshGasVersion],
  );

  return (
    <GasUpdateContext.Provider value={value}>
      {children}
      {modalOpen && (
        <GasUpdateModal
          onClose={() => setModalOpen(false)}
          onRecheck={refreshGasVersion}
        />
      )}
    </GasUpdateContext.Provider>
  );
}

export function useGasUpdateContext() {
  const ctx = useContext(GasUpdateContext);
  if (!ctx) {
    throw new Error('useGasUpdateContext must be used within GasUpdateModalProvider');
  }
  return ctx;
}
