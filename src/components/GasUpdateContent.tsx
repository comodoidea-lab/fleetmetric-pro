import { ManualHeading, ManualNote, ManualStep } from './ManualModal';

/** GAS 更新手順（モーダル／専用ページ共通） */
export function GasUpdateContent() {
  return (
    <div className="space-y-3">
      <ManualNote type="warn">
        スクリプトを更新するときは必ず「デプロイを管理」から行ってください。「新しいデプロイ」を使うと新しいURLが発行され、データへの接続が切れます。
      </ManualNote>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl border-2 border-error/40 bg-error-container/10">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-error" style={{ fontSize: 16 }}>cancel</span>
            <p className="text-xs font-label font-bold text-error">NG — やってはいけない</p>
          </div>
          <p className="text-xs font-label text-on-surface leading-relaxed">
            「デプロイ」→<br />
            <strong>「新しいデプロイ」</strong>
          </p>
          <p className="text-xs font-label text-error mt-1.5">新しいURLが発行される → 既存データへの接続が切れる</p>
        </div>
        <div className="p-3 rounded-xl border-2 border-tertiary-fixed/60 bg-tertiary-fixed/10">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-on-tertiary-fixed-variant" style={{ fontSize: 16 }}>check_circle</span>
            <p className="text-xs font-label font-bold text-on-tertiary-fixed-variant">OK — 正しい手順</p>
          </div>
          <p className="text-xs font-label text-on-surface leading-relaxed">
            「デプロイ」→<br />
            <strong>「デプロイを管理」</strong>
          </p>
          <p className="text-xs font-label text-on-tertiary-fixed-variant mt-1.5">URLそのまま → データ接続を維持</p>
        </div>
      </div>

      <ManualHeading>正しい更新手順</ManualHeading>
      <div className="space-y-1.5">
        <ManualStep n="01">スプレッドシートのメニュー「拡張機能」→「Apps Script」でGASエディタを開く</ManualStep>
        <ManualStep n="02">「Code.gs」を選択し、内容を全選択（Ctrl+A）して削除</ManualStep>
        <ManualStep n="03">
          この画面の「コードをコピー」、または初回セットアップ（STEP 1）の「コードをコピー」で最新の Code.gs をコピーして貼り付け、保存（Ctrl+S）
        </ManualStep>
        <ManualStep n="04">
          右上「デプロイ」→ <strong>「デプロイを管理」</strong> をクリック（「新しいデプロイ」ではない）
        </ManualStep>
        <ManualStep n="05">既存のデプロイの右にある鉛筆アイコン（✏️）をクリック</ManualStep>
        <ManualStep n="06">「バージョン」ドロップダウンを <strong>「新バージョン」</strong> に変更</ManualStep>
        <ManualStep n="07">「デプロイ」ボタンをクリック → 完了</ManualStep>
      </div>
      <ManualNote type="info">URLは変わりません。アプリ側の再設定は不要です。</ManualNote>

      <ManualHeading>更新後にやること</ManualHeading>
      <div className="space-y-1.5">
        <ManualStep n="08">アプリの設定（⚙）→ 「スプレッドシートを初期化」を実行する</ManualStep>
      </div>
      <ManualNote type="tip">
        「スプレッドシートを初期化」はシートのヘッダー行を更新するだけで、入力済みのデータは一切削除されません。
      </ManualNote>
      <ManualNote type="info">
        デプロイ後は下の「バージョンを再確認」を押すか、ページを再読み込みすると、お知らせが消えます。
      </ManualNote>
    </div>
  );
}
