# 全塗装お見積りシミュレーションサイト開発の相談

以下のプロジェクトについて相談したいです。
まず、このチャットのタイトルを「【高木】開発：全塗装お見積りシミュレーション」へ変更して

前提として、LINEの公式アカウントはまだ作成できていません。
また開発も初心者です。
全く初めてということを前提に以下のプロンプトを元に、優しく丁寧に手順を教えて。
情報は2025年のものを採用でお願い。

---

## プロジェクト概要

**プロジェクト名**: 全塗装シミュレーター（オールペイント見積もりシステム）

自動車の全塗装にかかる費用をWeb上で見積もりできるシミュレーションアプリケーション。
車両タイプ、塗装タイプ、オプションを選択することで、リアルタイムに概算見積もりを算出し、店舗への問い合わせまで一貫して行える。

---

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **メール送信**: Google Apps Script (GAS)
- **現在のホスティング**: GitHub Pages
- **予定している本番環境**: エックスサーバー

---

## 主な機能

### ステップウィザード形式の見積もりフロー
1. **Step 1**: 車両選択（軽自動車、コンパクトカー、セダン、SUV、ミニバン、ワンボックス）
2. **Step 2**: 塗装タイプ選択（ソリッド、メタリック、パール）
3. **Step 3**: オプション選択（下地処理、部品脱着、特殊塗装、コーティングなど）
4. **Step 4**: 見積もり確認
5. **Step 5**: お客様情報入力
6. **Step 6**: 最終確認・送信

### 価格計算の仕組み
- **車両タイプ × 塗装タイプのマトリクス価格**
  - 例: 軽自動車×ソリッド=¥100,000、軽自動車×メタリック=¥120,000
- **オプション価格（3パターン）**
  - 固定価格: ガラス脱着セット ¥50,000
  - サイズ別価格: 外廻り脱着セット（軽¥25,000/普通¥35,000/大型¥45,000）
  - 単価×個数: クリアー剥離 ¥10,000/パネル

### 問い合わせ機能
- Google Apps Script経由でメール自動送信
- 店舗向けに見積もり内容を通知

---

## ファイル構成

```
.
├── App.tsx                    # メインアプリケーション
├── components/                # Reactコンポーネント
│   ├── VehicleCard.tsx       # 車両選択カード
│   ├── PaintCard.tsx         # 塗装タイプ選択カード
│   ├── OptionCard.tsx        # オプション選択カード
│   └── StepWizard.tsx        # ステップウィザード
├── constants.ts              # 価格・オプション定義（ここで価格管理）
├── types.ts                  # TypeScript型定義
├── gas-script.js             # Google Apps Scriptコード
├── vite.config.ts            # Vite設定
├── .env.local                # 環境変数（ローカル）
├── .env.production           # 環境変数（本番）
├── SPECIFICATION.md          # 詳細仕様書
├── DEPLOY_GUIDE.md           # GitHub Pagesデプロイガイド
├── XSERVER_DEPLOY_GUIDE.md   # エックスサーバーデプロイガイド
└── GAS_SETUP_GUIDE.md        # GAS設定ガイド
```

---

## 現在の状況

### ✅ 完了していること
- 基本的な見積もりシミュレーション機能
- ステップウィザード形式のUI
- 車両タイプ×塗装タイプのマトリクス価格計算
- オプション選択機能（固定価格/サイズ別/個数指定）
- Google Apps Script経由のメール送信機能
- GitHub Pagesへのデプロイ（開発環境として稼働中）

### 🔄 これから実装したいこと
**LINE通知機能の追加**
- 見積もり結果をLINEで直接通知する機能
- **LINE Messaging API**を使った実装（長期運用を考慮）
  - ⚠️ LINE Notifyは2025年3月31日でサービス終了予定
  - 本番運用を見据えてLINE Messaging APIで実装
- ローカル環境でテストしてから本番環境へ展開予定

### 📋 今後の予定
1. LINE通知機能の実装・テスト（最優先）
2. フロントエンドのデザイン修正
3. エックスサーバーへの本番デプロイ

---

## デプロイ環境

### GitHub Pages（現在稼働中）
- URL: `https://[username].github.io/allpaint-estimate/`
- 用途: 開発・テスト環境
- デプロイ: Git push時に自動更新

### エックスサーバー（予定）
- 設置場所: `public_html/estimate/`
- アクセスURL: `https://[domain]/estimate/`
- 用途: 本番環境
- デプロイ方法: FTPまたはファイルマネージャーで手動アップロード
- 注意: `vite.config.ts` の `base` 設定を `/estimate/` に変更する必要あり

---

## 相談したいこと

**LINE Messaging APIを使った通知機能の実装について**

現在、Google Apps Script経由でメール送信ができています。
これに加えて、見積もり結果をLINEで直接通知する機能を追加したいです。

### 背景
- LINE Notifyは2025年3月31日でサービス終了予定
- 長期運用を考慮して、**LINE Messaging API**での実装が必要

### 要件
- 見積もりフォーム送信時に、店舗のLINE公式アカウントへ通知
- 通知内容: お客様情報 + 選択した車両・塗装・オプション + 合計金額
- Google Apps ScriptからLINE Messaging APIを呼び出す形で実装

### 質問
1. **LINE Messaging APIの初期設定**
   - LINE Developersコンソールでの設定手順
   - 必要なチャネルの種類（Messaging API）
   - Channel Access Tokenの取得方法

2. **Google Apps Scriptからの実装方法**
   - LINE Messaging APIへのPOSTリクエストの書き方
   - メッセージフォーマット（Flex Messageなど）の推奨方法
   - 見積もり内容を見やすく整形する方法

3. **セキュリティ面**
   - Channel Access Tokenの安全な管理方法
   - GASのスクリプトプロパティでの保存方法
   - Webhookの設定は必要か？（今回は通知のみ）

4. **テスト方法**
   - ローカル環境からGASを経由してLINEに通知するテスト手順
   - エラーハンドリングの実装方法

5. **メール送信との併用**
   - 現在のメール送信機能を残しつつ、LINE通知も追加したい
   - 両方の処理を並行して実行する実装方法

### 現在のGASスクリプト
`gas-script.js` ファイルに、メール送信処理が実装されています。
このスクリプトにLINE Messaging API呼び出し処理を追加したいです。

### 理想的な実装イメージ
```javascript
// GASスクリプト内のイメージ
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // 1. メール送信（既存機能）
  sendEmail(data);
  
  // 2. LINE通知（新規追加）
  sendLineNotification(data);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }));
}

function sendLineNotification(data) {
  // LINE Messaging APIを使った通知処理
  // - Channel Access Tokenの取得
  // - メッセージの整形
  // - APIへのPOSTリクエスト
}
```

### 期待する通知内容のイメージ
```
📝 新しい見積もり依頼

👤 お客様情報
名前: 山田太郎 様
電話: 090-1234-5678
メール: example@example.com

🚗 見積もり内容
車両: 軽自動車
塗装: メタリック
オプション:
 - クリアー剥離 (2パネル)
 - 外廻り脱着セット

💰 合計金額: ¥145,000

📅 来店希望日: 2025年12月10日 14:00
```

---

## 参考情報

- 価格設定は `constants.ts` で一元管理
- GASのWebアプリURLは環境変数 `VITE_GAS_WEBHOOK_URL` で管理
- フロントエンドからGASへはPOSTリクエストでJSON送信

以上の情報をもとに、LINE通知機能の実装についてアドバイスをお願いします。
