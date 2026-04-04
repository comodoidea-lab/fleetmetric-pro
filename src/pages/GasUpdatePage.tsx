import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAS_CODE } from './Setup';
import { GasUpdateContent } from '../components/GasUpdateContent';
import { useGasUpdateContext } from '../context/GasUpdateModalContext';

export function GasUpdatePage() {
  const navigate = useNavigate();
  const { refreshGasVersion } = useGasUpdateContext();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(GAS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 -ml-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">GAS アップデート</h1>
          <p className="text-sm font-label text-on-surface-variant mt-1">
            初回セットアップと同じ Code.gs を上書きし、デプロイを管理から再デプロイします。
          </p>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between gap-3">
          <p className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">Code.gs</p>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-label font-semibold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'コピーしました' : 'コードをコピー'}
          </button>
        </div>
        <div className="p-4 bg-[#1e1e2e] max-h-48 overflow-y-auto">
          <pre className="text-xs text-[#cdd6f4] font-mono whitespace-pre-wrap leading-relaxed">
            {GAS_CODE.slice(0, 400)}…
          </pre>
          <p className="text-[10px] font-label text-[#6c7086] mt-2">全文は「コードをコピー」でクリップボードに入ります。</p>
        </div>
      </section>

      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
        <GasUpdateContent />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => refreshGasVersion()}
          className="px-4 py-2 rounded-full text-sm font-label font-semibold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
        >
          バージョンを再確認
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full text-sm font-label font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          ダッシュボードへ
        </button>
      </div>
    </div>
  );
}
