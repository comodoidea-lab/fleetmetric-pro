import { NavLink } from 'react-router-dom';
import { getGasUrl, clearGasUrl, saveGasUrlToFirestore } from '../config';
import { auth } from '../firebase';
import { useStore } from '../store/store';
import { apiInitSheets } from '../api/gasApi';
import { useState } from 'react';
import { DialogModal } from './DialogModal';

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'ダッシュボード', fillActive: true },
  { to: '/vehicles', icon: 'directions_car', label: '車両一覧' },
  { to: '/maintenance', icon: 'build', label: 'メンテナンス' },
  { to: '/fuel', icon: 'local_gas_station', label: '給油記録' },
  { to: '/accidents', icon: 'report_problem', label: '事故・修理' },
  { to: '/reports', icon: 'bar_chart', label: 'レポート' },
];

export function Sidebar() {
  const { loadAll } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showInitSuccess, setShowInitSuccess] = useState(false);
  const [showSetupResetConfirm, setShowSetupResetConfirm] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col py-6 px-4 gap-2 h-screen w-64 fixed left-0 top-16 bg-surface-container-low z-40 overflow-y-auto">
      {/* Brand */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
          <div>
            <p className="text-base font-black font-headline text-primary leading-tight">Fleet Authority</p>
            <p className="text-[10px] uppercase tracking-widest text-on-secondary-container font-bold font-label">Command Center</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon, label, fillActive }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 py-3 px-4 bg-surface-container-lowest text-primary rounded-lg shadow-sm font-bold transition-all duration-200'
                : 'flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container transition-all duration-200 rounded-lg'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive && fillActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {icon}
                </span>
                <span className="font-label text-sm font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/30 pt-4">
        <div className="relative">
          <button
            onClick={() => setShowSettings(v => !v)}
            className="flex items-center gap-3 py-3 px-4 w-full text-on-surface-variant hover:bg-surface-container transition-all rounded-lg"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label text-sm font-semibold">設定</span>
          </button>

          {showSettings && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
              <div className="absolute left-0 bottom-12 w-64 bg-surface-container-lowest rounded-xl shadow-lg z-50 overflow-hidden border border-outline-variant/20">
                <div className="px-4 py-3 border-b border-outline-variant/20">
                  <p className="font-headline font-bold text-on-surface text-sm">設定</p>
                </div>
                <div className="p-3 space-y-1">
                  <div className="px-3 py-2 rounded-lg bg-surface-container-low">
                    <p className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1">GAS接続URL</p>
                    <p className="text-xs font-label text-on-surface break-all">{getGasUrl() || '未設定（デモモード）'}</p>
                  </div>
                  {!!getGasUrl() && (
                    <button
                      onClick={async () => { await apiInitSheets(); setShowSettings(false); setShowInitSuccess(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-surface-container transition-colors text-on-surface rounded-lg text-left"
                    >
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>table_chart</span>
                      スプレッドシートを初期化
                    </button>
                  )}
                  <button
                    onClick={() => { loadAll(); setShowSettings(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-surface-container transition-colors text-on-surface rounded-lg text-left"
                  >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>sync</span>
                    データを再同期
                  </button>
                  <div className="border-t border-outline-variant/20 my-1" />
                  <button
                    onClick={() => { setShowSettings(false); setShowSetupResetConfirm(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-error-container/30 transition-colors text-error rounded-lg text-left"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings_backup_restore</span>
                    セットアップをやり直す
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container transition-all rounded-lg cursor-pointer">
          <span className="material-symbols-outlined">help</span>
          <span className="font-label text-sm font-semibold">ヘルプ</span>
        </a>
      </div>

      {showInitSuccess && (
        <DialogModal
          variant="info"
          title="完了"
          message="シートを初期化しました"
          onClose={() => setShowInitSuccess(false)}
        />
      )}
      {showSetupResetConfirm && (
        <DialogModal
          variant="danger"
          title="セットアップをやり直す"
          message={'現在の接続設定がリセットされます。\nよろしいですか？'}
          confirmLabel="リセットする"
          onConfirm={async () => {
            const user = auth.currentUser;
            if (user) await saveGasUrlToFirestore(user.uid, '');
            clearGasUrl();
            window.location.reload();
          }}
          onClose={() => setShowSetupResetConfirm(false)}
        />
      )}
    </aside>
  );
}
