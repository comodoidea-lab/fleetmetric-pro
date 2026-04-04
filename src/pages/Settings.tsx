import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useStore } from '../store/store';
import { getGasUrl, clearGasUrl, isSkipAuth, saveGasUrlToFirestore } from '../config';
import { apiInitSheets, apiBackupNow, apiSetupBackupTrigger } from '../api/gasApi';
import { useTheme, THEMES } from '../hooks/useTheme';
import { DialogModal } from '../components/DialogModal';
import { ManualModal } from '../components/ManualModal';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-outline-variant/20">
        <p className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">{title}</p>
      </div>
      <div className="divide-y divide-outline-variant/10">{children}</div>
    </section>
  );
}

function Row({
  icon, label, desc, onClick, danger, chevron = true, rightEl,
}: {
  icon: string;
  label: string;
  desc?: string;
  onClick?: () => void;
  danger?: boolean;
  chevron?: boolean;
  rightEl?: React.ReactNode;
}) {
  const base = 'flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors';
  const colorCls = danger
    ? 'text-error hover:bg-error-container/20'
    : 'text-on-surface hover:bg-surface-container';

  return (
    <button onClick={onClick} className={`${base} ${colorCls}`} disabled={!onClick && !rightEl}>
      <span
        className={`material-symbols-outlined flex-shrink-0 ${danger ? 'text-error' : 'text-primary'}`}
        style={{ fontSize: 20 }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-label">{label}</p>
        {desc && <p className="text-xs font-label text-on-surface-variant mt-0.5 break-all">{desc}</p>}
      </div>
      {rightEl}
      {chevron && onClick && !rightEl && (
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
          chevron_right
        </span>
      )}
    </button>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { loadAll, vehicles, maintenance, fuel, accidents } = useStore();
  const { theme, setTheme } = useTheme();
  const firebaseUser = auth.currentUser;
  const skipAuth = isSkipAuth();

  const [showManual, setShowManual] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSetupResetConfirm, setShowSetupResetConfirm] = useState(false);
  const [showInitSuccess, setShowInitSuccess] = useState(false);
  const [backupResult, setBackupResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [backupTriggerResult, setBackupTriggerResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function doLogout() {
    if (!skipAuth) await signOut(auth);
    clearGasUrl();
    window.location.reload();
  }

  function handleExportJson() {
    const data = { exportedAt: new Date().toISOString(), vehicles, maintenance, fuel, accidents };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetmetric-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 -ml-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">設定</h1>
      </div>

      {/* User */}
      {(firebaseUser || skipAuth) && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          {firebaseUser?.photoURL ? (
            <img
              src={firebaseUser.photoURL}
              alt={firebaseUser.displayName ?? ''}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full border border-outline-variant/20 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 22 }}>person</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-headline font-bold text-on-surface truncate">
              {firebaseUser?.displayName ?? '開発モード'}
            </p>
            <p className="text-sm font-label text-on-surface-variant truncate">
              {firebaseUser?.email ?? 'VITE_SKIP_AUTH=true'}
            </p>
          </div>
        </section>
      )}

      {/* Color theme */}
      <Section title="カラーテーマ">
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all ${
                  theme === t.id
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-surface-container'
                }`}
              >
                <span className="w-6 h-6 rounded-full border border-outline-variant/30" style={{ background: t.color }} />
                <span className="text-[11px] font-label text-on-surface-variant leading-tight text-center">{t.labelJa}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* GAS connection */}
      <Section title="GAS接続">
        <Row
          icon="link"
          label="接続URL"
          desc={getGasUrl() || '未設定（デモモード）'}
          chevron={false}
        />
        {!!getGasUrl() && (
          <Row
            icon="table_chart"
            label="スプレッドシートを初期化"
            desc="シートのヘッダーを再作成（データは削除されません）"
            onClick={async () => {
              await apiInitSheets();
              setShowInitSuccess(true);
            }}
          />
        )}
        <Row
          icon="sync"
          label="データを再同期"
          desc="スプレッドシートから最新データを取得"
          onClick={() => loadAll()}
        />
      </Section>

      {/* Backup */}
      <Section title="バックアップ">
        {!!getGasUrl() && (
          <Row
            icon="backup"
            label="今すぐバックアップ"
            desc="スプレッドシートのコピーをGoogleドライブに保存"
            onClick={async () => {
              const r = await apiBackupNow();
              setBackupResult({ ok: r.success, msg: r.success ? (r.message ?? '完了') : (r.error ?? '失敗') });
            }}
          />
        )}
        {!!getGasUrl() && (
          <Row
            icon="schedule"
            label="週次自動バックアップを設定"
            desc="毎週月曜 午前2時に自動でDriveにコピー"
            onClick={async () => {
              const r = await apiSetupBackupTrigger();
              setBackupTriggerResult({ ok: r.success, msg: r.success ? (r.message ?? '完了') : (r.error ?? '失敗') });
            }}
          />
        )}
        <Row
          icon="download"
          label="JSONでエクスポート"
          desc="全データをJSONファイルとしてダウンロード"
          onClick={handleExportJson}
        />
      </Section>

      {/* Help */}
      <Section title="ヘルプ">
        <Row
          icon="menu_book"
          label="マニュアルを開く"
          onClick={() => setShowManual(true)}
        />
      </Section>

      {/* Danger zone */}
      <Section title="アカウント">
        <Row
          icon="settings_backup_restore"
          label="セットアップをやり直す"
          desc="GAS URLをリセットして初回セットアップ画面に戻る"
          danger
          onClick={() => setShowSetupResetConfirm(true)}
        />
        <Row
          icon="logout"
          label="ログアウト"
          danger
          onClick={() => setShowLogoutConfirm(true)}
        />
      </Section>

      {/* Modals */}
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      {showInitSuccess && (
        <DialogModal
          variant="info"
          title="完了"
          message="シートを初期化しました"
          onClose={() => setShowInitSuccess(false)}
        />
      )}
      {backupResult && (
        <DialogModal
          variant={backupResult.ok ? 'info' : 'danger'}
          title={backupResult.ok ? 'バックアップ完了' : 'バックアップ失敗'}
          message={backupResult.msg}
          onClose={() => setBackupResult(null)}
        />
      )}
      {backupTriggerResult && (
        <DialogModal
          variant={backupTriggerResult.ok ? 'info' : 'danger'}
          title={backupTriggerResult.ok ? '自動バックアップ設定完了' : '設定失敗'}
          message={backupTriggerResult.msg}
          onClose={() => setBackupTriggerResult(null)}
        />
      )}
      {showLogoutConfirm && (
        <DialogModal
          variant="danger"
          title="ログアウト"
          message="ログアウトしますか？"
          confirmLabel="ログアウト"
          onConfirm={doLogout}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
      {showSetupResetConfirm && (
        <DialogModal
          variant="danger"
          title="セットアップをやり直す"
          message={'現在の接続設定がリセットされます。\nよろしいですか？'}
          confirmLabel="リセットする"
          onConfirm={async () => {
            if (!skipAuth && firebaseUser) {
              await saveGasUrlToFirestore(firebaseUser.uid, '');
            }
            clearGasUrl();
            window.location.reload();
          }}
          onClose={() => setShowSetupResetConfirm(false)}
        />
      )}
    </div>
  );
}
