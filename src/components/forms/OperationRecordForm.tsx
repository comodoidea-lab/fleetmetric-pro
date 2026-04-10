import { useMemo, useState } from 'react';
import { useStore } from '../../store/store';
import { Modal, Field, inputCls } from './VehicleForm';

function datetimeLocalToJa(v: string): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  onClose: () => void;
}

export function OperationRecordForm({ onClose }: Props) {
  const { vehicles, drivers, addOperationRecord } = useStore();

  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    departAt: defaultDatetimeLocal(),
    arriveAt: defaultDatetimeLocal(),
    depKm: '',
    retKm: '',
    purpose: '仕事' as '仕事' | 'プライベート',
    destination: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedVehicle = vehicles.find(v => v['車両ID'] === form.vehicleId);
  const selectedDriver = drivers.find(d => d['ドライバーID'] === form.driverId);

  const computedKm = useMemo(() => {
    const a = parseFloat(form.depKm);
    const b = parseFloat(form.retKm);
    if (isNaN(a) || isNaN(b) || b < a) return null;
    return Math.round((b - a) * 1000) / 1000;
  }, [form.depKm, form.retKm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) {
      setError('車両を選択してください');
      return;
    }
    if (!form.driverId) {
      setError('ドライバーを選択してください');
      return;
    }
    const departJa = datetimeLocalToJa(form.departAt);
    const arriveJa = datetimeLocalToJa(form.arriveAt);
    if (!departJa || !arriveJa) {
      setError('出発・帰着の日時を入力してください');
      return;
    }
    const depKm = parseFloat(form.depKm);
    const retKm = parseFloat(form.retKm);
    if (isNaN(depKm) || isNaN(retKm) || retKm < depKm) {
      setError('帰着時の走行距離は、出発時以上の値にしてください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addOperationRecord({
        '車両ID': form.vehicleId,
        '車両名': selectedVehicle?.['車両名'] ?? '',
        'ドライバーID': form.driverId,
        'ドライバー名': selectedDriver?.['氏名'] ?? '',
        '出発日時': departJa,
        '帰着日時': arriveJa,
        '出発時走行距離(km)': form.depKm,
        '帰着時走行距離(km)': form.retKm,
        '用途': form.purpose,
        '目的地': form.destination,
        '備考': form.notes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="運行記録を追加" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="車両 *" icon="directions_car">
          <select className={inputCls} value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} required>
            <option value="">車両を選択</option>
            {vehicles.map(v => (
              <option key={v['車両ID']} value={v['車両ID']}>
                {v['車両名']} — {v['ナンバー']}
              </option>
            ))}
          </select>
        </Field>

        <Field label="ドライバー *" icon="badge">
          <select className={inputCls} value={form.driverId} onChange={e => set('driverId', e.target.value)} required>
            <option value="">ドライバーを選択</option>
            {drivers.map(d => (
              <option key={d['ドライバーID']} value={d['ドライバーID']}>
                {d['氏名']}（{d['ステータス']}）
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="出発日時 *" icon="flight_takeoff">
            <input className={inputCls} type="datetime-local" value={form.departAt} onChange={e => set('departAt', e.target.value)} required />
          </Field>
          <Field label="帰着日時 *" icon="flight_land">
            <input className={inputCls} type="datetime-local" value={form.arriveAt} onChange={e => set('arriveAt', e.target.value)} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="出発時走行距離 (km) *" icon="speed">
            <input className={inputCls} type="number" step="0.1" min="0" value={form.depKm} onChange={e => set('depKm', e.target.value)} placeholder="0" required />
          </Field>
          <Field label="帰着時走行距離 (km) *" icon="speed">
            <input className={inputCls} type="number" step="0.1" min="0" value={form.retKm} onChange={e => set('retKm', e.target.value)} placeholder="0" required />
          </Field>
        </div>

        {computedKm != null && (
          <div className="bg-secondary-container rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 18 }}>straighten</span>
            <span className="text-sm font-label text-on-secondary-container">走行距離（自動計算）</span>
            <span className="text-lg font-headline font-bold text-on-secondary-fixed ml-auto">{computedKm} km</span>
          </div>
        )}

        <Field label="用途" icon="work">
          <div className="flex rounded-xl overflow-hidden border border-outline-variant/30">
            {(['仕事', 'プライベート'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm(f => ({ ...f, purpose: p }))}
                className={`flex-1 py-2.5 text-sm font-label font-semibold transition-colors ${
                  form.purpose === p ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        <Field label="目的地" icon="place">
          <input className={inputCls} value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="例：本社・倉庫" />
        </Field>

        <Field label="備考" icon="notes">
          <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold hover:bg-surface-dim transition-colors">
            キャンセル
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-50">
            {loading ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
