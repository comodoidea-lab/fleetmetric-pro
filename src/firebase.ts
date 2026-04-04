// ============================================================
// FleetMetric Pro - Firebase 初期化
// ============================================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};

const firebaseConfig = {
  apiKey:      env.VITE_FIREBASE_API_KEY      as string,
  authDomain:  env.VITE_FIREBASE_AUTH_DOMAIN  as string,
  projectId:   env.VITE_FIREBASE_PROJECT_ID   as string,
  appId:       env.VITE_FIREBASE_APP_ID       as string,
};

// Firebase設定が揃っているか確認
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

// デバッグ用：認証ドメインを公開（秘密情報ではない）
export const firebaseAuthDomain = firebaseConfig.authDomain ?? '';
export const firebaseProjectId  = firebaseConfig.projectId  ?? '';

// VITE_SKIP_AUTH=true の場合はダミー設定でFirebaseを初期化（開発バイパス用）
const skipAuth = (env.VITE_SKIP_AUTH as string) === 'true';

const resolvedConfig = (isFirebaseConfigured && !skipAuth) ? firebaseConfig : {
  apiKey:     'dev-skip-auth-placeholder',
  authDomain: 'dev-placeholder.firebaseapp.com',
  projectId:  'dev-placeholder',
  appId:      '1:000000000000:web:000000000000',
};

const app  = initializeApp(resolvedConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
