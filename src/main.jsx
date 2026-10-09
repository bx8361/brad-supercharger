import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register only built assets; development keeps Vite's normal reload behavior.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => {
    const base = new URL(import.meta.env.BASE_URL, document.baseURI)
    navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.href, updateViaCache: 'none' })
      .catch(error => console.warn('Offline support could not be enabled.', error))
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
