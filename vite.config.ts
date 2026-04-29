import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { federation } from '@module-federation/vite';
import path from 'path';
import fs from 'fs';

const scenarioImport = process.env.VITE_SCENARIO === 'true';
const shared = (): { singleton: true; import: false } => ({ singleton: true, import: false });
const local = (): { singleton: true; import: false } => ({ singleton: true, import: false });

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: './',
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    // Must be first: serves built dist/remoteEntry.js before federation plugin's
    // dev-mode handler can intercept it. Scenario tests load the production bundle.
    {
      name: 'serve-federation-dist',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? '';
          let filePath = null;
          if (url === '/remoteEntry.js') {
            filePath = path.resolve(__dirname, 'dist/remoteEntry.js');
          } else if (url === '/__rimori_dist_index__.html') {
            filePath = path.resolve(__dirname, 'dist/index.html');
          } else if (url.startsWith('/assets/')) {
            filePath = path.resolve(__dirname, 'dist', url.replace(/^\//, ''));
          }
          if (filePath && fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const contentType = ext === '.css' ? 'text/css; charset=utf-8'
              : ext === '.html' ? 'text/html; charset=utf-8'
              : ext === '.js' || ext === '.mjs' ? 'application/javascript; charset=utf-8'
              : 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(fs.readFileSync(filePath));
          } else {
            next();
          }
        });
      },
    },
    react(),
    federation({
      name: 'rimori-plugin-wiki',
      filename: 'remoteEntry.js',
      dts: false,
      exposes: {
        './MainPanel': './src/federation/MainPanel',
        './Sidebar': './src/federation/Sidebar',
        './Settings': './src/federation/Settings',
      },
      shared: {
        react: shared(),
        'react-dom': shared(),
        'react/jsx-runtime': shared(),
        'react/jsx-dev-runtime': shared(),
        '@rimori/client': shared(),
        '@rimori/react-client': shared(),
        '@tanstack/react-query': shared(),
        zod: shared(),
        // react-router-dom intentionally NOT shared: plugin needs its own Router instance.
        // Note: clsx, @radix-ui/react-dialog, @radix-ui/react-collapsible, @radix-ui/react-slot,
        // and @radix-ui/react-toggle are intentionally NOT shared — they're transitive deps of
        // already-shared packages and the federation runtime auto-excludes them in dev. Listing
        // them with import:false here would tell federation to expect them from the host, but
        // the host won't provide them, causing "Shared module 'X' must be provided by host".
        'react-hook-form': local(),
        '@hookform/resolvers': local(),
        'tailwind-merge': local(),
        'class-variance-authority': local(),
        sonner: local(),
        'date-fns': local(),
        'react-resizable-panels': local(),
        cmdk: local(),
        'input-otp': local(),
        'embla-carousel-react': local(),
        '@radix-ui/react-accordion': local(),
        '@radix-ui/react-alert-dialog': local(),
        '@radix-ui/react-aspect-ratio': local(),
        '@radix-ui/react-avatar': local(),
        '@radix-ui/react-checkbox': local(),
        '@radix-ui/react-context-menu': local(),
        '@radix-ui/react-dropdown-menu': local(),
        '@radix-ui/react-hover-card': local(),
        '@radix-ui/react-label': local(),
        '@radix-ui/react-menubar': local(),
        '@radix-ui/react-navigation-menu': local(),
        '@radix-ui/react-popover': local(),
        '@radix-ui/react-progress': local(),
        '@radix-ui/react-radio-group': local(),
        '@radix-ui/react-scroll-area': local(),
        '@radix-ui/react-select': local(),
        '@radix-ui/react-separator': local(),
        '@radix-ui/react-slider': local(),
        '@radix-ui/react-switch': local(),
        '@radix-ui/react-tabs': local(),
        '@radix-ui/react-toast': local(),
        '@radix-ui/react-toggle-group': local(),
        '@radix-ui/react-tooltip': local(),
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  build: {
    target: 'esnext',
  },
}));
