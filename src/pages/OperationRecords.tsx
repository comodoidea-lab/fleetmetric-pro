import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';
import { OperationRecordForm } from '../components/forms/OperationRecordForm';
import { DialogModal } from '../components/DialogModal';

function parseOpTime(s: string): number {
  const t = Date.parse(s.replace(/\//g, '-').replace(' ', 'T'));
  return isNaN(t) ? 0 : t;
}

export function OperationRecords() {
  const navigate = useNavigate();
  const { multiDriverMode } = useMultiDriverMode();
  const { operationRecords, vehicles, drivers, deleteOperationRecord } = useStore();
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!multiDriverMode) navigate('/', { replace: true });
  }, [multiDriverMode, navigate]);

  const vehicleOptions = useMemo(
    () => [...vehicles].sort((a, b) => a['車両名'].localeCompare(b['車両名'], 'ja')).map(v => [v['車両ID'], v['車両名']] as const),
    [vehicles],
  );

  const driverOptions = useMemo(
    () => [...drivers].sort((a, b) => a['氏名'].localeCompare(b['氏名'], 'ja')).map(d => [d['ドライバーID'], d['氏名']] as const),
    [drivers],
  );

  const sorted = useMemo(() => {
    let rows = [...operationRecords];
    if (filterVehicle) rows = rows.filter(r => r['車両ID'] === filterVehicle);
    if (filterDriver) rows = rows.filter(r => r['ドライバーID'] === filterDriver);
    return rows.sort((a, b) => parseOpTime(b['出発日時']) - parseOpTime(a['出発日時']));
  }, [operationRecords, filterVehicle, filterDriver]);

  const totalKm = useMemo(
    () => sorted.reduce((s, r) => s + (Number(r['走行距離(km)']) || 0), 0),
    [sorted],
  );

  if (!multiDriverMode) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">運行記録</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">
            {sorted.length}件表示 · 計 {totalKm.toLocaleString()} km
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors active:scale-95 flex-shrink-0"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="hidden sm:inline">記録を追加</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-label text-on-surface-variant mb-1 block">車両で絞り込み</label>
          <select
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30"
          >
            <option value="">すべての車両</option>
            {vehicleOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-label text-on-surface-variant mb-1 block">ドライバーで絞り込み</label>
          <select
            value={filterDriver}
            onChange={e => setFilterDriver(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30"
          >
            <option value="">すべてのドライバー</option>
            {driverOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">route</span>
            <p className="text-on-surface-variant text-sm">
              {operationRecords.length === 0 ? '運行記録がありません' : '条件に一致する記録がありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {sorted.map(r => (
              <div key={r['記録ID']} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-container transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>route</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">{r['車両名']}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{r['ドライバー名']}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    出発 {r['出発日時']} → 帰着 {r['帰着日時']}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {r['目的地'] ? `目的地: ${r['目的地']} · ` : ''}
                    用途: {r['用途']}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-on-surface">{Number(r['走行距離(km)']).toLocaleString()} km</p>
                  <button type="button" onClick={() => setDeleteId(r['記録ID'])} className="text-xs text-error hover:underline">
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <OperationRecordForm onClose={() => setShowForm(false)} />}

      {deleteId && (
        <DialogModal
          variant="danger"
          title="記録を削除"
          message="この運行記録を削除しますか？"
          confirmLabel="削除する"
          onConfirm={() => {
            deleteOperationRecord(deleteId);
            setDeleteId(null);
          }}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
