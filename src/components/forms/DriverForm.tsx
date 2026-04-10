import { useState } from 'react';
import { useStore } from '../../store/store';
import { Driver } from '../../types';
import { Modal, Field, inputCls } from './VehicleForm';

interface Props {
  driver?: Driver | null;
  onClose: () => void;
}

export function DriverForm({ driver, onClose }: Props) {
  const { addDriver, updateDriver } = useStore();
  const isEdit = !!driver;

  const [form, setForm] = useState({
    '氏名': driver?.['氏名'] ?? '',
    '電話番号': driver?.['電話番号'] ?? '',
    'ステータス': driver?.['ステータス'] ?? '稼働中',
    '備考': driver?.['備考'] ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form['氏名'].trim()) {
      setError('氏名は必須です');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isEdit && driver) {
        await updateDriver({
          ...driver,
          ...form,
          'ステータス': form['ステータス'] as Driver['ステータス'],
        });
      } else {
        await addDriver({
          '氏名': form['氏名'].trim(),
          '電話番号': form['電話番号'].trim(),
          'ステータス': form['ステータス'] as Driver['ステータス'],
          '備考': form['備考'].trim(),
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? 'ドライバーを編集' : 'ドライバーを追加'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

        <Field label="氏名 *" icon="badge">
          <input className={inputCls} value={form['氏名']} onChange={e => set('氏名', e.target.value)} required placeholder="例：山田 太郎" />
        </Field>

        <Field label="電話番号" icon="phone">
          <input className={inputCls} type="tel" value={form['電話番号']} onChange={e => set('電話番号', e.target.value)} placeholder="090-0000-0000" />
        </Field>

        <Field label="ステータス" icon="toggle_on">
          <select
            className={inputCls}
            value={form['ステータス']}
            onChange={e => set('ステータス', e.target.value as Driver['ステータス'])}
          >
            <option value="稼働中">稼働中</option>
            <option value="休止">休止</option>
          </select>
        </Field>

        <Field label="備考" icon="notes">
          <textarea className={inputCls + ' resize-none'} rows={2} value={form['備考']} onChange={e => set('備考', e.target.value)} placeholder="メモ" />
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
