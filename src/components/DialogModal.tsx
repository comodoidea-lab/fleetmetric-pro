// ============================================================
// FleetMetric Pro - 共通ダイアログモーダル
// OS標準の confirm/alert の代替
// ============================================================

import { useEffect } from 'react';

interface DialogModalProps {
  /** ダイアログのタイトル（省略時はvariantに応じたデフォルト） */
  title?: string;
  /** 本文メッセージ */
  message: string;
  /** 確認ボタンのラベル（デフォルト: "削除する"） */
  confirmLabel?: string;
  /** キャンセルボタンのラベル（デフォルト: "キャンセル"） */
  cancelLabel?: string;
  /** danger: 赤い確認ボタン / info: 通知のみ（OKボタン1つ） */
  variant?: 'danger' | 'default' | 'info';
  /** 確認ボタン押下時のコールバック */
  onConfirm?: () => void;
  /** 閉じる時のコールバック（キャンセル・背景クリック） */
  onClose: () => void;
}

export function DialogModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'キャンセル',
  variant = 'default',
  onConfirm,
  onClose,
}: DialogModalProps) {
  const isInfoOnly = variant === 'info' || !onConfirm;

  const defaultTitle = isInfoOnly ? '完了' : variant === 'danger' ? '削除の確認' : '確認';
  const defaultConfirmLabel = variant === 'danger' ? '削除する' : 'OK';

  // Escape キーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Icon + Title */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            variant === 'danger'
              ? 'bg-error-container'
              : variant === 'info'
              ? 'bg-secondary-container'
              : 'bg-surface-container-high'
          }`}>
            <span className={`material-symbols-outlined ${
              variant === 'danger'
                ? 'text-error'
                : variant === 'info'
                ? 'text-on-secondary-container'
                : 'text-on-surface-variant'
            }`} style={{ fontSize: 24 }}>
              {variant === 'danger' ? 'delete_forever' : variant === 'info' ? 'check_circle' : 'help'}
            </span>
          </div>
          <div>
            <h3 className="text-base font-headline font-bold text-on-surface">
              {title ?? defaultTitle}
            </h3>
            <p className="text-sm font-label text-on-surface-variant mt-1 whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className={`px-6 pb-6 flex gap-3 ${isInfoOnly ? 'justify-center' : ''}`}>
          {!isInfoOnly && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold hover:bg-surface-dim transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => { onConfirm?.(); onClose(); }}
            className={`${isInfoOnly ? 'px-8' : 'flex-1'} py-2.5 rounded-full text-sm font-semibold transition-colors ${
              variant === 'danger'
                ? 'bg-error text-on-error hover:bg-error/90'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            {confirmLabel ?? defaultConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
