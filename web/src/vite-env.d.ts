/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_ENDPOINT?: string;
  readonly VITE_HOSTED_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

