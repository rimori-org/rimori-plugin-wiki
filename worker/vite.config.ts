import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: __dirname,
  build: {
    minify: process.env.VITE_MINIFY === 'true',
    lib: {
      entry: 'worker.ts',
      formats: ['iife'],
      name: 'PluginFooWorker',
      fileName: () => 'web-worker.js',
    },
    outDir: path.resolve(__dirname, '../public'),
    emptyOutDir: false,
    rollupOptions: {
      // @rimori/react-client provides it for browser contexts
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'web-worker.js',
      },
    },
  },
});
