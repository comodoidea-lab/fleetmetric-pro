import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { Maintenance } from './pages/Maintenance';
import { FuelRecords } from './pages/FuelRecords';
import { Accidents } from './pages/Accidents';
import { Reports } from './pages/Reports';
import { Drivers } from './pages/Drivers';
import { OperationRecords } from './pages/OperationRecords';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { OrganizationOnboarding } from './pages/OrganizationOnboarding';
import { useStore } from './store/store';
import { isDemoEnabled, isSkipAuth } from './config';
import { getMyOrganizationProfile } from './api/organizationApi';

// アプリ全体の状態
type AppState = 'loading' | 'login' | 'onboarding' | 'app' | 'demo';

function AppRoutes() {
  const { loadAll, enableDemoMode, disableDemoMode } = useStore();
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    // 開発バイパスモード（VITE_SKIP_AUTH=true）
    // 認証を省略してアプリ画面を直接表示
    if (isSkipAuth()) {
      setAppState('app');
      return;
    }

    // 古いiOS/PWA環境でFirebaseが無反応のままになるのを防ぐ10秒タイムアウト
    const authTimeout = setTimeout(() => setAppState('login'), 10000);

    // Firebase Auth 状態を監視
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);

      if (!user) {
        setAppState('login');
        return;
      }

      try {
        const profile = await getMyOrganizationProfile();
        setAppState(profile?.organizationId ? 'app' : 'onboarding');
      } catch {
        setAppState('onboarding');
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  // データ自動同期（appになったタイミングで起動）
  useEffect(() => {
    if (appState !== 'app' && appState !== 'demo') return;
    loadAll();
    if (appState === 'demo') return;
    const interval = setInterval(() => loadAll(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [appState]);

  // ① ローディング
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-label text-on-surface-variant">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ② ログイン
  if (appState === 'login') {
    return (
      <Login
        onComplete={() => { /* onAuthStateChanged が自動的に次の状態へ遷移 */ }}
        demoEnabled={isDemoEnabled()}
        onDemoStart={() => {
          enableDemoMode();
          setAppState('demo');
        }}
      />
    );
  }

  if (appState === 'onboarding') {
    return <OrganizationOnboarding onComplete={() => setAppState('app')} />;
  }

  const isDemo = appState === 'demo';

  // ③ メインアプリ
  return (
    <Layout>
      {isDemo && (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary-container/40 px-4 py-3 text-sm text-on-surface">
          <div className="flex items-center justify-between gap-3">
            <p>
              <span className="font-semibold">デモモード</span>
              {' '}現在の操作はプレビュー専用です。Firebaseの本番データには保存されません。
            </p>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-outline-variant/60 px-3 py-1.5 text-xs font-semibold hover:bg-surface-container"
              onClick={() => {
                disableDemoMode();
                setAppState('login');
              }}
            >
              ログインへ戻る
            </button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel" element={<FuelRecords />} />
        <Route path="/accidents" element={<Accidents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/operations" element={<OperationRecords />} />
        <Route path="/settings" element={<Settings />} />
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
