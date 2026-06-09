import { useMemo, useState } from 'react';
import { useStore } from '../../store/store';
import { Field, inputCls, Modal } from './VehicleForm';

interface Props {
  initialDate?: string;
  onClose: () => void;
}

export function SalesForm({ initialDate, onClose }: Props) {
  const { salesCategories, addSalesRecord } = useStore();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: initialDate ?? today,
    amount: '',
    categoryId: salesCategories[0]?.id ?? '',
    platform: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedCategory = useMemo(
    () => salesCategories.find(category => category.id === form.categoryId),
    [form.categoryId, salesCategories],
  );

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!selectedCategory) {
      setError('売上の種類を選択してください');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('売上金額を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addSalesRecord({
        date: form.date,
        amount,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        platform: form.platform.trim(),
        note: form.note.trim(),
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="売上を記録" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}

        <Field label="日付 *" icon="calendar_today">
          <input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </Field>

        <Field label="売上金額 *" icon="payments">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">¥</span>
            <input
              className={`${inputCls} pl-7 text-lg font-bold`}
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="12,000"
              autoFocus
              required
            />
          </div>
        </Field>

        <Field label="売上の種類 *" icon="category">
          <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
            <option value="">種類を選択</option>
            {salesCategories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </Field>

        <Field label="業種・プラットフォーム" icon="storefront">
          <input
            className={inputCls}
            value={form.platform}
            onChange={e => set('platform', e.target.value)}
            placeholder="例：Uber、出前館、自社配送"
          />
        </Field>

        <Field label="メモ" icon="notes">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="稼働時間、エリア、特記事項など"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full bg-surface-container-high py-2.5 text-sm font-semibold text-on-surface">
            キャンセル
          </button>
          <button type="submit" disabled={loading} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50">
            {loading ? '保存中...' : '記録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
