import { useEffect, useState } from 'react';
import {
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { getAllowedDomain } from '../config';

interface Props {
  onComplete: () => void;
}

// getRedirectResult にタイムアウトを付ける
function getRedirectResultWithTimeout(ms = 8000) {
  return Promise.race([
    getRedirectResult(auth),
    new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

export function Login({ onComplete }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase設定が不完全な場合は即座にエラー表示
    if (!isFirebaseConfigured) {
      setError('Firebase の設定が不完全です。Vercelの環境変数（VITE_FIREBASE_*）を確認してください。');
      setLoading(false);
      return;
    }

    getRedirectResultWithTimeout()
      .then(async (result) => {
        if (!result) {
          // 通常のページロード（リダイレクト前）
          setLoading(false);
          return;
        }
        // リダイレクトから戻ってきた → ドメインチェック
        const email = result.user.email ?? '';
        const allowedDomain = getAllowedDomain();
        if (allowedDomain) {
          const domain = email.split('@')[1];
          if (domain !== allowedDomain) {
            await signOut(auth);
            setError(`このアプリは @${allowedDomain} のアカウントのみ利用できます`);
            setLoading(false);
            return;
          }
        }
        onComplete();
      })
      .catch((err: unknown) => {
        const isTimeout = err instanceof Error && err.message === 'timeout';
        if (isTimeout) {
          setError('Firebase との接続がタイムアウトしました。Vercelの環境変数（VITE_FIREBASE_*）が正しく設定されているか確認してください。');
          setLoading(false);
          return;
        }
        const code = (err as { code?: string }).code;
        const messages: Record<string, string> = {
          'auth/unauthorized-domain':
            'このドメインはFirebaseに承認されていません。Firebase Console → Authentication → 承認済みドメインにVercelのURLを追加してください。',
          'auth/configuration-not-found':
            'Firebase の設定が見つかりません。Vercelの環境変数（VITE_FIREBASE_*）が正しく設定されているか確認してください。',
          'auth/network-request-failed':
            'ネットワークエラーが発生しました。接続を確認してください。',
          'auth/internal-error':
            'Firebase内部エラー。環境変数（VITE_FIREBASE_*）が正しく設定されているか確認してください。',
        };
        setError(messages[code ?? ''] ?? `ログインに失敗しました（${code ?? err}）`);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* ロゴ */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
          <span
            className="material-symbols-outlined text-white text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            directions_car
          </span>
        </div>
        <div>
          <p className="text-xl font-headline font-black text-primary leading-tight">FleetMetric Pro</p>
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
            Fleet Management System
          </p>
        </div>
      </div>

      {/* カード */}
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-headline font-bold text-on-surface">ログイン</h1>
          <p className="text-sm font-label text-on-surface-variant">
            Googleアカウントでサインインしてください
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-error-container text-on-error-container text-sm font-label">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>error</span>
            <span>{error}</span>
          </div>
        )}

        {/* ボタン */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-outline-variant/40 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? '確認中...' : 'Googleでサインイン'}
        </button>
      </div>

      <p className="text-xs font-label text-on-surface-variant mt-6 text-center max-w-sm leading-relaxed">
        認証情報は外部サーバーに送信されません。
        <br />
        ユーザー設定はFirebaseに安全に保存されます。
      </p>
    </div>
  );
}
