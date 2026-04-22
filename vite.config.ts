import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { federation } from '@module-federation/vite';
import path from 'path';
import fs from 'fs';

export default defineConfig(() => ({
  base: './',
  server: { host: '::', port: 8080 },
  plugins: [
    react(),
    federation({
      name: 'rimori-plugin-wiki',
      filename: 'remoteEntry.js',
      exposes: {
        './MainPanel': './src/federation/MainPanel',
        './Sidebar': './src/federation/Sidebar',
        './Settings': './src/federation/Settings',
      },
      shared: {
        react:                           { singleton: true, import: false },
        'react-dom':                     { singleton: true, import: false },
        'react/jsx-runtime':             { singleton: true, import: false },
        'react/jsx-dev-runtime':         { singleton: true, import: false },
        '@rimori/client':                { singleton: true, import: false },
        '@rimori/react-client':          { singleton: true, import: false },
        '@tanstack/react-query':         { singleton: true, import: false },
        zod:                             { singleton: true, import: false },
        // react-router-dom intentionally NOT shared: plugin needs its own Router instance
        // to avoid "nested Router" error when running inside rimori-main via module federation.
        'react-hook-form':               { singleton: true, import: false },
        '@hookform/resolvers':           { singleton: true, import: false },
        clsx:                            { singleton: true, import: false },
        'tailwind-merge':                { singleton: true, import: false },
        'class-variance-authority':      { singleton: true, import: false },
        sonner:                          { singleton: true, import: false },
        'date-fns':                      { singleton: true, import: false },
        'react-resizable-panels':        { singleton: true, import: false },
        cmdk:                            { singleton: true, import: false },
        'input-otp':                     { singleton: true, import: false },
        'embla-carousel-react':          { singleton: true, import: false },
        '@radix-ui/react-accordion':     { singleton: true, import: false },
        '@radix-ui/react-alert-dialog':  { singleton: true, import: false },
        '@radix-ui/react-aspect-ratio':  { singleton: true, import: false },
        '@radix-ui/react-avatar':        { singleton: true, import: false },
        '@radix-ui/react-checkbox':      { singleton: true, import: false },
        '@radix-ui/react-collapsible':   { singleton: true, import: false },
        '@radix-ui/react-context-menu':  { singleton: true, import: false },
        '@radix-ui/react-dialog':        { singleton: true, import: false },
        '@radix-ui/react-dropdown-menu': { singleton: true, import: false },
        '@radix-ui/react-hover-card':    { singleton: true, import: false },
        '@radix-ui/react-label':         { singleton: true, import: false },
        '@radix-ui/react-menubar':       { singleton: true, import: false },
        '@radix-ui/react-navigation-menu': { singleton: true, import: false },
        '@radix-ui/react-popover':       { singleton: true, import: false },
        '@radix-ui/react-progress':      { singleton: true, import: false },
        '@radix-ui/react-radio-group':   { singleton: true, import: false },
        '@radix-ui/react-scroll-area':   { singleton: true, import: false },
        '@radix-ui/react-select':        { singleton: true, import: false },
        '@radix-ui/react-separator':     { singleton: true, import: false },
        '@radix-ui/react-slider':        { singleton: true, import: false },
        '@radix-ui/react-slot':          { singleton: true, import: false },
        '@radix-ui/react-switch':        { singleton: true, import: false },
        '@radix-ui/react-tabs':          { singleton: true, import: false },
        '@radix-ui/react-toast':         { singleton: true, import: false },
        '@radix-ui/react-toggle':        { singleton: true, import: false },
        '@radix-ui/react-toggle-group':  { singleton: true, import: false },
        '@radix-ui/react-tooltip':       { singleton: true, import: false },
      },
    }),
    {
      name: 'serve-federation-dist',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? '';
          let filePath = null;
          if (url === '/remoteEntry.js') {
            filePath = path.resolve(__dirname, 'dist/remoteEntry.js');
          } else if (url.startsWith('/assets/')) {
            filePath = path.resolve(__dirname, 'dist', url.replace(/^\//, ''));
          }
          if (filePath && fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(fs.readFileSync(filePath, 'utf-8'));
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  build: { target: 'esnext' },
}));
