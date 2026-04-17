import { useStore } from '../store/store';

export function SyncIndicator() {
  const { syncStatus, lastSynced } = useStore();

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-spin border-2 border-primary-fixed-dim" />
        <span className="text-xs font-label font-medium text-on-secondary-container">同期中...</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container">
        <span className="material-symbols-outlined text-on-error-container" style={{ fontSize: 14 }}>wifi_off</span>
        <span className="text-xs font-label font-medium text-on-error-container">接続エラー</span>
      </div>
    );
  }

  if (lastSynced) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed" />
        <span className="text-xs font-label text-on-surface-variant hidden sm:block">
          {lastSynced.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 同期済
        </span>
      </div>
    );
  }

  return null;
}
