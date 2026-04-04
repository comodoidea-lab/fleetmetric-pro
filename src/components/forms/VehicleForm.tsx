import { useState } from 'react';
import { useStore } from '../../store/store';
import { Vehicle } from '../../types';

const VEHICLE_ICONS = [
  { value: 'directions_car',  label: '乗用車' },
  { value: 'two_wheeler',     label: 'バイク' },
  { value: 'electric_bike',   label: '電動自転車' },
  { value: 'local_shipping',  label: 'トラック' },
  { value: 'airport_shuttle', label: 'バン' },
  { value: 'directions_bus',  label: 'バス' },
];

interface Props {
  vehicle?: Vehicle | null;
  onClose: () => void;
}

export function VehicleForm({ vehicle, onClose }: Props) {
  const { addVehicle, updateVehicle } = useStore();
  const isEdit = !!vehicle;

  const [form, setForm] = useState({
    '車両名': vehicle?.['車両名'] ?? '',
    'ナンバー': vehicle?.['ナンバー'] ?? '',
    'メーカー': vehicle?.['メーカー'] ?? '',
    '車種': vehicle?.['車種'] ?? '',
    '年式': vehicle?.['年式'] ?? '',
    '車検期限': vehicle?.['車検期限']?.replace(/\//g, '-') ?? '',
    '法定点検期限': vehicle?.['法定点検期限']?.replace(/\//g, '-') ?? '',
    'ステータス': vehicle?.['ステータス'] ?? '稼働中',
    '備考': vehicle?.['備考'] ?? '',
    'アイコン': vehicle?.['アイコン'] ?? 'directions_car',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form['車両名'] || !form['ナンバー']) { setError('車両名とナンバープレートは必須です'); return; }
    setLoading(true);
    setError('');
    try {
      const data = {
        ...form,
        '車検期限': form['車検期限'].replace(/-/g, '/'),
        '法定点検期限': form['法定点検期限'].replace(/-/g, '/'),
        'アイコン': form['アイコン'],
      };
      if (isEdit && vehicle) {
        await updateVehicle({ ...vehicle, ...data });
      } else {
        await addVehicle(data as Omit<Vehicle, '車両ID' | '登録日'>);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? '車両を編集' : '車両を追加'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="車両アイコン" icon="category">
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_ICONS.map(ic => (
              <button
                key={ic.value}
                type="button"
                onClick={() => set('アイコン', ic.value)}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-label transition-all ${
                  form['アイコン'] === ic.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{ic.value}</span>
                {ic.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="車両名 *" icon="directions_car">
            <input className={inputCls} value={form['車両名']} onChange={e => set('車両名', e.target.value)} placeholder="例：トヨタ プリウス" required />
          </Field>
          <Field label="ナンバープレート *" icon="pin">
            <input className={inputCls} value={form['ナンバー']} onChange={e => set('ナンバー', e.target.value)} placeholder="例：品川 300 あ 1234" required />
          </Field>
          <Field label="メーカー" icon="factory">
            <input className={inputCls} value={form['メーカー']} onChange={e => set('メーカー', e.target.value)} placeholder="例：トヨタ" />
          </Field>
          <Field label="車種" icon="directions_car">
            <input className={inputCls} value={form['車種']} onChange={e => set('車種', e.target.value)} placeholder="例：プリウス" />
          </Field>
          <Field label="年式" icon="calendar_today">
            <input className={inputCls} type="number" value={form['年式']} onChange={e => set('年式', e.target.value)} placeholder="例：2021" min="1990" max="2030" />
          </Field>
          <Field label="ステータス" icon="info">
            <select className={inputCls} value={form['ステータス']} onChange={e => set('ステータス', e.target.value)}>
              <option>稼働中</option>
              <option>整備中</option>
              <option>廃車</option>
            </select>
          </Field>
          <Field label="車検期限" icon="event">
            <input className={inputCls} type="date" value={form['車検期限']} onChange={e => set('車検期限', e.target.value)} />
          </Field>
          <Field label="法定点検期限" icon="event_available">
            <input className={inputCls} type="date" value={form['法定点検期限']} onChange={e => set('法定点検期限', e.target.value)} />
          </Field>
        </div>

        <Field label="備考" icon="notes">
          <textarea className={inputCls + ' resize-none'} rows={2} value={form['備考']} onChange={e => set('備考', e.target.value)} placeholder="備考・メモ" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold hover:bg-surface-dim transition-colors">
            キャンセル
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-50">
            {loading ? '保存中...' : isEdit ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Shared helpers
const inputCls = 'w-full px-3 py-2.5 bg-surface-container-low rounded-lg text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant';

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1.5">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 pb-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-container-lowest px-5 pt-5 pb-3 border-b border-outline-variant/20 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-headline font-bold text-on-surface">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>
        <div className="px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

export { Modal, Field, inputCls };
