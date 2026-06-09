import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
}

interface Section {
  id: string;
  icon: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

function GuideStep({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3.5">
      <span className="material-symbols-outlined flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary" style={{ fontSize: 19 }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-on-surface">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">{children}</p>
      </div>
    </div>
  );
}

function GuideNote({
  icon = 'lightbulb',
  children,
}: {
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary-fixed/25 px-3.5 py-3 text-primary">
      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 17 }}>{icon}</span>
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function MiniCard({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3">
      <span className="material-symbols-outlined text-primary" style={{ fontSize: 19 }}>{icon}</span>
      <p className="mt-2 text-xs font-bold text-on-surface">{label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">{text}</p>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'start',
    icon: 'rocket_launch',
    title: 'はじめに',
    summary: '最初の登録から日々の確認まで',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-primary to-primary-container p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Quick Start</p>
          <p className="mt-1 font-headline text-lg font-bold">まずは車両を登録しましょう</p>
          <p className="mt-1 text-xs leading-relaxed opacity-80">
            車両を登録すると、整備・給油・事故・運行の各記録を車両ごとに管理できます。
          </p>
        </div>
        <GuideStep icon="directions_car" title="1. 車両を登録">
          「車両一覧」の追加ボタンから、車両名、ナンバー、車検期限などを入力します。
        </GuideStep>
        <GuideStep icon="edit_note" title="2. 日々の実績を記録">
          PCは左メニュー、スマートフォンは画面下の「記録」から各入力画面を開けます。
        </GuideStep>
        <GuideStep icon="dashboard" title="3. ダッシュボードで確認">
          今月の売上、総運用コスト、期限アラート、最近の整備状況をまとめて確認できます。
        </GuideStep>
      </div>
    ),
  },
  {
    id: 'fleet',
    icon: 'garage',
    title: '車両と運用記録',
    summary: '車両・整備・給油・事故の管理',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniCard icon="directions_car" label="車両一覧" text="基本情報、期限、稼働状態を管理" />
          <MiniCard icon="build" label="メンテナンス" text="作業内容、費用、次回予定を記録" />
          <MiniCard icon="local_gas_station" label="給油記録" text="給油量と単価から費用を自動計算" />
          <MiniCard icon="report_problem" label="事故・修理" text="損傷、修理費、完了日を保存" />
        </div>
        <GuideNote>
          車検・法定点検の期限が近づくと、ダッシュボードと通知ベルにアラートが表示されます。
        </GuideNote>
        <GuideStep icon="speed" title="入力を正確にするコツ">
          給油や整備の際に走行距離も入力すると、車両ごとの履歴を追いやすくなります。
        </GuideStep>
        <GuideStep icon="bar_chart" title="費用を振り返る">
          「レポート」では、給油費や整備費などの集計を確認できます。
        </GuideStep>
      </div>
    ),
  },
  {
    id: 'sales',
    icon: 'payments',
    title: '売上管理',
    summary: 'カレンダーと種類別集計の使い方',
    content: (
      <div className="space-y-3">
        <GuideStep icon="add_circle" title="売上を記録">
          ダッシュボードのクイックアクセス、または「売上記録」の追加ボタンから、日付・金額・種類を入力します。
        </GuideStep>
        <GuideStep icon="calendar_month" title="カレンダーで把握">
          日ごとの合計金額をカレンダー上で確認できます。日付を選ぶと、その日の明細が表示されます。
        </GuideStep>
        <GuideStep icon="category" title="売上の種類をカスタマイズ">
          Uber、出前館、自社売上などの標準種類に加え、業種やプラットフォームに合わせて名前と色を追加できます。
        </GuideStep>
        <GuideStep icon="donut_large" title="種類別の構成を確認">
          ダッシュボードの「売上ブレイクダウン」で、今月の売上構成を種類別に確認できます。
        </GuideStep>
        <GuideNote icon="info">
          使用中の売上種類は誤削除を防ぐため削除できません。不要な種類は、関連する売上記録を整理してから削除してください。
        </GuideNote>
      </div>
    ),
  },
  {
    id: 'drivers',
    icon: 'group',
    title: '複数ドライバー',
    summary: '運行・出退勤・安全確認',
    content: (
      <div className="space-y-3">
        <GuideNote>
          この機能を使う場合は、設定画面で「複数ドライバーモード」をONにします。
        </GuideNote>
        <GuideStep icon="badge" title="ドライバーを登録">
          氏名、電話番号、稼働状態を登録します。登録後、運行や安全確認で選択できるようになります。
        </GuideStep>
        <GuideStep icon="route" title="運行記録">
          車両とドライバー、出発・帰着時刻、メーター値を入力します。走行距離は自動計算されます。
        </GuideStep>
        <GuideStep icon="event_available" title="出退勤">
          出勤・退勤の時刻と使用車両を記録し、勤務状況を管理します。
        </GuideStep>
        <GuideStep icon="monitoring" title="アルコールチェック">
          運行前後の確認方法、検知器使用、結果、確認者を記録します。要確認の結果はアラートに反映されます。
        </GuideStep>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: 'settings',
    title: '設定・共有',
    summary: '同期、組織、テーマ、データ出力',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniCard icon="sync" label="データ同期" text="最新状態を再取得" />
          <MiniCard icon="palette" label="テーマ" text="画面配色を切り替え" />
          <MiniCard icon="group_add" label="組織共有" text="招待コードでメンバーを追加" />
          <MiniCard icon="download" label="CSV出力" text="登録データをファイル保存" />
        </div>
        <GuideStep icon="refresh" title="表示が更新されないとき">
          画面上部の更新ボタン、または設定のデータ再同期を実行してください。
        </GuideStep>
        <GuideStep icon="vpn_key" title="メンバーを招待">
          組織の管理者が設定画面から招待コードを発行し、参加者へ共有します。
        </GuideStep>
        <GuideNote icon="cloud_done">
          通常のデータはクラウドに保存され、同じ組織のメンバー間で共有されます。
        </GuideNote>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: 'help',
    title: 'よくある質問',
    summary: '困ったときの確認事項',
    content: (
      <div className="space-y-2">
        {[
          {
            q: 'スマートフォンでも使えますか？',
            a: 'はい。画面下のナビゲーションから主要画面と記録メニューを利用できます。',
          },
          {
            q: '登録したデータが表示されません。',
            a: '通信状態を確認し、画面上部の更新ボタンを押してください。改善しない場合は設定から再同期してください。',
          },
          {
            q: '売上の種類は変更できますか？',
            a: '「売上記録」画面で任意の種類を追加できます。色分けも自由に設定できます。',
          },
          {
            q: '複数人で同じデータを使えますか？',
            a: '組織の招待コードを使って参加すると、同じ組織内のデータを共有できます。',
          },
          {
            q: '誤って登録した記録は削除できますか？',
            a: '各記録の一覧または日別明細にある「削除」から確認後に削除できます。',
          },
        ].map(({ q, a }) => (
          <div key={q} className="rounded-xl bg-surface-container-low p-3.5">
            <p className="text-xs font-bold text-on-surface">Q. {q}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">A. {a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export function ManualModal({ onClose }: Props) {
  const [openSection, setOpenSection] = useState('start');
  const activeIndex = Math.max(0, SECTIONS.findIndex(section => section.id === openSection));
  const activeSection = SECTIONS[activeIndex];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="manual-title">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="操作ガイドを閉じる" />
      <div className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:max-h-[min(760px,calc(100vh-2rem))] sm:rounded-2xl">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="material-symbols-outlined flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary" style={{ fontSize: 22 }}>
              menu_book
            </span>
            <div className="min-w-0">
              <h1 id="manual-title" className="truncate font-headline text-base font-bold text-on-surface sm:text-lg">FleetMetric Pro 操作ガイド</h1>
              <p className="truncate text-xs text-on-surface-variant">車両管理から売上・ドライバー管理まで</p>
            </div>
          </div>
          <button onClick={onClose} className="ml-3 rounded-full p-2 text-on-surface-variant hover:bg-surface-container" aria-label="閉じる">
            <span className="material-symbols-outlined" style={{ fontSize: 21 }}>close</span>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex flex-shrink-0 gap-2 overflow-x-auto border-b border-outline-variant/20 bg-surface-container-lowest px-3 py-3 sm:w-56 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r sm:px-3">
            {SECTIONS.map(({ id, icon, title, summary }, index) => {
              const active = openSection === id;
              return (
                <button
                  key={id}
                  onClick={() => setOpenSection(id)}
                  className={`flex min-w-[148px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left sm:min-w-0 ${
                    active ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 19, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold">{index + 1}. {title}</span>
                    <span className={`hidden truncate text-[10px] sm:block ${active ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{summary}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-xl">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Guide {activeIndex + 1} / {SECTIONS.length}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{activeSection.icon}</span>
                  <h2 className="font-headline text-xl font-bold text-on-surface">{activeSection.title}</h2>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">{activeSection.summary}</p>
              </div>
              {activeSection.content}
            </div>
          </main>
        </div>

        <footer className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-3 sm:px-6">
          <div className="flex gap-1.5" aria-hidden="true">
            {SECTIONS.map((section, index) => (
              <span key={section.id} className={`h-1.5 rounded-full ${index === activeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant/60'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {activeIndex > 0 && (
              <button onClick={() => setOpenSection(SECTIONS[activeIndex - 1].id)} className="rounded-full px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container">
                前へ
              </button>
            )}
            {activeIndex < SECTIONS.length - 1 ? (
              <button onClick={() => setOpenSection(SECTIONS[activeIndex + 1].id)} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary">
                次へ
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </button>
            ) : (
              <button onClick={onClose} className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-on-primary">
                ガイドを閉じる
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
