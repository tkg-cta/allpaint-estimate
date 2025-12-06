# 全塗装シミュレーター

車両の全塗装見積もりシミュレーションアプリケーション

## File Structure

```
.
├── App.tsx
├── DEPLOY_GUIDE.md
├── GAS_SETUP_GUIDE.md
├── QUICKSTART.md
├── README.md
├── components
│   ├── OptionCard.tsx
│   ├── PaintCard.tsx
│   ├── StepWizard.tsx
│   └── VehicleCard.tsx
├── constants.ts
├── gas-script.js
├── index.html
├── index.tsx
├── package.json
├── tsconfig.json
├── types.ts
├── vite-env.d.ts
└── vite.config.ts
```

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables in `.env.local`:
   ```bash
   VITE_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Run the app:
   `npm run dev`

## LINE通知機能

お問い合わせフォーム送信時に、管理者のLINEへリアルタイムで通知を送信する機能が実装されています。

### 機能概要

- フォーム送信時に、メール送信・スプレッドシート記録に加えて、指定のLINEアカウントへプッシュ通知を送信
- 通知内容: お名前、車両、塗装タイプ、合計金額、希望来店日時(第1希望)

### セットアップ手順

#### 1. LINE Developersでの設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 新しいプロバイダーを作成(または既存のプロバイダーを選択)
3. 「Messaging API」チャネルを作成
4. チャネル設定から以下を取得:
   - **チャネルアクセストークン(長期)**: チャネル基本設定 → Messaging API設定 → チャネルアクセストークン(長期)を発行
   - **ユーザーID**: LINEアプリでボットを友だち追加し、Webhook経由で取得するか、LINE Official Account Managerから確認

#### 2. Google Apps Scriptでの設定

1. [Google Apps Script](https://script.google.com/) にアクセス
2. `gas-script.js` の内容をコピーして貼り付け
3. **スクリプトプロパティの設定**:
   - プロジェクト設定(⚙️アイコン) → 「スクリプトプロパティ」タブ
   - 以下の2つのプロパティを追加:
     - `LINE_ACCESS_TOKEN`: LINEチャネルアクセストークン
     - `LINE_USER_ID`: 通知先のLINEユーザーID
4. デプロイ → 新しいデプロイ → ウェブアプリとして公開
5. 生成されたURLを `.env.local` の `VITE_GAS_WEBHOOK_URL` に設定

#### 3. 動作確認

1. フォームからテスト送信を実行
2. 以下が正常に動作することを確認:
   - メール送信
   - スプレッドシートへの記録
   - LINE通知の受信

**注意:** LINE通知の送信に失敗しても、メール送信とスプレッドシート記録は正常に完了します。

## 価格・オプションの変更方法

車両の基本料金、塗装タイプの追加料金、オプションの価格は、すべて `constants.ts` ファイルで管理されています。

### 車両の基本料金を変更する

`constants.ts` の `VEHICLES` 配列内で、該当する車両の `basePrice` を変更してください。

```typescript
// constants.ts
export const VEHICLES: VehicleType[] = [
  {
    id: 'kei',
    name: '軽自動車',
    category: VehicleSize.LIGHT,
    image: '...', 
    basePrice: 150000, // ← ここを変更
  },
  // ...
];
```

### 塗装タイプの追加料金を変更する

`constants.ts` の `PAINTS` 配列内で、該当する塗装タイプの `surcharge` を変更してください。

```typescript
// constants.ts
export const PAINTS: PaintType[] = [
  {
    id: 'metallic',
    name: 'メタリック',
    description: '金属片を含んだ塗料で、キラキラとした輝きを放ちます。',
    image: '...',
    surcharge: 30000, // ← ここを変更
  },
  // ...
];
```

### オプションの価格を変更する

`constants.ts` の `OPTIONS` 配列内で、該当するオプションの `price` を変更してください。

**固定価格の場合:**
```typescript
{
  id: 'clear_peel',
  name: 'クリアー剥離',
  // ...
  price: 10000, // ← ここを変更
}
```

**車両サイズによって価格が変わる場合:**
```typescript
{
  id: 'parts_removal_set',
  name: '外廻り 脱着セット',
  // ...
  price: {
    [VehicleSize.LIGHT]: 25000,    // 軽自動車
    [VehicleSize.REGULAR]: 35000,  // 普通車
    [VehicleSize.LARGE]: 45000,    // 大型車
  },
}
```

### オプションの追加・削除

`constants.ts` の `OPTIONS` 配列に新しいオブジェクトを追加、または既存のオブジェクトを削除することで、オプションの追加・削除ができます。

**注意:** ファイルを編集した後は、開発サーバーを再起動するか、ブラウザをリロードして変更を反映してください。
