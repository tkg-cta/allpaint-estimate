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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

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
