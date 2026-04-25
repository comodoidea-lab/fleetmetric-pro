import { useMemo, useState } from 'react';
import { useStore } from '../../store/store';
import { Modal, Field, inputCls } from './VehicleForm';

const BASE_WORK_TYPES = ['法定点検', '車検', 'タイヤ交換', 'バッテリー交換', '定期点検'];
const TWO_WHEELER_WORK_TYPES = ['チェーン交換', 'チェーン清掃・注油', 'タイヤ空気圧確認', 'ブレーキパッド確認'];
const BIKE_ONLY_WORK_TYPES = ['オイル交換', 'エレメント交換'];

interface Props {
  vehicleId?: string;
  onClose: () => void;
}

export function MaintenanceForm({ vehicleId, onClose }: Props) {
  const { vehicles, addMaintenance } = useStore();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    vehicleId: vehicleId ?? '',
    date: today,
    workTypes: [] as string[],
    customWork: '',
    mileage: '',
    cost: '',
    contractor: '',
    nextDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleWork = (w: string) => setForm(f => ({
    ...f,
    workTypes: f.workTypes.includes(w) ? f.workTypes.filter(x => x !== w) : [...f.workTypes, w],
  }));
  const selectedVehicle = vehicles.find(v => v['車両ID'] === form.vehicleId);
  const selectedVehicleType = selectedVehicle?.vehicleType || '車';
  const workTypeOptions = useMemo(() => {
    if (selectedVehicleType === 'バイク') {
      return [...BASE_WORK_TYPES, ...TWO_WHEELER_WORK_TYPES, ...BIKE_ONLY_WORK_TYPES, 'その他'];
    }
    if (selectedVehicleType === '自転車') {
      return [...BASE_WORK_TYPES, ...TWO_WHEELER_WORK_TYPES, 'その他'];
    }
    return [...BASE_WORK_TYPES, 'オイル交換', 'ブレーキ点検', 'その他'];
  }, [selectedVehicleType]);
  const workContent = [...form.workTypes, ...(form.customWork.trim() ? [form.customWork.trim()] : [])].join('、');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) { setError('車両を選択してください'); return; }
    if (!workContent) { setError('作業内容を選択または入力してください'); return; }
    setLoading(true); setError('');
    try {
      await addMaintenance({
        '車両ID': form.vehicleId,
        '車両名': selectedVehicle?.['車両名'] ?? '',
        '日付': form.date.replace(/-/g, '/'),
        '走行距離(km)': form.mileage,
        '作業内容': workContent,
        '費用(円)': form.cost,
        '業者': form.contractor,
        '次回予定日': form.nextDate.replace(/-/g, '/'),
        '備考': form.notes,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally { setLoading(false); }
  }

  return (
    <Modal title="メンテナンス記録を追加" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="車両 *" icon="directions_car">
          <select className={inputCls} value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} required>
            <option value="">車両を選択</option>
            {vehicles.map(v => <option key={v['車両ID']} value={v['車両ID']}>{v['車両名']} — {v['ナンバー']}（{v.vehicleType || '車'}）</option>)}
          </select>
        </Field>

        <Field label="日付 *" icon="calendar_today">
          <input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </Field>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-label uppercase tracking-wider text-on-surface-variant mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>build</span>
            作業内容 *
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {workTypeOptions.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => toggleWork(w)}
                className={`py-2.5 px-3 rounded-lg text-sm font-label font-medium text-left transition-all flex items-center gap-2 ${
                  form.workTypes.includes(w) ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                }`}
              >
                {form.workTypes.includes(w) && <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 14 }}>check</span>}
                {w}
              </button>
            ))}
          </div>
          {workContent && (
            <p className="text-xs font-label text-primary bg-primary-fixed/30 px-3 py-1.5 rounded-lg mb-2">
              選択中: {workContent}
            </p>
          )}
          {form.workTypes.includes('その他') && (
            <input
              className={inputCls}
              value={form.customWork}
              onChange={e => set('customWork', e.target.value)}
              placeholder="その他（自由入力）"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="費用 (円)" icon="payments">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
              <input className={inputCls + ' pl-7'} type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0" min="0" />
            </div>
          </Field>
          <Field label="走行距離 (km)" icon="speed">
            <input className={inputCls} type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="0" min="0" />
          </Field>
        </div>

        <Field label="業者名" icon="store">
          <input className={inputCls} value={form.contractor} onChange={e => set('contractor', e.target.value)} placeholder="例：トヨタディーラー" />
        </Field>

        <Field label="次回予定日" icon="event_upcoming">
          <input className={`${inputCls} border-2 border-dashed border-outline-variant focus:border-primary`} type="date" value={form.nextDate} onChange={e => set('nextDate', e.target.value)} />
        </Field>

        <Field label="備考" icon="notes">
          <textarea className={inputCls + ' resize-none'} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="備考・メモ" />
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
