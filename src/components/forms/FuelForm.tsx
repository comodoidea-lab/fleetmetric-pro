import { useState, useEffect } from 'react';
import { useStore } from '../../store/store';
import { Modal, Field, inputCls } from './VehicleForm';

interface Props {
  vehicleId?: string;
  onClose: () => void;
}

export function FuelForm({ vehicleId, onClose }: Props) {
  const { vehicles, addFuel } = useStore();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    vehicleId: vehicleId ?? '',
    date: today,
    mileage: '',
    amount: '',
    unitPrice: '',
    station: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const computedCost = form.amount && form.unitPrice
    ? Math.round(parseFloat(form.amount) * parseFloat(form.unitPrice))
    : 0;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedVehicle = vehicles.find(v => v['車両ID'] === form.vehicleId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) { setError('車両を選択してください'); return; }
    if (!form.amount || !form.unitPrice) { setError('給油量と単価を入力してください'); return; }
    setLoading(true); setError('');
    try {
      await addFuel({
        '車両ID': form.vehicleId,
        '車両名': selectedVehicle?.['車両名'] ?? '',
        '日付': form.date.replace(/-/g, '/'),
        '走行距離(km)': form.mileage,
        '給油量(L)': form.amount,
        '単価(円/L)': form.unitPrice,
        '費用(円)': computedCost,
        'スタンド名': form.station,
        '備考': form.notes,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally { setLoading(false); }
  }

  return (
    <Modal title="給油記録を追加" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="車両 *" icon="directions_car">
          <select className={inputCls} value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} required>
            <option value="">車両を選択</option>
            {vehicles.map(v => <option key={v['車両ID']} value={v['車両ID']}>{v['車両名']} — {v['ナンバー']}</option>)}
          </select>
        </Field>

        <Field label="日付 *" icon="calendar_today">
          <input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="給油量 (L) *" icon="local_gas_station">
            <input className={inputCls} type="number" step="0.1" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.0" min="0" required />
          </Field>
          <Field label="単価 (円/L) *" icon="price_change">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
              <input className={inputCls + ' pl-7'} type="number" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} placeholder="170" min="0" required />
            </div>
          </Field>
        </div>

        {computedCost > 0 && (
          <div className="bg-secondary-container rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 18 }}>calculate</span>
            <span className="text-sm font-label text-on-secondary-container">給油費合計：</span>
            <span className="text-lg font-headline font-bold text-on-secondary-fixed">¥{computedCost.toLocaleString()}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="走行距離 (km)" icon="speed">
            <input className={inputCls} type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="0" min="0" />
          </Field>
          <Field label="スタンド名" icon="store">
            <input className={inputCls} value={form.station} onChange={e => set('station', e.target.value)} placeholder="例：ENEOS 渋谷店" />
          </Field>
        </div>

        <Field label="備考" icon="notes">
          <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="備考・メモ" />
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
