import { useState } from 'react';
import { useStore } from '../../store/store';
import { Field, Modal, inputCls } from './VehicleForm';

interface Props {
  onClose: () => void;
}

export function AttendanceForm({ onClose }: Props) {
  const { drivers, vehicles, addAttendanceRecord } = useStore();
  const [form, setForm] = useState({
    driverId: '',
    type: '出勤' as '出勤' | '退勤',
    vehicleId: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedDriver = drivers.find((d) => d['ドライバーID'] === form.driverId);
  const selectedVehicle = vehicles.find((v) => v['車両ID'] === form.vehicleId);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.driverId) {
      setError('ドライバーを選択してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addAttendanceRecord({
        driverId: form.driverId,
        driverName: selectedDriver?.['氏名'] ?? '',
        vehicleId: form.vehicleId || undefined,
        vehicleName: selectedVehicle?.['車両名'] ?? '',
        type: form.type,
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
    <Modal title="出退勤を記録" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="ドライバー *" icon="badge">
          <select className={inputCls} value={form.driverId} onChange={(e) => set('driverId', e.target.value)} required>
            <option value="">ドライバーを選択</option>
            {drivers.map((d) => (
              <option key={d['ドライバーID']} value={d['ドライバーID']}>
                {d['氏名']}（{d['ステータス']}）
              </option>
            ))}
          </select>
        </Field>

        <Field label="種別 *" icon="schedule">
          <div className="grid grid-cols-2 gap-2">
            {(['出勤', '退勤'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type }))}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  form.type === type
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
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

        <Field label="メモ" icon="notes">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="任意メモ"
          />
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
