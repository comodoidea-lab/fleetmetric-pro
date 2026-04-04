import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { Maintenance } from './pages/Maintenance';
import { FuelRecords } from './pages/FuelRecords';
import { Accidents } from './pages/Accidents';
import { Reports } from './pages/Reports';
import { Setup } from './pages/Setup';
import { Login } from './pages/Login';
import { useStore } from './store/store';
import { isSkipAuth, isSetupComplete, getGasUrlFromFirestore, setGasUrl } from './config';

// アプリ全体の状態
type AppState = 'loading' | 'login' | 'setup' | 'app';

function AppRoutes() {
  const { loadAll } = useStore();
  const [appState, setAppState] = useState<AppState>('loading');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    // 開発バイパスモード（VITE_SKIP_AUTH=true）
    // GAS URL 未設定でもモックデータでアプリ画面を直接表示
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
        setFirebaseUser(null);
        return;
      }

      setFirebaseUser(user);

      // Firestore から GAS URL を取得（5秒タイムアウト付き）
      const gasUrl = await Promise.race([
        getGasUrlFromFirestore(user.uid),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]).catch(() => '');

      if (gasUrl) {
        // localStorageにも反映（gasApi.ts が参照するため）
        setGasUrl(gasUrl);
        setAppState('app');
      } else {
        setAppState('setup');
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  // データ自動同期（appになったタイミングで起動）
  useEffect(() => {
    if (appState !== 'app') return;
    loadAll();
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
    return <Login onComplete={() => { /* onAuthStateChanged が自動的に次の状態へ遷移 */ }} />;
  }

  // ③ セットアップ
  if (appState === 'setup') {
    return (
      <Setup
        firebaseUser={firebaseUser}
        onComplete={() => setAppState('app')}
      />
    );
  }

  // ④ メインアプリ
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
