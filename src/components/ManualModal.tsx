import { useState } from 'react';

interface Props {
  onClose: () => void;
}

interface Section {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

function ManualStep({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
      <span className="text-xs font-label font-bold flex-shrink-0 px-2 py-0.5 rounded bg-primary-fixed text-primary">{n}</span>
      <p className="text-sm font-label text-on-surface leading-relaxed">{children}</p>
    </div>
  );
}

function ManualNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border bg-primary-fixed/20 text-primary border-primary/20">
      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>info</span>
      <p className="text-xs font-label leading-relaxed">{children}</p>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    icon: 'dashboard',
    title: 'FleetMetric Pro とは',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface leading-relaxed">
          FleetMetric Pro は、社用車の運用データを一元管理するアプリです。現在は Firebase を利用して安全にデータを保存します。
        </p>
        <ManualNote>
          追加セットアップは不要です。Googleログイン後にそのまま利用できます。
        </ManualNote>
      </div>
    ),
  },
  {
    id: 'quickstart',
    icon: 'rocket_launch',
    title: '使い始める手順',
    content: (
      <div className="space-y-2">
        <ManualStep n="01">Googleアカウントでログインする</ManualStep>
        <ManualStep n="02">「車両一覧」で管理対象の車両を登録する</ManualStep>
        <ManualStep n="03">「メンテナンス」「給油」「事故・修理」で実績を記録する</ManualStep>
        <ManualStep n="04">「レポート」で費用推移を確認する</ManualStep>
      </div>
    ),
  },
  {
    id: 'records',
    icon: 'edit_note',
    title: '記録入力のコツ',
    content: (
      <div className="space-y-2">
        <ManualStep n="01">日付は入力漏れ防止のため、当日入力を推奨</ManualStep>
        <ManualStep n="02">給油は「給油量」と「単価」を入力すると費用が自動計算</ManualStep>
        <ManualStep n="03">運行記録は出発/帰着メーター入力で走行距離が自動計算</ManualStep>
        <ManualStep n="04">データ反映が遅い場合は設定から「データを再同期」を実行</ManualStep>
      </div>
    ),
  },
  {
    id: 'multi-driver',
    icon: 'group',
    title: '複数ドライバーモード',
    content: (
      <div className="space-y-2">
        <ManualStep n="01">設定画面の「複数ドライバーモード」をONにする</ManualStep>
        <ManualStep n="02">「ドライバー」メニューで担当者を登録する</ManualStep>
        <ManualStep n="03">「運行記録」で車両とドライバーを紐付けて保存する</ManualStep>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: 'help',
    title: 'よくある質問',
    content: (
      <div className="space-y-2">
        {[
          {
            q: 'スマートフォンでも使えますか？',
            a: 'はい。スマートフォン、タブレット、PC のブラウザで利用できます。',
          },
          {
            q: 'データが表示されないときは？',
            a: '設定画面で「データを再同期」を実行してください。',
          },
          {
            q: 'データはどこに保存されますか？',
            a: 'Firebase (Cloud Firestore) に保存されます。',
          },
        ].map(({ q, a }) => (
          <div key={q} className="p-3 bg-surface-container-low rounded-xl">
            <p className="text-xs font-label font-bold text-on-surface">Q. {q}</p>
            <p className="text-xs font-label text-on-surface-variant mt-1 leading-relaxed">A. {a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export function ManualModal({ onClose }: Props) {
  const [openSection, setOpenSection] = useState<string>('overview');

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 my-4 bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            <div>
              <p className="font-headline font-bold text-on-surface text-base">FleetMetric Pro マニュアル</p>
              <p className="text-xs font-label text-on-surface-variant">Firebase版 操作ガイド</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <nav className="hidden sm:flex flex-col w-48 border-r border-outline-variant/20 overflow-y-auto flex-shrink-0 py-2">
            {SECTIONS.map(({ id, icon, title }) => (
              <button
                key={id}
                onClick={() => setOpenSection(id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-left transition-colors rounded-lg mx-1 ${
                  openSection === id
                    ? 'bg-primary-fixed text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, fontVariationSettings: openSection === id ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                <span className="text-xs font-label leading-tight">{title}</span>
              </button>
            ))}
          </nav>

          <div className="sm:hidden flex-1 overflow-y-auto">
            {SECTIONS.map(({ id, icon, title, content }) => (
              <div key={id} className="border-b border-outline-variant/10">
                <button
                  onClick={() => setOpenSection(openSection === id ? '' : id)}
                  className="flex items-center justify-between w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span className="text-sm font-label font-medium text-on-surface">{title}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
                    {openSection === id ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {openSection === id && <div className="px-4 pb-4 space-y-2">{content}</div>}
              </div>
            ))}
          </div>

          <div className="hidden sm:block flex-1 overflow-y-auto p-5">
            {SECTIONS.map(({ id, icon, title, content }) => openSection === id && (
              <div key={id}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <h2 className="text-base font-headline font-bold text-on-surface">{title}</h2>
                </div>
                <div className="space-y-2">{content}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-outline-variant/20 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs font-label text-on-surface-variant">FleetMetric Pro — Firebase版ガイド</p>
          <button
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
