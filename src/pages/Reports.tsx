import { useStore } from '../store/store';

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {entries.map(([month, value]) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs font-bold font-label text-on-surface-variant">
            ¥{value >= 10000 ? `${Math.round(value / 10000)}万` : value.toLocaleString()}
          </span>
          <div className="w-full bg-surface-container rounded-t-sm overflow-hidden" style={{ height: 80 }}>
            <div
              className="bg-primary-fixed-dim rounded-t-sm transition-all duration-700 w-full"
              style={{ height: `${Math.round((value / max) * 100)}%`, marginTop: 'auto' }}
            />
          </div>
          <span className="text-[10px] font-label text-on-surface-variant">{month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export function Reports() {
  const { statistics, maintenance, fuel, accidents } = useStore();

  const totalFuel = statistics?.totalFuelCost ?? fuel.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);
  const totalMaint = statistics?.totalMaintCost ?? maintenance.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);
  const totalAccident = statistics?.totalAccidentCost ?? accidents.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);
  const grandTotal = totalFuel + totalMaint + totalAccident;

  const vehicleCostEntries = Object.entries(statistics?.vehicleMaintCost ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">レポート / 統計</h1>
        <p className="text-sm font-label text-on-surface-variant mt-0.5">コスト分析・傾向</p>
      </div>

      {/* Hero cost card */}
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-xl p-6 text-white">
        <p className="text-xs uppercase tracking-widest font-label opacity-70 mb-2">総運用コスト</p>
        <p className="text-4xl font-headline font-bold">¥{grandTotal.toLocaleString()}</p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: '給油費', value: totalFuel, icon: 'local_gas_station' },
            { label: '整備費', value: totalMaint, icon: 'build' },
            { label: '事故・修理', value: totalAccident, icon: 'report_problem' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined opacity-70" style={{ fontSize: 14 }}>{icon}</span>
                <p className="text-xs opacity-70 font-label">{label}</p>
              </div>
              <p className="text-sm font-headline font-bold">¥{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly fuel chart */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>bar_chart</span>
            <h2 className="text-sm font-headline font-bold text-on-surface">月別給油費（直近6ヶ月）</h2>
          </div>
          {statistics?.monthlyFuel && Object.keys(statistics.monthlyFuel).length > 0 ? (
            <BarChart data={statistics.monthlyFuel} />
          ) : (
            <div className="h-32 flex items-center justify-center text-on-surface-variant text-sm">データなし</div>
          )}
        </div>

        {/* Cost breakdown donut */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>donut_large</span>
            <h2 className="text-sm font-headline font-bold text-on-surface">コスト内訳</h2>
          </div>
          {grandTotal > 0 ? (
            <div className="flex items-center gap-6">
              {/* Simple donut via conic-gradient */}
              <div
                className="w-28 h-28 rounded-full flex-shrink-0"
                style={{
                  background: `conic-gradient(
                    #adc7f7 0% ${Math.round((totalFuel / grandTotal) * 100)}%,
                    #002045 ${Math.round((totalFuel / grandTotal) * 100)}% ${Math.round(((totalFuel + totalMaint) / grandTotal) * 100)}%,
                    #ba1a1a ${Math.round(((totalFuel + totalMaint) / grandTotal) * 100)}% 100%
                  )`,
                  mask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
                  WebkitMask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
                }}
              />
              <div className="space-y-3 flex-1">
                {[
                  { label: '給油費', value: totalFuel, color: 'bg-primary-fixed-dim' },
                  { label: '整備費', value: totalMaint, color: 'bg-primary' },
                  { label: '事故・修理', value: totalAccident, color: 'bg-error' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
                    <span className="text-xs font-label text-on-surface-variant flex-1">{label}</span>
                    <span className="text-xs font-semibold text-on-surface">
                      {grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-on-surface-variant text-sm">データなし</div>
          )}
        </div>
      </div>

      {/* Vehicle cost ranking */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>leaderboard</span>
            <h2 className="text-sm font-headline font-bold text-on-surface">車両別整備費ランキング（TOP5）</h2>
          </div>
        </div>
        {vehicleCostEntries.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant text-sm">データなし</div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {vehicleCostEntries.map(([name, cost], i) => {
              const maxCost = vehicleCostEntries[0][1];
              return (
                <div key={name} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-label ${
                    i === 0 ? 'bg-primary text-on-primary' : i === 1 ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{name}</p>
                    <div className="mt-1.5 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((cost / maxCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-on-surface flex-shrink-0">¥{cost.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
