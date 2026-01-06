import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // 開発者負担版のビルドかどうか
  const isHostedMode = mode === 'hosted';

  return {
    plugins: [react()],
    base: '/grade-matching-assistant/',
    build: {
      outDir: '../docs',
      emptyOutDir: !isHostedMode, // 開発者負担版のビルド時は既存ファイルを削除しない
      rollupOptions: isHostedMode
        ? {
            input: {
              hosted: path.resolve(__dirname, 'indexHosted.html'),
            },
            output: {
              entryFileNames: 'assets/[name]-[hash].js',
              chunkFileNames: 'assets/[name]-[hash].js',
              assetFileNames: 'assets/[name]-[hash].[ext]',
            },
          }
        : undefined,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
    },
  };
});
