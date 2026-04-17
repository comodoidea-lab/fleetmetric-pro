import { useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { createOrganization, joinOrganizationByInviteCode } from '../api/organizationApi';

interface Props {
  onComplete: () => void;
}

export function OrganizationOnboarding({ onComplete }: Props) {
  const [organizationName, setOrganizationName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  const email = auth.currentUser?.email ?? '';

  const normalizedCode = useMemo(
    () => inviteCode.replace(/\D/g, '').slice(0, 6),
    [inviteCode],
  );

  async function handleCreate() {
    const name = organizationName.trim();
    if (!name) {
      setError('組織名を入力してください。');
      return;
    }
    setBusy('create');
    setError('');
    try {
      await createOrganization(name);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : '組織の作成に失敗しました。');
    } finally {
      setBusy(null);
    }
  }

  async function handleJoin() {
    if (normalizedCode.length !== 6) {
      setError('招待コードは6桁で入力してください。');
      return;
    }
    setBusy('join');
    setError('');
    try {
      await joinOrganizationByInviteCode(normalizedCode);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : '組織への参加に失敗しました。');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-headline font-bold text-on-surface">組織を設定</h1>
          <p className="text-sm font-label text-on-surface-variant">
            初回ログインです。組織を作成するか、招待コードで参加してください。
          </p>
          {email && <p className="text-xs font-label text-on-surface-variant">{email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-label uppercase tracking-wider text-on-surface-variant">
            新しい組織を作成
          </label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="例: FleetMetric Tokyo"
            className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30"
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={busy !== null}
            className="w-full py-2.5 rounded-full text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {busy === 'create' ? '作成中...' : '組織を作成する'}
          </button>
        </div>

        <div className="pt-1 border-t border-outline-variant/20 space-y-2">
          <label className="text-xs font-label uppercase tracking-wider text-on-surface-variant">
            招待コードで参加
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={normalizedCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="6桁の招待コード"
            className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm font-label tracking-[0.25em] text-center focus:outline-none focus:ring-2 focus:ring-surface-tint/30"
          />
          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={busy !== null}
            className="w-full py-2.5 rounded-full text-sm font-semibold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors disabled:opacity-60"
          >
            {busy === 'join' ? '参加中...' : '招待コードで参加する'}
          </button>
        </div>

        {error && (
          <p className="text-sm font-label text-error bg-error-container/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void signOut(auth)}
          className="w-full text-xs font-semibold text-on-surface-variant hover:text-on-surface underline underline-offset-2"
        >
          別のアカウントでログインし直す
        </button>
      </div>
    </div>
  );
}
