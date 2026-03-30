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

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
