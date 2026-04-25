import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';
import { AttendanceForm } from '../components/forms/AttendanceForm';
import { DialogModal } from '../components/DialogModal';

function AttendanceTypeIcon({ type, iconId }: { type: '出勤' | '退勤'; iconId: string }) {
  const isClockIn = type === '出勤';
  const clipId = `attendance-clip-${iconId}`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" className="w-5 h-5">
      <defs>
        <clipPath id={clipId}>
          <rect width="512" height="512" rx="90" ry="90" />
        </clipPath>
      </defs>
      <rect
        width="512"
        height="512"
        rx="90"
        ry="90"
        fill={isClockIn ? '#3F7D3D' : '#7D3D54'}
        clipPath={`url(#${clipId})`}
      />
      <g clipPath={`url(#${clipId})`}>
        <g transform="rotate(0, 256, 256)">
          <g transform="translate(64 64) scale(16 16) translate(0 0)">
            {isClockIn ? (
              <path
                fill="none"
                stroke="#F7F7F7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m10 17l5-5l-5-5m5 5H3m12-9h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
              />
            ) : (
              <path
                fill="none"
                stroke="#F7F7F7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
              />
            )}
          </g>
        </g>
      </g>
    </svg>
  );
}

export function Attendance() {
  const navigate = useNavigate();
  const { multiDriverMode } = useMultiDriverMode();
  const { attendanceRecords, deleteAttendanceRecord } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!multiDriverMode) navigate('/', { replace: true });
  }, [multiDriverMode, navigate]);

  const sorted = useMemo(
    () => [...attendanceRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [attendanceRecords],
  );

  if (!multiDriverMode) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">出退勤</h1>
          <p className="text-sm font-label text-on-surface-variant mt-0.5">{attendanceRecords.length}件の記録</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="hidden sm:inline">記録を追加</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl block mb-3">event_available</span>
            <p className="text-on-surface-variant text-sm">出退勤記録がありません</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {sorted.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center">
                  <AttendanceTypeIcon type={r.type} iconId={r.id} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">{r.driverName}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(r.timestamp).toLocaleString('ja-JP')} · {r.vehicleName || '車両未選択'}
                  </p>
                  {r.note ? <p className="text-xs text-on-surface-variant mt-0.5">{r.note}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.type === '出勤' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-container text-on-secondary-fixed'}`}>
                    {r.type}
                  </span>
                  <button onClick={() => setDeleteId(r.id)} className="text-xs text-error hover:underline">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <AttendanceForm onClose={() => setShowForm(false)} />}
      {deleteId && (
        <DialogModal
          variant="danger"
          title="記録を削除"
          message="この出退勤記録を削除しますか？"
          confirmLabel="削除する"
          onConfirm={() => deleteAttendanceRecord(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
