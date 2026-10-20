/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string;
  /** Empreinte SHA-256 (hexadécimal) du mot de passe administrateur. */
  readonly VITE_ADMIN_PASSWORD_SHA256?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
