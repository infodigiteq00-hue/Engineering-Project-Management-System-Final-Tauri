/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DOWNLOAD_URL_WINDOWS?: string;
  readonly VITE_DOWNLOAD_URL_MACOS?: string;
  readonly VITE_DOWNLOAD_URL_LINUX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
