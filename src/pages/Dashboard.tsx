import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { AlertBadge, StatusBadge } from '../components/StatusBadge';
import { getGasUrl } from '../config';
import { MaintenanceForm } from '../components/forms/MaintenanceForm';
import { FuelForm } from '../components/forms/FuelForm';
import { AccidentForm } from '../components/forms/AccidentForm';

function MetricCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: string }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl p-5 shadow-sm ${accent ? `border-l-4 ${accent}` : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-label uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <p className="text-3xl font-headline font-bold text-on-surface">{value}</p>
    </div>
  );
}

function SkeletonCard() {
  return <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm animate-pulse h-24" />;
}

export function Dashboard() {
  const { dashboard, vehicles, maintenance } = useStore();
  const navigate = useNavigate();
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showAccidentForm, setShowAccidentForm] = useState(false);

  const activeCount = vehicles.filter(v => v['ステータス'] === '稼働中').length;
  const maintCount = vehicles.filter(v => v['ステータス'] === '整備中').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">ダッシュボード</h1>
        <p className="text-sm font-label text-on-surface-variant mt-1">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          {!getGasUrl() && <span className="ml-2 text-secondary font-semibold">（デモデータ表示中）</span>}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard ? (
          <>
            <MetricCard label="総車両数" value={dashboard.vehicleCount} icon="directions_car" />
            <MetricCard label="稼働中" value={activeCount || dashboard.activeCount} icon="check_circle" accent="border-l-tertiary-fixed" />
            <MetricCard label="整備中" value={maintCount} icon="build" accent="border-l-secondary-container" />
            <MetricCard
              label="今月給油費"
              value={`¥${(dashboard.monthlyFuelCost).toLocaleString()}`}
              icon="local_gas_station"
              accent="border-l-primary-fixed-dim"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-1 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>warning</span>
              <h2 className="font-headline font-bold text-sm text-on-surface">期限アラート</h2>
              {dashboard?.alerts.length ? (
                <span className="ml-auto bg-error-container text-on-error-container text-xs font-bold px-2 py-0.5 rounded-full">
                  {dashboard.alerts.length}件
                </span>
              ) : null}
            </div>
          </div>
          <div className="divide-y divide-outline-variant/10 max-h-72 overflow-y-auto">
            {!dashboard ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />)}
              </div>
            ) : dashboard.alerts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <span className="material-symbols-outlined text-tertiary-fixed text-3xl block mb-2">check_circle</span>
                <p className="text-sm text-on-surface-variant">期限切れ・間近の車両はありません</p>
              </div>
            ) : (
              dashboard.alerts.map((a, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 border-l-4 ${a.type === 'danger' ? 'border-l-error' : 'border-l-secondary'}`}
                >
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

        {/* Recent Maintenance */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>history</span>
              <h2 className="font-headline font-bold text-sm text-on-surface">最近のメンテナンス</h2>
            </div>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {!dashboard ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />)}
              </div>
            ) : (dashboard.recentMaintenance.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl block mb-2">build</span>
                <p className="text-sm text-on-surface-variant">メンテナンス記録がありません</p>
              </div>
            ) : (
              dashboard.recentMaintenance.map((r, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-container transition-colors">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 16 }}>build</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{r['車両名']}</p>
                    <p className="text-xs text-on-surface-variant truncate">{r['作業内容']}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-label text-on-surface-variant">{String(r['日付']).replace(/\//g, '/')}</p>
                    {r['費用(円)'] && (
                      <p className="text-xs font-semibold text-on-surface">¥{Number(r['費用(円)']).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Status Overview */}
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest font-label opacity-70 mb-1">フリート稼働状況</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold">{dashboard?.vehicleCount ?? '--'}</span>
              <span className="text-sm opacity-80">台中</span>
              <span className="text-3xl font-headline font-bold text-tertiary-fixed">{activeCount || (dashboard?.activeCount ?? '--')}</span>
              <span className="text-sm opacity-80">台稼働中</span>
            </div>
          </div>
          {dashboard && (
            <div className="flex-shrink-0">
              <div className="w-full sm:w-48 bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 bg-tertiary-fixed rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((((activeCount || dashboard.activeCount)) / dashboard.vehicleCount) * 100) || 0}%` }}
                />
              </div>
              <p className="text-xs opacity-70 mt-1 text-right font-label">
                稼働率 {dashboard.vehicleCount > 0 ? Math.round((((activeCount || dashboard.activeCount)) / dashboard.vehicleCount) * 100) : 0}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-sm font-headline font-bold text-on-surface mb-3">クイックアクセス</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'メンテナンス記録を追加', icon: 'build', action: () => setShowMaintForm(true) },
            { label: '給油記録を追加', icon: 'local_gas_station', action: () => setShowFuelForm(true) },
            { label: '事故・修理を記録', icon: 'report_problem', action: () => setShowAccidentForm(true) },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-sm hover:bg-surface-container-high transition-all duration-200 active:scale-95 text-left"
            >
              <div className="w-9 h-9 bg-secondary-container rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>{icon}</span>
              </div>
              <span className="text-sm font-semibold text-on-surface leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {showMaintForm && <MaintenanceForm onClose={() => setShowMaintForm(false)} />}
      {showFuelForm && <FuelForm onClose={() => setShowFuelForm(false)} />}
      {showAccidentForm && <AccidentForm onClose={() => setShowAccidentForm(false)} />}
    </div>
  );
}
