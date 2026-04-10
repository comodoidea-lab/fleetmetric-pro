import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';
import { Driver } from '../types';
import { DriverForm } from '../components/forms/DriverForm';
import { DialogModal } from '../components/DialogModal';

export function Drivers() {
  const navigate = useNavigate();
  const { multiDriverMode } = useMultiDriverMode();
  const { drivers, deleteDriver, updateDriver } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  useEffect(() => {
    if (!multiDriverMode) navigate('/', { replace: true });
  }, [multiDriverMode, navigate]);

  const filtered = drivers.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d['氏名'].toLowerCase().includes(q) ||
      (d['電話番号'] && String(d['電話番号']).toLowerCase().includes(q))
    );
  });

  const counts = {
    all: drivers.length,
    '稼働中': drivers.filter(d => d['ステータス'] === '稼働中').length,
    '休止': drivers.filter(d => d['ステータス'] === '休止').length,
  };

  async function toggleStatus(d: Driver) {
    const next: Driver['ステータス'] = d['ステータス'] === '稼働中' ? '休止' : '稼働中';
    await updateDriver({ ...d, 'ステータス': next });
  }

  if (!multiDriverMode) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">ドライバー管理</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">
            {drivers.length}名登録 · 稼働中 {counts['稼働中']}名
          </p>
        </div>
        <button
          onClick={() => {
            setEditDriver(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          <span className="hidden sm:inline">ドライバーを追加</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['all', '稼働中', '休止'] as const).map(key => (
          <div key={key} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-headline font-bold text-on-surface">{key === 'all' ? counts.all : counts[key]}</p>
            <p className="text-xs font-label text-on-surface-variant mt-0.5">{key === 'all' ? '合計' : key}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
        <input
          type="text"
          placeholder="氏名・電話で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">badge</span>
            <p className="text-on-surface-variant text-sm">
              {drivers.length === 0 ? 'ドライバーが登録されていません' : '一致するドライバーがありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {filtered.map(d => (
              <div key={d['ドライバーID']} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors">
                <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontSize: 22 }}>person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">{d['氏名']}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{d['電話番号'] || '—'}</p>
                  {d['備考'] ? <p className="text-xs text-on-surface-variant truncate">{d['備考']}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] font-label font-bold uppercase px-2 py-0.5 rounded-full ${
                      d['ステータス'] === '稼働中' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {d['ステータス']}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(d)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {d['ステータス'] === '稼働中' ? '休止にする' : '稼働にする'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDriver(d);
                        setShowForm(true);
                      }}
                      className="text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      編集
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(d)} className="text-xs text-error hover:underline">
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <DriverForm
          driver={editDriver}
          onClose={() => {
            setShowForm(false);
            setEditDriver(null);
          }}
        />
      )}

      {deleteTarget && (
        <DialogModal
          variant="danger"
          title="ドライバーを削除"
          message={`「${deleteTarget['氏名']}」を削除しますか？`}
          confirmLabel="削除する"
          onConfirm={() => {
            deleteDriver(deleteTarget['ドライバーID']);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
