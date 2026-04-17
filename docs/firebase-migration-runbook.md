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

## 6. ユーザーワンクリック復旧（CLI不要）
- ログイン後、設定画面の「データ復旧（旧スプレッドシート）」に復旧元スプレッドシートIDを入力
- 先に「ドライラン実行」で件数を確認し、問題なければ「復旧を実行」
- 復旧処理は Cloud Functions `runLegacySpreadsheetRestore` が実行するため、端末でのCLI操作は不要
- 復旧元スプレッドシートは、Cloud Functions 実行サービスアカウントが参照できるように共有する
