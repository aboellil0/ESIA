/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_TRANSFER_NUMBER?: string
  readonly VITE_TRANSFER_ACCOUNT_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
