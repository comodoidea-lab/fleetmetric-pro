import { GasUpdateContent } from './GasUpdateContent';

type Props = {
  onClose: () => void;
  /** GAS デプロイ後にバージョンを再取得 */
  onRecheck: () => void;
};

export function GasUpdateModal({ onClose, onRecheck }: Props) {
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto py-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="gas-update-title"
        className="relative w-full max-w-2xl mx-4 my-2 bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 22 }}>
              system_update
            </span>
            <div className="min-w-0">
              <p id="gas-update-title" className="font-headline font-bold text-on-surface text-base truncate">
                GAS スクリプトのアップデート
              </p>
              <p className="text-xs font-label text-on-surface-variant">デプロイを管理から更新してください</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant flex-shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <GasUpdateContent />
        </div>
        <div className="px-5 py-3 border-t border-outline-variant/20 flex flex-wrap gap-2 justify-end flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              onRecheck();
            }}
            className="px-4 py-2 rounded-full text-xs font-label font-semibold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
          >
            バージョンを再確認
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-label font-semibold hover:bg-primary/90 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
