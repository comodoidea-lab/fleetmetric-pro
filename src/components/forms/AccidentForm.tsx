import { useState } from 'react';
import { useStore } from '../../store/store';
import { Modal, Field, inputCls } from './VehicleForm';

interface Props {
  vehicleId?: string;
  onClose: () => void;
}

export function AccidentForm({ vehicleId, onClose }: Props) {
  const { vehicles, addAccident } = useStore();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    vehicleId: vehicleId ?? '',
    date: today,
    content: '',
    damageArea: '',
    cost: '',
    contractor: '',
    completionDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedVehicle = vehicles.find(v => v['車両ID'] === form.vehicleId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) { setError('車両を選択してください'); return; }
    if (!form.content) { setError('内容を入力してください'); return; }
    setLoading(true); setError('');
    try {
      await addAccident({
        '車両ID': form.vehicleId,
        '車両名': selectedVehicle?.['車両名'] ?? '',
        '日付': form.date.replace(/-/g, '/'),
        '事故・修理内容': form.content,
        '損傷箇所': form.damageArea,
        '費用(円)': form.cost,
        '業者': form.contractor,
        '完了日': form.completionDate.replace(/-/g, '/'),
        '備考': form.notes,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally { setLoading(false); }
  }

  return (
    <Modal title="事故・修理記録を追加" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="車両 *" icon="directions_car">
          <select className={inputCls} value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} required>
            <option value="">車両を選択</option>
            {vehicles.map(v => <option key={v['車両ID']} value={v['車両ID']}>{v['車両名']} — {v['ナンバー']}</option>)}
          </select>
        </Field>

        <Field label="発生日 *" icon="calendar_today">
          <input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </Field>

        <Field label="事故・修理内容 *" icon="report_problem">
          <textarea className={inputCls + ' resize-none'} rows={3} value={form.content} onChange={e => set('content', e.target.value)} placeholder="例：追突事故（軽微）、右フェンダー修理など" required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="損傷箇所" icon="car_crash">
            <input className={inputCls} value={form.damageArea} onChange={e => set('damageArea', e.target.value)} placeholder="例：フロントバンパー" />
          </Field>
          <Field label="費用 (円)" icon="payments">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
              <input className={inputCls + ' pl-7'} type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0" min="0" />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="業者名" icon="store">
            <input className={inputCls} value={form.contractor} onChange={e => set('contractor', e.target.value)} placeholder="例：板金塗装 山田" />
          </Field>
          <Field label="完了日" icon="event_available">
            <input className={inputCls} type="date" value={form.completionDate} onChange={e => set('completionDate', e.target.value)} />
          </Field>
        </div>

        <Field label="備考" icon="notes">
          <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="例：相手方保険対応、保険会社名など" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold hover:bg-surface-dim transition-colors">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-50">
            {loading ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
