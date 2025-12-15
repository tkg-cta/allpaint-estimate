作成日: 2025-12-05

# エックスサーバーへのデプロイガイド 🚀

このガイドでは、全塗装シミュレーターをエックスサーバーに公開する手順を説明します。

---

## 📋 事前準備

### 必要なもの
- エックスサーバーのアカウント
- FTPソフト（FileZilla推奨）または エックスサーバーのファイルマネージャー
- Google Apps ScriptのWebアプリURL（GAS_SETUP_GUIDE.mdを参照）
- 約30分の作業時間

---

## ステップ1: 本番用ビルドの作成

### 1-1. 環境変数の設定

プロジェクトのルートディレクトリに `.env.production` ファイルを作成します。

```bash
# .env.production
VITE_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

⚠️ **重要**: `YOUR_SCRIPT_ID` を実際のGoogle Apps ScriptのWebアプリURLに置き換えてください。

### 1-2. ビルドの実行

ターミナルでプロジェクトディレクトリに移動し、以下のコマンドを実行します:

```bash
cd /Users/webjigyoubutkg/Documents/CODE/allpaint-estimate

# 本番用ビルドを実行
npm run build
```

ビルドが成功すると、`dist` フォルダに本番用ファイルが生成されます。

### 1-3. ビルド内容の確認

`dist` フォルダ内に以下のようなファイルが生成されていることを確認してください:
- `index.html`
- `assets/` フォルダ（CSS、JavaScript、画像など）

---

## ステップ2: エックスサーバーへのアップロード

### 方法A: ファイルマネージャーを使う（初心者向け）

#### 2A-1. サーバーパネルにログイン
1. エックスサーバーのサーバーパネルにログイン
   - https://www.xserver.ne.jp/login_server.php

#### 2A-2. ファイルマネージャーを開く
1. 「ファイル管理」→「ファイルマネージャ」をクリック
2. 対象のドメインフォルダを選択
3. `public_html` フォルダを開く

#### 2A-3. アップロード先の決定

**パターン1: ドメイン直下に設置する場合**
- アップロード先: `public_html/`
- アクセスURL: `https://yourdomain.com/`

**パターン2: サブディレクトリに設置する場合**
- アップロード先: `public_html/estimate/`（フォルダを新規作成）
- アクセスURL: `https://yourdomain.com/estimate/`

#### 2A-4. ファイルのアップロード
1. アップロード先フォルダを開く
2. 「ファイルを選択」をクリック
3. ローカルの `dist` フォルダ内の**全ファイル**を選択
   - `index.html`
   - `assets` フォルダ
   - その他すべてのファイル
4. 「アップロード」をクリック

⚠️ **注意**: `dist` フォルダ自体ではなく、`dist` フォルダ**内**のファイルをアップロードしてください。

---

### 方法B: FTPソフトを使う（推奨）

#### 2B-1. FTPソフトのインストール

**FileZilla（無料）を推奨**
- ダウンロード: https://filezilla-project.org/

#### 2B-2. FTP接続情報の確認

エックスサーバーのサーバーパネルで確認:
1. 「サブFTPアカウント設定」または「FTPアカウント設定」をクリック
2. 以下の情報をメモ:
   - **FTPホスト名**: `sv●●●●.xserver.jp`
   - **FTPユーザー名**: サーバーID
   - **FTPパスワード**: サーバーパスワード
   - **ポート**: `21`

#### 2B-3. FileZillaで接続

1. FileZillaを起動
2. 上部のクイック接続バーに入力:
   - **ホスト**: `sv●●●●.xserver.jp`
   - **ユーザー名**: FTPユーザー名
   - **パスワード**: FTPパスワード
   - **ポート**: `21`
3. 「クイック接続」をクリック

#### 2B-4. ファイルのアップロード

1. **左側（ローカル）**: `dist` フォルダを開く
2. **右側（リモート）**: アップロード先フォルダを開く
   - ドメイン直下の場合: `public_html/`
   - サブディレクトリの場合: `public_html/estimate/`
3. 左側の `dist` フォルダ内の**全ファイル**を選択
4. 右側にドラッグ&ドロップ

転送が完了するまで待ちます（数分程度）。

---

## ステップ3: 動作確認

### 3-1. ブラウザでアクセス

アップロード先に応じたURLにアクセスします:
- ドメイン直下: `https://yourdomain.com/`
- サブディレクトリ: `https://yourdomain.com/estimate/`

### 3-2. 動作テスト

1. ページが正しく表示されるか確認
2. 各ステップで選択ができるか確認
3. 見積もりフォームから送信テスト
4. メールが届くか確認

---

## 🔧 トラブルシューティング

### ページが表示されない

#### 原因1: ファイルのアップロード先が間違っている
- **確認**: `index.html` が正しい場所にあるか確認
- **解決**: `public_html/` 直下、または指定のサブディレクトリに `index.html` があることを確認

#### 原因2: ファイルのパーミッション（権限）が間違っている
- **確認**: ファイルマネージャーまたはFTPソフトで確認
- **解決**: 
  - フォルダ: `755`
  - ファイル: `644`

### スタイルが崩れる・画像が表示されない

#### 原因: ベースパスの設定が間違っている

**サブディレクトリに設置する場合**は、`vite.config.ts` を修正する必要があります。

```typescript
// vite.config.ts
export default defineConfig({
  base: '/estimate/', // サブディレクトリ名に合わせる
  // ...
});
```

修正後、再度ビルドしてアップロードしてください:
```bash
npm run build
```

### メール送信ができない

#### 原因1: 環境変数が設定されていない
- **確認**: `.env.production` ファイルが存在するか
- **解決**: ステップ1-1を参照して設定

#### 原因2: GAS URLが間違っている
- **確認**: ブラウザの開発者ツール（F12）でコンソールエラーを確認
- **解決**: `.env.production` のURLを確認し、再ビルド

#### 原因3: CORSエラー
- **確認**: ブラウザのコンソールに「CORS」エラーが表示される
- **解決**: Google Apps Scriptの設定を確認（GAS_SETUP_GUIDE.md参照）

### 403 Forbidden エラーが表示される

#### 原因: .htaccess の設定
- **確認**: `public_html/` に `.htaccess` ファイルがあるか
- **解決**: エックスサーバーのサポートに問い合わせ、または以下を `.htaccess` に追加:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 📝 更新方法

コードを修正した後、以下の手順で更新します:

1. **ローカルでビルド**
   ```bash
   npm run build
   ```

2. **distフォルダの内容をアップロード**
   - ファイルマネージャーまたはFTPソフトで上書きアップロード

3. **ブラウザのキャッシュをクリア**
   - `Ctrl + Shift + R`（Windows）
   - `Cmd + Shift + R`（Mac）

---

## 🌐 サブディレクトリ vs ドメイン直下

### ドメイン直下に設置（推奨）
- **メリット**: URLがシンプル、設定が簡単
- **デメリット**: 他のコンテンツと共存できない
- **URL例**: `https://yourdomain.com/`

### サブディレクトリに設置
- **メリット**: 他のコンテンツと共存可能
- **デメリット**: `vite.config.ts` の修正が必要
- **URL例**: `https://yourdomain.com/estimate/`

---

## ✅ デプロイチェックリスト

- [ ] `.env.production` にGAS URLを設定した
- [ ] `npm run build` でビルドが成功した
- [ ] `dist` フォルダが生成された
- [ ] エックスサーバーにFTP接続できた
- [ ] ファイルを正しい場所にアップロードした
- [ ] ブラウザでページが表示される
- [ ] スタイルが正しく適用されている
- [ ] フォームから送信テストが成功した
- [ ] メールが届いた

全てチェックできたら完了です！🎉

---

## 📚 参考リンク

- [エックスサーバー マニュアル](https://www.xserver.ne.jp/manual/)
- [FileZilla 公式サイト](https://filezilla-project.org/)
- [Vite デプロイガイド](https://ja.vitejs.dev/guide/static-deploy.html)

---

## 💡 GitHub Pages との違い

| 項目 | GitHub Pages | エックスサーバー |
|------|-------------|----------------|
| 費用 | 無料 | 有料（契約済み） |
| デプロイ | 自動（Git push） | 手動（FTP） |
| 独自ドメイン | 設定が必要 | 簡単 |
| SSL証明書 | 自動 | 自動（無料） |
| 更新頻度 | 頻繁な更新に向く | 安定版の公開に向く |

**推奨**: 開発中はGitHub Pages、本番環境はエックスサーバーという使い分けも可能です。
