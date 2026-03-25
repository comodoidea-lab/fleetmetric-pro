interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const base = size === 'sm'
    ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-label'
    : 'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold font-label';

  if (status === '稼働中') {
    return <span className={`${base} bg-tertiary-fixed text-on-tertiary-fixed`}>{status}</span>;
  }
  if (status === '整備中') {
    return <span className={`${base} bg-secondary-container text-on-secondary-fixed`}>{status}</span>;
  }
  if (status === '廃車') {
    return <span className={`${base} bg-surface-container-high text-on-surface-variant`}>{status}</span>;
  }
  // Generic
  return <span className={`${base} bg-surface-container text-on-surface-variant`}>{status}</span>;
}

export function AlertBadge({ type }: { type: 'danger' | 'warning' }) {
  if (type === 'danger') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-error-container text-on-error-container">
        <span className="material-symbols-outlined text-xs" style={{ fontSize: 12 }}>error</span>
        期限切れ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
      <span className="material-symbols-outlined text-xs" style={{ fontSize: 12 }}>warning</span>
      要注意
    </span>
  );
}
