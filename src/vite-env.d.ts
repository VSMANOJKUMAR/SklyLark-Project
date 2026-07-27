/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONDAY_API_KEY: string;
  readonly VITE_DEALS_BOARD_ID: string;
  readonly VITE_WORK_ORDERS_BOARD_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
