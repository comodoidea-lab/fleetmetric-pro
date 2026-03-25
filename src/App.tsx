import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { Maintenance } from './pages/Maintenance';
import { FuelRecords } from './pages/FuelRecords';
import { Accidents } from './pages/Accidents';
import { Reports } from './pages/Reports';
import { Setup } from './pages/Setup';
import { useStore } from './store/store';
import { isSetupComplete } from './config';

function AppRoutes() {
  const { loadAll } = useStore();
  // セットアップ完了済みかチェック（localStorageベース）
  const [setupDone, setSetupDone] = useState(isSetupComplete);

  function handleSetupComplete() {
    setSetupDone(true);
  }

  useEffect(() => {
    if (!setupDone) return;
    loadAll();
    const interval = setInterval(() => loadAll(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setupDone]);

  if (!setupDone) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel" element={<FuelRecords />} />
        <Route path="/accidents" element={<Accidents />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
