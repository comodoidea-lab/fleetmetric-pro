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

function Step({ n, children, sub }: { n: string; children: React.ReactNode; sub?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${sub ? 'bg-surface-container-low/60' : 'bg-surface-container-low'}`}>
      <span className={`text-xs font-label font-bold flex-shrink-0 px-2 py-0.5 rounded ${sub ? 'bg-surface-container text-on-surface-variant' : 'bg-primary-fixed text-primary'}`}>{n}</span>
      <p className="text-sm font-label text-on-surface leading-relaxed">{children}</p>
    </div>
  );
}

function Note({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warn' | 'tip' }) {
  const styles = {
    info: 'bg-primary-fixed/20 text-primary border-primary/20',
    warn: 'bg-error-container/20 text-error border-error/20',
    tip:  'bg-tertiary-fixed/20 text-on-tertiary-fixed border-tertiary/20',
  };
  const icons = { info: 'info', warn: 'warning', tip: 'lightbulb' };
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${styles[type]}`}>
      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>{icons[type]}</span>
      <p className="text-xs font-label leading-relaxed">{children}</p>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-headline font-bold text-on-surface mt-4 mb-2 first:mt-0">{children}</h3>;
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    icon: 'info',
    title: 'FleetMetric Pro とは',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface leading-relaxed">
          FleetMetric Pro は、営業車・社用車の管理をシンプルにするシステムです。
          車両情報・メンテナンス記録・給油履歴・事故修理履歴を一元管理します。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: 'storage', label: 'データ保存先', desc: 'あなたのGoogleスプレッドシート' },
            { icon: 'lock', label: 'セキュリティ', desc: 'Googleアカウントで認証' },
            { icon: 'devices', label: '複数端末対応', desc: '同じアカウントで自動同期' },
            { icon: 'cloud_off', label: '外部送信なし', desc: '第三者サーバーへの送信なし' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2 p-3 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <p className="text-xs font-label font-bold text-on-surface">{label}</p>
                <p className="text-xs font-label text-on-surface-variant">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'spreadsheet',
    icon: 'table_chart',
    title: 'スプレッドシートの準備',
    content: (
      <div className="space-y-2">
        <Note type="info">このアプリのデータはすべてあなた自身のGoogleスプレッドシートに保存されます。まずスプレッドシートを作成してください。</Note>
        <Heading>スプレッドシートを作成する</Heading>
        <div className="space-y-1.5">
          <Step n="01">
            <span>
              <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-primary underline">sheets.new</a>
              {' '}をブラウザで開いて、新しいGoogleスプレッドシートを作成する
            </span>
          </Step>
          <Step n="02">左上の「無題のスプレッドシート」をクリックして、わかりやすい名前に変更する（例：「営業車管理データ」）</Step>
        </div>
        <Heading>Apps Scriptを開く</Heading>
        <div className="space-y-1.5">
          <Step n="03">スプレッドシートのメニューから「拡張機能」→「Apps Script」をクリック</Step>
          <Step n="04">Apps Scriptエディタが別タブで開く。左上の「無題のプロジェクト」をクリックして名前を変更する（例：「FleetMetric Pro」）</Step>
        </div>
        <Note type="tip">スプレッドシートとGASプロジェクトに名前をつけておくと、後から見つけやすくなります。</Note>
      </div>
    ),
  },
  {
    id: 'gas',
    icon: 'code',
    title: 'GASスクリプトの設置',
    content: (
      <div className="space-y-2">
        <Note type="info">Apps Scriptエディタにプログラムコードを貼り付けます。コードはFleetMetric Proのセットアップ画面からコピーできます。</Note>
        <div className="space-y-1.5">
          <Step n="01">Apps Scriptエディタの左側にある「Code.gs」を選択する（デフォルトで選択されているはず）</Step>
          <Step n="02">エディタ内のコード（function myFunction() &#123;&#125; など）を全て選択して削除する（Ctrl+A → Delete）</Step>
          <Step n="03">FleetMetric Proのセットアップ画面（STEP 1）の「コードをコピー」ボタンを押す</Step>
          <Step n="04">Apps Scriptエディタに貼り付ける（Ctrl+V）</Step>
          <Step n="05">保存する（Ctrl+S または Cmd+S）。フロッピーディスクのアイコンをクリックしてもOK</Step>
        </div>
        <Note type="tip">コードが正しく貼り付けられると、エディタ内に日本語のコメントが大量に表示されます。</Note>
      </div>
    ),
  },
  {
    id: 'deploy',
    icon: 'rocket_launch',
    title: 'GASのデプロイ（公開設定）',
    content: (
      <div className="space-y-2">
        <Note type="info">スクリプトをウェブアプリとして公開し、FleetMetric Proから接続できるようにします。</Note>
        <Heading>新しいデプロイを作成する</Heading>
        <div className="space-y-1.5">
          <Step n="01">Apps Scriptエディタの右上にある「デプロイ」ボタンをクリック →「新しいデプロイ」を選択</Step>
          <Step n="02">左側の歯車（⚙）アイコンをクリック →「ウェブアプリ」を選択</Step>
          <Step n="03">「次のユーザーとして実行」は「自分（＊＊＊@gmail.com）」のまま変更しない</Step>
          <Step n="04">「アクセスできるユーザー」のドロップダウンを「<strong>全員（匿名ユーザーを含む）</strong>」に変更する</Step>
          <Step n="05">「デプロイ」ボタンをクリック</Step>
        </div>
        <Heading>アクセスを承認する</Heading>
        <div className="space-y-1.5">
          <Step n="06">「アクセスを承認」ボタンをクリック</Step>
          <Step n="07">Googleアカウントの選択画面が表示されるので、スプレッドシートのオーナーアカウントを選ぶ</Step>
          <Step n="08">「このアプリはGoogleで確認されていません」という画面が表示されたら「詳細」をクリック</Step>
          <Step n="09">「（安全ではないページ）に移動」をクリック</Step>
          <Step n="10">「許可」をクリックして権限を付与する</Step>
        </div>
        <Note type="warn">「確認されていません」の警告は、自分で作成したスクリプトをGoogleに審査申請していないためです。自分で作成・管理するスクリプトなので安心して許可してください。</Note>
        <Heading>ウェブアプリURLをコピーする</Heading>
        <div className="space-y-1.5">
          <Step n="11">「デプロイを更新しました」画面に表示される「ウェブアプリURL」をコピーする</Step>
          <Step n="12">URLは「https://script.google.com/macros/s/...」で始まる長いURLです</Step>
        </div>
        <Note type="tip">URLはどこかに控えておくと安心ですが、FleetMetric ProのGoogleアカウントに保存されるので紛失しても設定画面から確認できます。</Note>
      </div>
    ),
  },
  {
    id: 'setup',
    icon: 'link',
    title: 'FleetMetric Proへの接続',
    content: (
      <div className="space-y-2">
        <div className="space-y-1.5">
          <Step n="01">FleetMetric Proのセットアップ画面（STEP 3）に戻る</Step>
          <Step n="02">「GAS ウェブアプリ URL」の入力欄にコピーしたURLを貼り付ける</Step>
          <Step n="03">「アクセス許可する Google ドメイン」は任意入力。社内メールアドレスのドメインを入れると、そのドメイン以外のGoogleアカウントのログインを拒否できる（例: company.co.jp）</Step>
          <Step n="04">「接続テスト」ボタンをクリックする</Step>
          <Step n="05">「接続成功！スプレッドシートを初期化しました」と表示されたらセットアップ完了</Step>
        </div>
        <Note type="info">初回接続時にスプレッドシートへ「車両マスタ」「メンテナンス記録」「給油記録」「事故・修理履歴」の4つのシートが自動作成されます。</Note>
        <Heading>2台目以降の端末でログインする場合</Heading>
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          同じGoogleアカウントでログインするだけで、GAS URLの再入力は不要です。自動的に前回の設定が引き継がれてダッシュボードが表示されます。
        </p>
      </div>
    ),
  },
  {
    id: 'dashboard',
    icon: 'dashboard',
    title: 'ダッシュボードの使い方',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          ダッシュボードはアプリ起動時の最初の画面です。車両の状況をひと目で確認できます。
        </p>
        <div className="space-y-2">
          {[
            { icon: 'directions_car', label: '稼働車両数', desc: '現在「稼働中」ステータスの車両台数と総台数' },
            { icon: 'build', label: 'メンテナンス件数', desc: '登録されているメンテナンス記録の総件数' },
            { icon: 'local_gas_station', label: '今月の燃料費', desc: '今月の給油記録の合計金額' },
            { icon: 'warning', label: '期限アラート', desc: '車検・法定点検の期限が30日以内または切れている車両の警告' },
            { icon: 'history', label: '最近のメンテナンス', desc: '直近5件のメンテナンス記録' },
            { icon: 'bar_chart', label: 'フリート稼働状況', desc: '稼働中・点検中などのステータス別内訳' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2 p-3 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              <div>
                <p className="text-xs font-label font-bold text-on-surface">{label}</p>
                <p className="text-xs font-label text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'vehicles',
    icon: 'directions_car',
    title: '車両一覧の使い方',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          管理する車両を登録・編集・削除できます。
        </p>
        <Heading>車両を登録する</Heading>
        <div className="space-y-1.5">
          <Step n="01">右下または右上の「＋ 車両を追加」ボタンをタップ</Step>
          <Step n="02">車両名・ナンバー・メーカー・車種・年式を入力</Step>
          <Step n="03">車検期限・法定点検期限を入力（アラート通知に使用）</Step>
          <Step n="04">ステータスを選択（稼働中・点検中・修理中・廃車予定）</Step>
          <Step n="05">「保存」ボタンをタップ</Step>
        </div>
        <Heading>車両の詳細を見る</Heading>
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          車両一覧のカードをタップすると、その車両のメンテナンス履歴・給油履歴・事故修理履歴が一覧表示されます。
        </p>
        <Note type="tip">車検期限を登録しておくと、30日前からダッシュボードにアラートが表示されます。</Note>
      </div>
    ),
  },
  {
    id: 'maintenance',
    icon: 'build',
    title: 'メンテナンス記録の使い方',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          オイル交換・タイヤ交換・定期点検などのメンテナンス履歴を記録します。
        </p>
        <Heading>記録を追加する</Heading>
        <div className="space-y-1.5">
          <Step n="01">「＋ メンテナンスを記録」ボタンをタップ</Step>
          <Step n="02">対象の車両を選択</Step>
          <Step n="03">日付・走行距離・作業内容・費用を入力</Step>
          <Step n="04">業者名・次回予定日を入力（任意）</Step>
          <Step n="05">「保存」ボタンをタップ</Step>
        </div>
        <Note type="tip">走行距離を継続して記録することで、レポート画面で走行距離の推移が確認できます。</Note>
      </div>
    ),
  },
  {
    id: 'fuel',
    icon: 'local_gas_station',
    title: '給油記録の使い方',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          給油のたびに記録することで、月別燃料費の集計やレポートに活用できます。
        </p>
        <Heading>記録を追加する</Heading>
        <div className="space-y-1.5">
          <Step n="01">「＋ 給油を記録」ボタンをタップ</Step>
          <Step n="02">対象の車両を選択</Step>
          <Step n="03">日付・走行距離・給油量・単価を入力（費用は自動計算されます）</Step>
          <Step n="04">ガソリンスタンド名を入力（任意）</Step>
          <Step n="05">「保存」ボタンをタップ</Step>
        </div>
        <Note type="tip">給油量と単価を入力すると費用が自動計算されます。費用を直接入力することもできます。</Note>
      </div>
    ),
  },
  {
    id: 'accidents',
    icon: 'car_crash',
    title: '事故・修理履歴の使い方',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          事故・修理の履歴を記録します。保険対応や修理費の管理に役立ちます。
        </p>
        <Heading>記録を追加する</Heading>
        <div className="space-y-1.5">
          <Step n="01">「＋ 事故・修理を記録」ボタンをタップ</Step>
          <Step n="02">対象の車両を選択</Step>
          <Step n="03">発生日・内容・損傷箇所・費用を入力</Step>
          <Step n="04">修理業者・完了日を入力（任意）</Step>
          <Step n="05">「保存」ボタンをタップ</Step>
        </div>
      </div>
    ),
  },
  {
    id: 'reports',
    icon: 'bar_chart',
    title: 'レポートの使い方',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          月別の燃料費推移・車両別コスト比較などのグラフが確認できます。
        </p>
        <div className="space-y-2">
          {[
            { label: '月別燃料費', desc: '過去6ヶ月の月別給油費用の棒グラフ' },
            { label: '車両別メンテナンスコスト', desc: '車両ごとのメンテナンス費用の合計' },
            { label: '車両別燃料コスト', desc: '車両ごとの給油費用の合計' },
            { label: '総コスト集計', desc: '燃料費・メンテナンス費・事故修理費の合計' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-2 p-3 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-tertiary flex-shrink-0" style={{ fontSize: 16 }}>analytics</span>
              <div>
                <p className="text-xs font-label font-bold text-on-surface">{label}</p>
                <p className="text-xs font-label text-on-surface-variant">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: 'settings',
    title: '設定・よくある質問',
    content: (
      <div className="space-y-4">
        <Heading>設定メニューについて</Heading>
        <p className="text-sm font-label text-on-surface-variant leading-relaxed">
          右上の歯車（⚙）アイコンから設定メニューを開けます。
        </p>
        <div className="space-y-2">
          {[
            { label: 'スプレッドシートを初期化', desc: 'シートのヘッダーを再作成します。データは削除されません。' },
            { label: 'データを再同期', desc: 'スプレッドシートから最新データを取得します。' },
            { label: 'セットアップをやり直す', desc: 'GAS URLをリセットして初回セットアップ画面に戻ります。' },
            { label: 'ログアウト', desc: 'Googleアカウントからログアウトします。データは保持されます。' },
          ].map(({ label, desc }) => (
            <div key={label} className="p-3 bg-surface-container-low rounded-xl">
              <p className="text-xs font-label font-bold text-on-surface">{label}</p>
              <p className="text-xs font-label text-on-surface-variant mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <Heading>よくある質問</Heading>
        <div className="space-y-2">
          {[
            {
              q: 'スマートフォンで使えますか？',
              a: 'はい。スマートフォン・タブレット・PCのすべてのブラウザに対応しています。',
            },
            {
              q: 'データが表示されません',
              a: '右上のリフレッシュ（↻）ボタンを押してください。それでも表示されない場合は設定メニューの「データを再同期」をお試しください。',
            },
            {
              q: '別の端末からログインしたらGAS URLの再入力が必要ですか？',
              a: 'いいえ。同じGoogleアカウントでログインすれば自動的に引き継がれます。',
            },
            {
              q: 'スプレッドシートのデータを直接編集できますか？',
              a: 'はい。GoogleスプレッドシートとFleetMetric Proは同じデータを参照しています。スプレッドシートを直接編集した場合は「データを再同期」でアプリに反映されます。',
            },
          ].map(({ q, a }) => (
            <div key={q} className="p-3 bg-surface-container-low rounded-xl">
              <p className="text-xs font-label font-bold text-on-surface">Q. {q}</p>
              <p className="text-xs font-label text-on-surface-variant mt-1 leading-relaxed">A. {a}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function ManualModal({ onClose }: Props) {
  const [openSection, setOpenSection] = useState<string>('overview');

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 my-4 bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            <div>
              <p className="font-headline font-bold text-on-surface text-base">FleetMetric Pro マニュアル</p>
              <p className="text-xs font-label text-on-surface-variant">セットアップ手順・操作説明</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Section list (left sidebar on desktop, top tabs on mobile) */}
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

          {/* Mobile: accordion */}
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
                {openSection === id && (
                  <div className="px-4 pb-4 space-y-2">{content}</div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: section content */}
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant/20 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs font-label text-on-surface-variant">FleetMetric Pro — セットアップ・操作マニュアル</p>
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
