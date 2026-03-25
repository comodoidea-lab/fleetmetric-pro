import { useState } from 'react';
import { useStore } from '../store/store';
import { SyncIndicator } from './SyncIndicator';
import { AlertBadge } from './StatusBadge';
import { getGasUrl, clearGasUrl } from '../config';
import { apiInitSheets } from '../api/gasApi';

export function TopNav() {
  const { dashboard, loadAll } = useStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const alertCount = dashboard?.alerts.length ?? 0;

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm">
      <div className="flex justify-between items-center px-4 lg:px-6 h-16 w-full">
        {/* Left */}
        <div className="flex items-center gap-4 lg:gap-8">
          <span className="text-xl font-bold font-headline tracking-tight text-primary">
            FleetMetric Pro
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <SyncIndicator />

          {/* Refresh */}
          <button
            onClick={() => loadAll()}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            title="データを更新"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>refresh</span>
          </button>

          {/* Settings (visible on all screen sizes) */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(v => !v)}
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
              title="設定"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 top-12 w-72 bg-surface-container-lowest rounded-xl shadow-lg z-50 overflow-hidden border border-outline-variant/20">
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <p className="font-headline font-bold text-on-surface text-sm">設定</p>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="px-3 py-2 rounded-lg bg-surface-container-low">
                      <p className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1">GAS接続URL</p>
                      <p className="text-xs font-label text-on-surface break-all">
                        {getGasUrl() || '未設定（デモモード）'}
                      </p>
                    </div>
                    {!!getGasUrl() && (
                      <button
                        onClick={async () => {
                          await apiInitSheets();
                          setShowSettings(false);
                          alert('シートを初期化しました');
                        }}
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
                      onClick={() => {
                        if (confirm('セットアップをやり直しますか？\n現在の接続設定がリセットされます。')) {
                          clearGasUrl();
                          window.location.reload();
                        }
                      }}
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

          {/* Alerts bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(v => !v)}
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">notifications</span>
              {alertCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white" />
              )}
            </button>

            {showAlerts && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAlerts(false)} />
                <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-xl shadow-lg z-50 overflow-hidden border border-outline-variant/20">
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <p className="font-headline font-bold text-on-surface text-sm">アラート ({alertCount}件)</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {alertCount === 0 ? (
                      <div className="px-4 py-6 text-center text-on-surface-variant text-sm">
                        アラートはありません
                      </div>
                    ) : (
                      dashboard?.alerts.map((a, i) => (
                        <div key={i} className={`px-4 py-3 border-l-4 border-b border-outline-variant/10 ${a.type === 'danger' ? 'border-l-error bg-error-container/20' : 'border-l-secondary bg-secondary-container/20'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertBadge type={a.type} />
                            <span className="text-xs font-label text-on-surface-variant">{a.category}</span>
                          </div>
                          <p className="text-sm font-semibold text-on-surface">{a.vehicleName}</p>
                          <p className="text-xs text-on-surface-variant">{a.plateNumber} — {a.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-surface-container-high h-px w-full absolute bottom-0" />
    </header>
  );
}
