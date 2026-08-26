/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Who operates the service: a company, sole trader, or named individual. */
  readonly VITE_LEGAL_OPERATOR_NAME?: string;
  /** Where they are established, at least to country level. */
  readonly VITE_LEGAL_OPERATOR_LOCATION?: string;
  /** The address that actually answers privacy and legal mail. */
  readonly VITE_LEGAL_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
