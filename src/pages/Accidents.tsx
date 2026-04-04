import { useState } from 'react';
import { useStore } from '../store/store';
import { AccidentForm } from '../components/forms/AccidentForm';
import { DialogModal } from '../components/DialogModal';

export function Accidents() {
  const { accidents, deleteAccident } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...accidents]
    .sort((a, b) => new Date(b['日付']).getTime() - new Date(a['日付']).getTime())
    .filter(r => !search || r['車両名'].includes(search) || r['事故・修理内容'].includes(search));

  const totalCost = accidents.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">事故・修理履歴</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">{accidents.length}件 · 累計 ¥{totalCost.toLocaleString()}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="hidden sm:inline">記録を追加</span>
        </button>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
        <input
          type="text"
          placeholder="車両名・内容で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">report_problem</span>
            <p className="text-on-surface-variant text-sm">
              {accidents.length === 0 ? '事故・修理記録がありません' : '条件に一致する記録がありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {sorted.map(r => (
              <div key={r['記録ID']} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors border-l-4 border-l-error">
                <div className="w-9 h-9 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>report_problem</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">{r['車両名']}</p>
                  <p className="text-sm text-on-surface">{r['事故・修理内容']}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {r['業者'] || '—'} · {String(r['日付'])}
                    {r['損傷箇所'] && ` · ${r['損傷箇所']}`}
                    {r['完了日'] && ` · 完了: ${String(r['完了日'])}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  {r['費用(円)'] && <p className="text-sm font-bold text-on-surface">¥{Number(r['費用(円)']).toLocaleString()}</p>}
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

      {showForm && <AccidentForm onClose={() => setShowForm(false)} />}
      {deleteId && (
        <DialogModal
          variant="danger"
          title="記録を削除"
          message="この事故・修理記録を削除しますか？"
          confirmLabel="削除する"
          onConfirm={() => deleteAccident(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
