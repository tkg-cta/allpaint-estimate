# LINE通知機能・GAS実装 技術ドキュメント
2025/12/06作成

このドキュメントは、お問い合わせフォームへのLINE通知機能追加およびGASスクリプトの改修に関する技術的な詳細をまとめたものです。次回同様の実装を行う際や、トラブルシューティングの参考にしてください。

## 1. システム構成概要

```mermaid
graph TD
    User[ユーザー] -->|フォーム送信| Frontend[React/Vite Frontend]
    Frontend -->|POST Request (JSON)| GAS[Google Apps Script (Web App)]
    
    subgraph "Google Apps Script (Backend)"
        GAS -->|1. 記録| Spreadsheet[Google Spreadsheet]
        GAS -->|2. 送信| Gmail[Gmail API]
        GAS -->|3. 通知| LINE[LINE Messaging API]
    end
    
    Gmail -->|メール配送| Admin[管理者 (メール)]
    LINE -->|Push通知| AdminLINE[管理者 (LINE)]
```

## 2. 技術的実装詳細

### 2.1 Google Apps Script (Backend)

**ファイル**: `gas-script.js`

#### `doPost(e)` - エントリーポイント
*   **独立したエラーハンドリング**: スプレッドシート記録、メール送信、LINE通知の各処理を個別の `try-catch` ブロックで囲む設計を採用。
    *   *メリット*: メール送信でエラーが発生しても、LINE通知やスプレッドシート記録は継続して実行される（部分的な成功を許容）。
*   **レスポンス**: フロントエンドの `no-cors` 制約に対応するため、常にステータス200を返しつつ、内部の実行結果（`results`オブジェクト）をログに残す設計。

#### LINE通知機能 (`sendLineNotification`)
*   **API**: LINE Messaging API の `push` エンドポイント (`https://api.line.me/v2/bot/message/push`) を使用。
*   **認証**: `ScriptProperties` (スクリプトプロパティ) に保存された `LINE_ACCESS_TOKEN` を使用して Bearer 認証を行う。
*   **宛先**: `LINE_USER_ID` で指定された特定のユーザー（管理者）にプッシュ通知を送る。

#### メール送信機能 (`createEmailBody`)
*   **動的件名**: `GmailApp.sendEmail` の件名引数にテンプレートリテラルを使用し、`【全塗装見積もり】${customer.name}様...` のように顧客名を埋め込み。
*   **データ構造への対応**: フロントエンドのデータ構造（マトリクス価格モデル）に合わせて、存在しないプロパティ（`basePrice`, `surcharge`）への参照を排除し、`totalPrice` を中心とした表示に変更。

### 2.2 Frontend (React)

**ファイル**: `App.tsx`

*   **環境変数**: `import.meta.env.VITE_GAS_WEBHOOK_URL` を使用してGASのデプロイURLを管理。
*   **送信処理**: `fetch` API を使用し、`mode: 'no-cors'` でPOSTリクエストを送信。
    *   *注意点*: `no-cors` モードではレスポンスの中身（成功/失敗の詳細）をJavaScript側で読み取れないため、送信完了＝成功とみなして画面遷移を行う仕様。

## 3. トラブルシューティングと解決策

今回の実装中に発生した主な問題とその技術的な解決策です。

### ケース1: メールが届かない（GASエラー）
*   **現象**: テスト送信は成功するが、本番データでの送信時にメール処理だけが失敗する。
*   **原因**: **データ構造の不整合**。
    *   以前のコード: `quote.vehicle.basePrice.toLocaleString()` を実行。
    *   現在のデータ: `quote.vehicle` オブジェクト内に `basePrice` プロパティが存在しない（`undefined`）。
    *   結果: `undefined` に対して `toLocaleString()` を呼び出そうとして例外が発生。
*   **解決策**: `createEmailBody` 関数を修正し、`basePrice` や `surcharge` などの未定義プロパティへの参照を削除。合計金額（`totalPrice`）のみを表示するように変更。

### ケース2: GASの権限エラー
*   **現象**: 初回デプロイ後、スクリプトが動作しない（ログに `Exception: The script does not have permission` 等）。
*   **原因**: `doPost` は外部からのアクセスで実行されるため、初回実行時の認証フロー（ポップアップでの許可）がトリガーされない。
*   **解決策**: エディタ上で手動実行するためのテスト関数 `testEmailSend()` を一時的に作成。これをエディタから実行することで、必要なスコープ（Gmail, UrlFetchApp, Spreadsheet）へのアクセス権限承認画面を強制的に表示させ、許可を取得した。

## 4. 再現・デプロイ手順

次回、同様の環境を構築または更新するための手順です。

### 4.1 LINE Developers設定
1.  **プロバイダー作成**: LINE Developersコンソールでプロバイダーを作成。
2.  **チャネル作成**: "Messaging API" チャネルを作成。
3.  **アクセストークン発行**: 「Messaging API設定」タブでチャネルアクセストークン（長期）を発行。
4.  **ユーザーID取得**: 同タブの下部にある「あなたのユーザーID」をコピー。

### 4.2 GAS設定
1.  **スクリプトプロパティ**: GASエディタの「プロジェクト設定」→「スクリプトプロパティ」に以下を追加。
    *   `LINE_ACCESS_TOKEN`: (上記で発行したトークン)
    *   `LINE_USER_ID`: (上記で取得したID)
2.  **コード反映**: `gas-script.js` の内容を `コード.gs` に貼り付け。
3.  **デプロイ**:
    *   「デプロイ」→「新しいデプロイ」
    *   種類: ウェブアプリ
    *   次のユーザーとして実行: **自分**
    *   アクセスできるユーザー: **全員**

### 4.3 更新時の注意（重要）
コードを修正した場合、単に保存するだけではウェブアプリに反映されません。
必ず **「デプロイ」→「デプロイを管理」→「鉛筆アイコン」→ バージョン「新バージョン」** を選択して更新してください。URLを変更せずにコードのみ更新できます。
