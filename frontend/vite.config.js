import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Makes ReTrack installable and able to open without internet (offline mode).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'ReTrack Inventory',
        short_name: 'ReTrack',
        description: 'Inventory and sales for small stores',
        start_url: '/',
        display: 'standalone',
        background_color: '#3C467B',
        theme_color: '#3C467B',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Save the whole app (including the barcode engine) on the device.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2,wasm}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Product photos from the backend: keep a copy for offline viewing.
            urlPattern: ({ url }) => url.pathname.startsWith('/storage/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-photos',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
