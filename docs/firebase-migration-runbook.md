# Firebase一括移行ランブック

## 1. 事前準備
- Firebaseプロジェクトを作成し、Firestore / Auth / Functions / Hosting を有効化
- ルートの `.firebaserc` の `default` を実プロジェクトIDに変更
- Webアプリの `.env` に `VITE_FIREBASE_*` を設定
- Cloud Functions 用に `functions/` で依存をインストール済みであることを確認

## 2. Firestoreスキーマ
- `vehicles`
- `maintenanceRecords`
- `fuelRecords`
- `accidentRecords`
- `drivers`
- `operationRecords`
- `users/{uid}/settings/app`（任意設定）

## 3. 旧Spreadsheetデータ移行
1. サービスアカウントキー(JSON)を用意
2. 移行元スプレッドシートをサービスアカウントに共有
3. ドライランで確認

```bash
DRY_RUN=true \
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json \
SPREADSHEET_ID=<sheet-id> \
FIREBASE_PROJECT_ID=<project-id> \
npm run migrate:spreadsheet
```

4. 本実行

```bash
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json \
SPREADSHEET_ID=<sheet-id> \
FIREBASE_PROJECT_ID=<project-id> \
npm run migrate:spreadsheet
```

## 4. デプロイ
```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use --add <project-id>
npm run build
npm run firebase:deploy:functions
npm run firebase:deploy:hosting
```

## 5. カットオーバー確認
- ログイン直後にセットアップ画面が出ないこと
- 車両/整備/給油/事故/ドライバー/運行記録のCRUDが動作すること
- ダッシュボードとレポートの集計が表示されること

## 6. 管理者ワンクリック復旧（推奨）
- Vercel環境変数 `VITE_ADMIN_EMAILS` に管理者メールアドレスをカンマ区切りで設定
  - 例: `admin@example.com,ops@example.com`
- 管理者でログインすると、設定画面に「管理者メンテナンス」セクションが表示される
- 「復旧元スプレッドシートID」を入力して、
  - 先に「ドライラン実行」
  - 問題なければ「復旧を実行」
- 復旧処理は Cloud Functions `runLegacySpreadsheetRestore` が実行するため、エンドユーザーのCLI操作は不要
