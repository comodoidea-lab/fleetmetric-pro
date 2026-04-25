import { useState } from 'react';
import { useStore } from '../../store/store';
import { Field, Modal, inputCls } from './VehicleForm';

interface Props {
  onClose: () => void;
}

export function AlcoholCheckForm({ onClose }: Props) {
  const { drivers, vehicles, addAlcoholCheck } = useStore();
  const [form, setForm] = useState({
    driverId: '',
    vehicleId: '',
    timing: '運行前' as '運行前' | '運行後',
    checkMethod: '対面' as '対面' | 'セルフ',
    photoSent: false,
    result: '異常なし' as '異常なし' | '要確認（陽性）',
    positiveResponse: '',
    trafficViolation: false,
    trafficViolationNote: '',
    confirmedBy: '',
    detectorUsed: true,
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedDriver = drivers.find((d) => d['ドライバーID'] === form.driverId);
  const selectedVehicle = vehicles.find((v) => v['車両ID'] === form.vehicleId);

  const set = <T extends keyof typeof form>(k: T, v: (typeof form)[T]) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.driverId) return setError('ドライバーを選択してください');
    if (!form.confirmedBy.trim()) return setError('確認者名を入力してください');
    if (form.result === '要確認（陽性）' && !form.positiveResponse.trim()) {
      return setError('陽性時の対応内容を入力してください');
    }
    if (form.trafficViolation && !form.trafficViolationNote.trim()) {
      return setError('交通違反の詳細を入力してください');
    }
    setLoading(true);
    setError('');
    try {
      await addAlcoholCheck({
        driverId: form.driverId,
        driverName: selectedDriver?.['氏名'] ?? '',
        vehicleId: form.vehicleId || undefined,
        vehicleName: selectedVehicle?.['車両名'] ?? '',
        timing: form.timing,
        checkMethod: form.checkMethod,
        photoSent: form.checkMethod === 'セルフ' ? form.photoSent : false,
        result: form.result,
        positiveResponse: form.result === '要確認（陽性）' ? form.positiveResponse.trim() : undefined,
        trafficViolation: form.trafficViolation,
        trafficViolationNote: form.trafficViolation ? form.trafficViolationNote.trim() : undefined,
        confirmedBy: form.confirmedBy.trim(),
        detectorUsed: form.detectorUsed,
        timestamp: new Date().toISOString(),
        note: form.note.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="アルコールチェックを記録" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="ドライバー *" icon="badge">
          <select className={inputCls} value={form.driverId} onChange={(e) => set('driverId', e.target.value)} required>
            <option value="">ドライバーを選択</option>
            {drivers.map((d) => (
              <option key={d['ドライバーID']} value={d['ドライバーID']}>
                {d['氏名']}
              </option>
            ))}
          </select>
        </Field>

        <Field label="車両（任意）" icon="directions_car">
          <select className={inputCls} value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
            <option value="">車両を選択しない</option>
            {vehicles.map((v) => (
              <option key={v['車両ID']} value={v['車両ID']}>
                {v['車両名']} — {v['ナンバー']}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="タイミング *" icon="schedule">
            <div className="grid grid-cols-2 gap-2">
              {(['運行前', '運行後'] as const).map((timing) => (
                <button
                  key={timing}
                  type="button"
                  onClick={() => set('timing', timing)}
                  className={`rounded-lg py-2.5 text-sm font-semibold ${form.timing === timing ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}
                >
                  {timing}
                </button>
              ))}
            </div>
          </Field>
          <Field label="チェック方法 *" icon="visibility">
            <div className="grid grid-cols-2 gap-2">
              {(['対面', 'セルフ'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => set('checkMethod', method)}
                  className={`rounded-lg py-2.5 text-sm font-semibold ${form.checkMethod === method ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {form.checkMethod === 'セルフ' && (
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" checked={form.photoSent} onChange={(e) => set('photoSent', e.target.checked)} />
            顔写真を会社に送信済み
          </label>
        )}

        <Field label="結果 *" icon="monitoring">
          <div className="grid grid-cols-2 gap-2">
            {(['異常なし', '要確認（陽性）'] as const).map((result) => (
              <button
                key={result}
                type="button"
                onClick={() => set('result', result)}
                className={`rounded-lg py-2.5 text-sm font-semibold ${
                  form.result === result
                    ? result === '要確認（陽性）'
                      ? 'bg-error text-on-error'
                      : 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {result}
              </button>
            ))}
          </div>
        </Field>

        {form.result === '要確認（陽性）' && (
          <Field label="陽性時の会社対応内容 *" icon="assignment">
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.positiveResponse} onChange={(e) => set('positiveResponse', e.target.value)} />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input type="checkbox" checked={form.trafficViolation} onChange={(e) => set('trafficViolation', e.target.checked)} />
          交通違反あり
        </label>

        {form.trafficViolation && (
          <Field label="交通違反の詳細 *" icon="gavel">
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.trafficViolationNote} onChange={(e) => set('trafficViolationNote', e.target.value)} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" checked={form.detectorUsed} onChange={(e) => set('detectorUsed', e.target.checked)} />
            検知器を使用した
          </label>
          <Field label="確認者名 *" icon="person">
            <input className={inputCls} value={form.confirmedBy} onChange={(e) => set('confirmedBy', e.target.value)} required />
          </Field>
        </div>

        <Field label="メモ" icon="notes">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold hover:bg-surface-dim transition-colors">
            キャンセル
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-50">
            {loading ? '保存中...' : '記録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
