/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DOWNLOAD_URL_WINDOWS?: string;
  readonly VITE_DOWNLOAD_URL_MACOS?: string;
  readonly VITE_DOWNLOAD_URL_LINUX?: string;
  /** Optional `owner/repo`. Used to resolve latest release assets when download URLs are missing or non-GitHub. */
  readonly VITE_DOWNLOAD_RELEASES_REPO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
