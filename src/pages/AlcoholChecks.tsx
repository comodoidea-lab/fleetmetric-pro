import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';
import { AlcoholCheckForm } from '../components/forms/AlcoholCheckForm';
import { DialogModal } from '../components/DialogModal';

export function AlcoholChecks() {
  const navigate = useNavigate();
  const { multiDriverMode } = useMultiDriverMode();
  const { alcoholChecks, deleteAlcoholCheck } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!multiDriverMode) navigate('/', { replace: true });
  }, [multiDriverMode, navigate]);

  const sorted = useMemo(
    () => [...alcoholChecks].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [alcoholChecks],
  );

  if (!multiDriverMode) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">アルコールチェック</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">{alcoholChecks.length}件の記録</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="hidden sm:inline">記録を追加</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">monitoring</span>
            <p className="text-on-surface-variant text-sm">アルコールチェック記録がありません</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {sorted.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${r.result === '要確認（陽性）' ? 'bg-error-container' : 'bg-tertiary-container'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {r.result === '要確認（陽性）' ? 'warning' : 'verified'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">{r.driverName}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(r.timestamp).toLocaleString('ja-JP')} · {r.timing} · {r.checkMethod}
                  </p>
                  <p className="text-xs text-on-surface-variant">確認者: {r.confirmedBy}</p>
                  {r.checkMethod === 'セルフ' && (
                    <p className="text-xs text-on-surface-variant">
                      顔写真送信: {r.photoSent ? '送信済み' : '未送信'}
                    </p>
                  )}
                  {r.result === '要確認（陽性）' && r.positiveResponse && (
                    <p className="text-xs text-error mt-0.5">
                      陽性時の会社対応: {r.positiveResponse}
                    </p>
                  )}
                  {r.trafficViolation && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      交通違反詳細: {r.trafficViolationNote || '詳細未入力'}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.result === '要確認（陽性）' ? 'bg-error text-on-error' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                    {r.result}
                  </span>
                  <button onClick={() => setDeleteId(r.id)} className="text-xs text-error hover:underline">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <AlcoholCheckForm onClose={() => setShowForm(false)} />}
      {deleteId && (
        <DialogModal
          variant="danger"
          title="記録を削除"
          message="このアルコールチェック記録を削除しますか？"
          confirmLabel="削除する"
          onConfirm={() => deleteAlcoholCheck(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
