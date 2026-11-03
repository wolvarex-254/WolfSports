/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRAMEX_API_BASE_URL?: string;
  readonly VITE_FRAMEX_API_KEY?: string;
  readonly VITE_PUBLIC_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
