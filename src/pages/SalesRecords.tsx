import { useMemo, useState } from 'react';
import { DialogModal } from '../components/DialogModal';
import { SalesForm } from '../components/forms/SalesForm';
import { useStore } from '../store/store';
import { DEFAULT_SALES_CATEGORIES } from '../data/salesDefaults';

const DEFAULT_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#db2777', '#7c3aed', '#475569'];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
}

export function SalesRecords() {
  const {
    salesRecords,
    salesCategories,
    addSalesCategory,
    deleteSalesCategory,
    deleteSalesRecord,
  } = useStore();
  const today = dateKey(new Date());
  const [month, setMonth] = useState(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', color: DEFAULT_COLORS[0], icon: 'payments' });
  const [categoryError, setCategoryError] = useState('');

  const recordsByDate = useMemo(() => {
    const map = new Map<string, typeof salesRecords>();
    salesRecords.forEach(record => map.set(record.date, [...(map.get(record.date) ?? []), record]));
    return map;
  }, [salesRecords]);

  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const monthRecords = salesRecords.filter(record => record.date.startsWith(monthPrefix));
  const monthTotal = monthRecords.reduce((sum, record) => sum + record.amount, 0);
  const activeDays = new Set(monthRecords.map(record => record.date)).size;
  const averagePerDay = activeDays ? Math.round(monthTotal / activeDays) : 0;
  const selectedRecords = [...(recordsByDate.get(selectedDate) ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [month]);

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) {
      setCategoryError('種類名を入力してください');
      return;
    }
    if (salesCategories.some(category => category.name === name)) {
      setCategoryError('同じ名前の種類が既にあります');
      return;
    }
    await addSalesCategory({ ...categoryForm, name });
    setCategoryForm({ name: '', color: DEFAULT_COLORS[0], icon: 'payments' });
    setCategoryError('');
    setShowCategoryForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">売上記録</h1>
          <p className="mt-1 text-sm text-on-surface-variant">カレンダーで日々の売上をかんたん管理</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          売上を記録
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: '今月の売上', value: `¥${monthTotal.toLocaleString()}`, icon: 'payments' },
          { label: '売上記録日数', value: `${activeDays}日`, icon: 'calendar_month' },
          { label: '1日平均', value: `¥${averagePerDay.toLocaleString()}`, icon: 'monitoring' },
        ].map(item => (
          <div key={item.label} className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-label text-on-surface-variant">{item.label}</p>
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>{item.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-headline font-bold text-on-surface">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)]">
        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-4 sm:px-5">
            <button
              onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              aria-label="前の月"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="text-center">
              <h2 className="font-headline font-bold text-on-surface">{monthLabel(month)}</h2>
              <button
                onClick={() => {
                  const current = new Date();
                  setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
                  setSelectedDate(today);
                }}
                className="mt-0.5 text-xs font-semibold text-primary"
              >
                今日に戻る
              </button>
            </div>
            <button
              onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              aria-label="次の月"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-outline-variant/20 bg-surface-container-low">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div key={day} className={`py-2 text-center text-xs font-semibold ${index === 0 ? 'text-error' : index === 6 ? 'text-primary' : 'text-on-surface-variant'}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const key = dateKey(day);
              const records = recordsByDate.get(key) ?? [];
              const total = records.reduce((sum, record) => sum + record.amount, 0);
              const inMonth = day.getMonth() === month.getMonth();
              const selected = key === selectedDate;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`relative min-h-20 border-b border-r border-outline-variant/15 p-1.5 text-left sm:min-h-24 sm:p-2 ${
                    selected ? 'bg-primary/5 ring-2 ring-inset ring-primary/30' : 'hover:bg-surface-container-low'
                  } ${inMonth ? '' : 'opacity-35'}`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    key === today ? 'bg-primary text-on-primary' : 'text-on-surface'
                  }`}>
                    {day.getDate()}
                  </span>
                  {total > 0 && (
                    <>
                      <p className="mt-1 truncate text-[10px] font-bold text-primary sm:text-xs">¥{total.toLocaleString()}</p>
                      <div className="mt-1 flex gap-0.5">
                        {records.slice(0, 3).map(record => {
                          const category = salesCategories.find(item => item.id === record.categoryId);
                          return <span key={record.id} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: category?.color ?? '#64748b' }} />;
                        })}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
              <div>
                <h2 className="font-headline text-sm font-bold text-on-surface">
                  {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                </h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  合計 ¥{selectedRecords.reduce((sum, record) => sum + record.amount, 0).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setShowForm(true)} className="rounded-full bg-secondary-container p-2 text-primary" aria-label="選択日に売上を追加">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
              </button>
            </div>
            {selectedRecords.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">receipt_long</span>
                <p className="mt-2 text-sm text-on-surface-variant">この日の売上はまだありません</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {selectedRecords.map(record => {
                  const category = salesCategories.find(item => item.id === record.categoryId);
                  return (
                    <div key={record.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: category?.color ?? '#64748b' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{category?.icon ?? 'payments'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">{record.categoryName}</p>
                        <p className="truncate text-xs text-on-surface-variant">{record.platform || record.note || '詳細なし'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-on-surface">¥{record.amount.toLocaleString()}</p>
                        <button onClick={() => setDeleteRecordId(record.id)} className="text-xs text-error">削除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-sm font-bold text-on-surface">売上の種類</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">業種やプラットフォームに合わせて自由に設定</p>
              </div>
              <button onClick={() => setShowCategoryForm(current => !current)} className="text-xs font-semibold text-primary">
                {showCategoryForm ? '閉じる' : '種類を追加'}
              </button>
            </div>

            {showCategoryForm && (
              <form onSubmit={createCategory} className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-3">
                {categoryError && <p className="text-xs text-error">{categoryError}</p>}
                <input
                  className="w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(current => ({ ...current, name: e.target.value }))}
                  placeholder="例：Uber、配送料、貸切"
                />
                <div className="flex items-center gap-2">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm(current => ({ ...current, color }))}
                      className={`h-7 w-7 rounded-full ${categoryForm.color === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`色 ${color}`}
                    />
                  ))}
                </div>
                <button type="submit" className="w-full rounded-full bg-primary py-2 text-xs font-semibold text-on-primary">追加する</button>
              </form>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {salesCategories.map(category => (
                <div key={category.id} className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-xs font-semibold text-on-surface">{category.name}</span>
                  {!DEFAULT_SALES_CATEGORIES.some(item => item.id === category.id)
                    && !salesRecords.some(record => record.categoryId === category.id) && (
                    <button onClick={() => deleteSalesCategory(category.id)} className="text-on-surface-variant" aria-label={`${category.name}を削除`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showForm && <SalesForm initialDate={selectedDate} onClose={() => setShowForm(false)} />}
      {deleteRecordId && (
        <DialogModal
          variant="danger"
          title="売上記録を削除"
          message="この売上記録を削除しますか？"
          confirmLabel="削除する"
          onConfirm={() => deleteSalesRecord(deleteRecordId)}
          onClose={() => setDeleteRecordId(null)}
        />
      )}
    </div>
  );
}
