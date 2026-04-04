import { useState } from 'react';
import { useStore } from '../store/store';
import { FuelForm } from '../components/forms/FuelForm';
import { DialogModal } from '../components/DialogModal';

export function FuelRecords() {
  const { fuel, deleteFuel } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...fuel]
    .sort((a, b) => new Date(b['日付']).getTime() - new Date(a['日付']).getTime())
    .filter(r => !search || r['車両名'].includes(search) || (r['スタンド名'] && String(r['スタンド名']).includes(search)));

  const totalCost = fuel.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);
  const totalLiters = fuel.reduce((s, r) => s + (Number(r['給油量(L)']) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">給油記録</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">
            {fuel.length}件 · 累計 {totalLiters.toFixed(1)}L · ¥{totalCost.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="hidden sm:inline">記録を追加</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
          <p className="text-xl font-headline font-bold text-on-surface">{fuel.length}</p>
          <p className="text-xs font-label text-on-surface-variant mt-0.5">給油回数</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
          <p className="text-xl font-headline font-bold text-on-surface">{totalLiters.toFixed(0)}L</p>
          <p className="text-xs font-label text-on-surface-variant mt-0.5">総給油量</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
          <p className="text-xl font-headline font-bold text-on-surface">¥{totalCost.toLocaleString()}</p>
          <p className="text-xs font-label text-on-surface-variant mt-0.5">累計給油費</p>
        </div>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
        <input
          type="text"
          placeholder="車両名・スタンド名で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">local_gas_station</span>
            <p className="text-on-surface-variant text-sm">
              {fuel.length === 0 ? '給油記録がありません' : '条件に一致する記録がありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {sorted.map(r => (
              <div key={r['記録ID']} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>local_gas_station</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">{r['車両名']}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {r['スタンド名'] || '—'} · {String(r['日付'])}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {Number(r['給油量(L)'])}L × ¥{Number(r['単価(円/L)'])}/L
                    {r['走行距離(km)'] && ` · ${Number(r['走行距離(km)']).toLocaleString()} km`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-on-surface">¥{Number(r['費用(円)']).toLocaleString()}</p>
                  <button
                    onClick={() => setDeleteId(r['記録ID'])}
                    className="text-xs text-error hover:underline"
                  >削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <FuelForm onClose={() => setShowForm(false)} />}
      {deleteId && (
        <DialogModal
          variant="danger"
          title="記録を削除"
          message="この給油記録を削除しますか？"
          confirmLabel="削除する"
          onConfirm={() => deleteFuel(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
