# GitHub Pages デプロイ完全ガイド 🚀

このガイドでは、全塗装シミュレーターをGitHub Pagesに公開する手順を説明します。

---

## 📋 事前準備

### 必要なもの
- GitHubアカウント
- Google Apps ScriptのWebアプリURL（GAS_SETUP_GUIDE.mdを参照）
- 約20分の作業時間

---

## ステップ1: GitHubリポジトリの作成

### 1-1. GitHubにアクセス
1. https://github.com にアクセスしてログイン
2. 右上の「**+**」→「**New repository**」をクリック

### 1-2. リポジトリ設定
以下のように設定してください:

- **Repository name**: `allpaint-estimate`
- **Description**: `全塗装シミュレーター` (任意)
- **Public** を選択 ⚠️ GitHub Pages無料版はPublicのみ
- **Initialize this repository with:** は**全てチェックなし**
- 「**Create repository**」をクリック

### 1-3. リポジトリURLをメモ
作成後に表示されるURLをコピーしてください:
```
https://github.com/YOUR_USERNAME/allpaint-estimate.git
```
`YOUR_USERNAME` は自分のGitHubユーザー名です。

---

## ステップ2: ローカルプロジェクトをGitHubにアップロード

### 2-1. ターミナルを開く
VSCodeのターミナル、またはMacのターミナルアプリを開きます。

### 2-2. プロジェクトフォルダに移動
```bash
cd /Users/webjigyoubutkg/Documents/CODE/allpaint-estimate
```

### 2-3. Gitの初期化とコミット
以下のコマンドを**1行ずつ**実行してください:

```bash
# Gitリポジトリを初期化
git init

# 全ファイルをステージング
git add .

# 最初のコミット
git commit -m "Initial commit: 全塗装シミュレーター"

# GitHubリポジトリと接続（YOUR_USERNAMEを自分のユーザー名に変更！）
git remote add origin https://github.com/YOUR_USERNAME/allpaint-estimate.git

# mainブランチに変更
git branch -M main

# GitHubにpush
git push -u origin main
```

⚠️ **重要**: `YOUR_USERNAME` を自分のGitHubユーザー名に置き換えてください！

### 2-4. GitHubで確認
ブラウザでリポジトリページを開き、ファイルがアップロードされているか確認します。

---

## ステップ3: GitHub Secretsに環境変数を設定

Google Apps ScriptのURLを安全に保存します。

### 3-1. リポジトリの設定を開く
1. GitHubのリポジトリページで「**Settings**」タブをクリック
2. 左サイドバーの「**Secrets and variables**」→「**Actions**」をクリック

### 3-2. Secretを追加
1. 「**New repository secret**」をクリック
2. 以下を入力:
   - **Name**: `VITE_GAS_WEBHOOK_URL`
   - **Secret**: Google Apps ScriptのWebアプリURL
     - 例: `https://script.google.com/macros/s/AKfycbz.../exec`
3. 「**Add secret**」をクリック

---

## ステップ4: GitHub Pages を有効化

### 4-1. Pages設定を開く
1. リポジトリの「**Settings**」タブをクリック
2. 左サイドバーの「**Pages**」をクリック

### 4-2. Source設定
- **Source**: 「**GitHub Actions**」を選択

これで設定完了です！

---

## ステップ5: 自動デプロイの実行

### 5-1. デプロイの開始
GitHubにpushすると自動的にデプロイが始まります。

すでにpush済みの場合は、以下の方法で手動実行できます:
1. リポジトリの「**Actions**」タブをクリック
2. 左サイドバーの「**Deploy to GitHub Pages**」をクリック
3. 「**Run workflow**」→「**Run workflow**」をクリック

### 5-2. デプロイ状況の確認
1. 「**Actions**」タブで実行状況を確認
2. ✅ 緑色のチェックマークが表示されれば成功！
3. ❌ 赤色のXが表示されたらエラー（トラブルシューティング参照）

### 5-3. 公開URLを確認
デプロイ完了後、以下のURLでアクセスできます:
```
https://YOUR_USERNAME.github.io/allpaint-estimate/
```

---

## 🎉 完了！

お疲れ様でした！これで全塗装シミュレーターが公開されました。

---

## 📝 今後の更新方法

コードを修正した後、以下のコマンドでGitHubにpushすれば自動的に再デプロイされます:

```bash
# 変更をステージング
git add .

# コミット
git commit -m "更新内容の説明"

# GitHubにpush（自動デプロイが開始される）
git push
```

---

## 🔧 トラブルシューティング

### デプロイが失敗する場合

#### 1. Actionsタブでエラー内容を確認
- 「**Actions**」タブ→失敗したワークフローをクリック
- エラーメッセージを確認

#### 2. よくあるエラーと解決方法

**エラー: `npm ci` failed**
- 原因: `package-lock.json` がない
- 解決: ローカルで `npm install` を実行してから再度push

**エラー: Build failed**
- 原因: TypeScriptエラーやビルドエラー
- 解決: ローカルで `npm run build` を実行してエラーを確認

**エラー: Pages deployment failed**
- 原因: GitHub Pagesの設定が正しくない
- 解決: Settings → Pages で Source が「GitHub Actions」になっているか確認

#### 3. 環境変数が設定されていない
- Settings → Secrets and variables → Actions で `VITE_GAS_WEBHOOK_URL` が設定されているか確認

### ページが表示されるがメール送信できない

1. **ブラウザのコンソールを確認**
   - F12キーを押して開発者ツールを開く
   - Consoleタブでエラーを確認

2. **GAS URLが正しく設定されているか確認**
   - GitHub Secretsの `VITE_GAS_WEBHOOK_URL` を確認
   - 再デプロイを実行

3. **GASスクリプトが動作しているか確認**
   - Google Apps Scriptエディタで「実行数」を確認
   - エラーログを確認

---

## 🌐 カスタムドメインを使う場合

独自ドメイン（例: `estimate.example.com`）を使いたい場合:

1. **vite.config.ts を修正**
   ```typescript
   base: process.env.GITHUB_ACTIONS ? '/' : '/',
   ```
   （`/allpaint-estimate/` を `/` に変更）

2. **GitHub Pagesでカスタムドメインを設定**
   - Settings → Pages → Custom domain に独自ドメインを入力

3. **DNSレコードを設定**
   - ドメイン管理画面でCNAMEレコードを追加
   - 詳細: https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site

---

## 📚 参考リンク

- [GitHub Pages 公式ドキュメント](https://docs.github.com/ja/pages)
- [GitHub Actions 公式ドキュメント](https://docs.github.com/ja/actions)
- [Vite デプロイガイド](https://ja.vitejs.dev/guide/static-deploy.html)

---

## ✅ チェックリスト

デプロイ前に確認:
- [ ] GitHubリポジトリを作成した
- [ ] ローカルでGitを初期化した
- [ ] GitHubにpushした
- [ ] GitHub Secretsに `VITE_GAS_WEBHOOK_URL` を設定した
- [ ] GitHub Pagesを有効化した（Source: GitHub Actions）
- [ ] デプロイが成功した（Actionsタブで確認）
- [ ] 公開URLでページが表示される
- [ ] フォームからテスト送信してメールが届く

全てチェックできたら完了です！🎉
