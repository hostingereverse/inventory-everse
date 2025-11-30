/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GOOGLE_SHEET_SALES_URL?: string;
  readonly GOOGLE_SHEET_ACCOUNTS_URL?: string;
  readonly GOOGLE_SHEET_ADS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

