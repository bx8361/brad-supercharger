import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pwaAssets } from './scripts/pwa.js'

export default defineConfig({
  base: './',
  plugins: [react(), pwaAssets()],
  // ponytail: prebundling rewrites the worker URL to .vite/deps, where xmllint-browser.mjs is not emitted
  optimizeDeps: { exclude: ['xmllint-wasm'] },
})
