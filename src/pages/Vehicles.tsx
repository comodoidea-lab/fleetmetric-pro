import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { StatusBadge } from '../components/StatusBadge';
import { VehicleForm } from '../components/forms/VehicleForm';
import { DialogModal } from '../components/DialogModal';

type FilterStatus = 'all' | '稼働中' | '整備中' | '廃車';

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

function InspectionBadge({ dateStr, label }: { dateStr: string; label: string }) {
  const days = daysUntil(dateStr);
  if (days === null) return <span className="text-xs text-on-surface-variant">—</span>;
  if (days < 0) return (
    <span className="text-xs font-semibold text-error">{label} 期限切れ ({Math.abs(days)}日)</span>
  );
  if (days <= 30) return (
    <span className="text-xs font-semibold text-on-secondary-container">{label} あと{days}日</span>
  );
  return <span className="text-xs text-on-surface-variant">{label} {dateStr}</span>;
}

export function Vehicles() {
  const { vehicles, deleteVehicle } = useStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<(typeof vehicles)[0] | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof vehicles)[0] | null>(null);

  const filtered = vehicles.filter(v => {
    const matchStatus = filter === 'all' || v['ステータス'] === filter;
    const matchSearch = !search || v['車両名'].includes(search) || v['ナンバー'].includes(search) || v['メーカー'].includes(search);
    return matchStatus && matchSearch;
  });

  const statusCounts = {
    all: vehicles.length,
    '稼働中': vehicles.filter(v => v['ステータス'] === '稼働中').length,
    '整備中': vehicles.filter(v => v['ステータス'] === '整備中').length,
    '廃車': vehicles.filter(v => v['ステータス'] === '廃車').length,
  };

  function accentClass(status: string) {
    if (status === '稼働中') return 'border-l-4 border-l-tertiary-fixed';
    if (status === '整備中') return 'border-l-4 border-l-secondary';
    return 'border-l-4 border-l-outline-variant';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">車両一覧</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">登録車両の管理・閲覧</p>
        </div>
        <button
          onClick={() => { setEditVehicle(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold font-label shadow-sm hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="hidden sm:inline">車両を追加</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {(['all', '稼働中', '整備中', '廃車'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-3 rounded-xl text-center transition-all ${filter === s ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest hover:bg-surface-container-high'}`}
          >
            <p className="text-lg font-headline font-bold">{statusCounts[s]}</p>
            <p className="text-xs font-label mt-0.5 opacity-80">{s === 'all' ? '全車両' : s}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
        <input
          type="text"
          placeholder="ナンバー・車両名・メーカーで検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
        />
      </div>

      {/* Vehicle list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">directions_car</span>
            <p className="text-on-surface-variant text-sm">
              {vehicles.length === 0 ? '車両が登録されていません' : '条件に一致する車両がありません'}
            </p>
          </div>
        ) : (
          filtered.map(v => (
            <div
              key={v['車両ID']}
              className={`bg-surface-container-lowest rounded-xl shadow-sm hover:bg-surface-container transition-all ${accentClass(v['ステータス'])} relative`}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>{v['アイコン'] || 'directions_car'}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/vehicles/${v['車両ID']}`} className="text-sm font-headline font-bold text-on-surface hover:underline truncate">
                      {v['車両名']}
                    </Link>
                    <StatusBadge status={v['ステータス']} size="sm" />
                  </div>
                  <p className="text-xs font-label text-on-surface-variant mt-0.5">{v['ナンバー']} · {v['メーカー']} {v['車種']} {v['年式']}年</p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <InspectionBadge dateStr={v['車検期限']} label="車検" />
                    <InspectionBadge dateStr={v['法定点検期限']} label="法定点検" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/vehicles/${v['車両ID']}`}
                    className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors hidden sm:flex"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === v['車両ID'] ? null : v['車両ID'])}
                      className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
                    </button>
                    {menuId === v['車両ID'] && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                        <div className="absolute right-0 top-10 bg-surface-container-lowest rounded-xl shadow-lg z-50 overflow-hidden w-40 border border-outline-variant/20">
                          <button
                            onClick={() => { setEditVehicle(v); setShowForm(true); setMenuId(null); }}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-surface-container transition-colors text-on-surface"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>編集
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(v); setMenuId(null); }}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-error-container transition-colors text-error"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>削除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <VehicleForm
          vehicle={editVehicle}
          onClose={() => { setShowForm(false); setEditVehicle(null); }}
        />
      )}
      {deleteTarget && (
        <DialogModal
          variant="danger"
          title="車両を削除"
          message={`「${deleteTarget['車両名']}」を削除しますか？\nこの操作は取り消せません。`}
          confirmLabel="削除する"
          onConfirm={() => deleteVehicle(deleteTarget['車両ID'])}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
