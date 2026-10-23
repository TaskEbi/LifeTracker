import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fetchPreview } from './supabase/functions/_shared/preview';

/** Dev-only stand-in for the preview Edge Function, so link previews work in local-only mode. */
function devPreview(): Plugin {
  return {
    name: 'lt-dev-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/preview', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://x').searchParams.get('url') ?? '';
        const result = await fetchPreview(url);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(result));
      });
    },
  };
}

export default defineConfig({
  server: { port: 5173 },
  plugins: [
    react(),
    devPreview(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      devOptions: { enabled: false },
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'LifeTracker',
        short_name: 'LifeTracker',
        description: 'Practice, training, study, sleep and the things worth keeping.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#eceeec',
        theme_color: '#eceeec',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: { title: 'title', text: 'text', url: 'url', files: [{ name: 'photo', accept: ['image/*'] }] },
        },
      },
    }),
  ],
});
