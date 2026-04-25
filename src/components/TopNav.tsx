import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { SyncIndicator } from './SyncIndicator';
import { AlertBadge } from './StatusBadge';
import { ManualModal } from './ManualModal';

export function TopNav() {
  const { dashboard, loadAll } = useStore();
  const navigate = useNavigate();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const alertCount = dashboard?.alerts.length ?? 0;

  return (
    <>
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-lg shadow-sm">
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

          {/* Help / Manual */}
          <button
            onClick={() => setShowManual(true)}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            title="マニュアルを開く"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>help</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            title="設定"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
          </button>

          {/* Alerts bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(v => !v)}
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">notifications</span>
              {alertCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
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
                            <AlertBadge type={a.type} label={a.category === 'アルコールチェック' ? '要確認' : undefined} />
                            <span className="text-xs font-label text-on-surface-variant">{a.category}</span>
                          </div>
                          <p className="text-sm font-semibold text-on-surface">{a.vehicleName}</p>
                          <p className="text-xs text-on-surface-variant">
                            {a.plateNumber ? `${a.plateNumber} — ` : ''}
                            {a.message}
                          </p>
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

    {showManual && <ManualModal onClose={() => setShowManual(false)} />}
  </>
  );
}
