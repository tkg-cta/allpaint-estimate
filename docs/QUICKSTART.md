# 📝 クイックスタートガイド

## 最短でデプロイする手順

### 1️⃣ GitHubリポジトリ作成（3分）
1. https://github.com/new にアクセス
2. Repository name: `allpaint-estimate`
3. Public を選択
4. Create repository

### 2️⃣ ローカルからpush（2分）
```bash
cd /Users/webjigyoubutkg/Documents/CODE/allpaint-estimate
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/allpaint-estimate.git
git branch -M main
git push -u origin main
```
⚠️ `YOUR_USERNAME` を自分のユーザー名に変更！

### 3️⃣ 環境変数を設定（2分）
1. リポジトリ → Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `VITE_GAS_WEBHOOK_URL`
4. Secret: GASのWebアプリURL
5. Add secret

### 4️⃣ GitHub Pages有効化（1分）
1. Settings → Pages
2. Source: **GitHub Actions** を選択

### 5️⃣ デプロイ実行（1分）
1. Actions タブ → Deploy to GitHub Pages
2. Run workflow → Run workflow

### 6️⃣ 完了！
`https://YOUR_USERNAME.github.io/allpaint-estimate/` にアクセス

---

詳細は [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) を参照してください。
