/// &lt;reference types="vite/client" />

interface ImportMetaEnv {
 readonly VITE_GAS_WEBHOOK_URL: string
 // 他の環境変数をここに追加
}

interface ImportMeta {
 readonly env: ImportMetaEnv
}
