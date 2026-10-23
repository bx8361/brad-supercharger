import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pwaAssets } from './scripts/pwa.js'
import { sitemap } from './scripts/sitemap.js'

export default defineConfig({
  base: './',
  plugins: [react(), pwaAssets(), sitemap()],
  // ponytail: prebundling rewrites the worker URL to .vite/deps, where xmllint-browser.mjs is not emitted
  optimizeDeps: { exclude: ['xmllint-wasm'] },
})
