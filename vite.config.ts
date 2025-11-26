import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
 const env = loadEnv(mode, '.', '');
 return {
  // GitHub Pagesのbase path設定
  // リポジトリ名が allpaint-estimate の場合: /allpaint-estimate/
  // カスタムドメインを使う場合は '/' のままでOK
  base: process.env.GITHUB_ACTIONS ? '/allpaint-estimate/' : '/',

  server: {
   port: 3000,
   host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
   'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
   'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
  },
  resolve: {
   alias: {
    '@': path.resolve(__dirname, '.'),
   }
  }
 };
});
