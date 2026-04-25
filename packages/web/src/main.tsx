import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Root } from './app/root'
import './styles/globals.css'

const PRELOAD_RELOAD_KEY = 'vite-preload-reloaded-at'
const PRELOAD_RELOAD_COOLDOWN_MS = 10_000

window.addEventListener('vite:preloadError', (event) => {
  const now = Date.now()
  const last = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? '0')
  if (now - last < PRELOAD_RELOAD_COOLDOWN_MS) {
    console.error('vite:preloadError retry aborted:', event)
    return
  }
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now))
  window.location.reload()
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
