import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/lora/400.css'
import '@fontsource/lora/400-italic.css'
import '@fontsource/lora/600.css'
import './index.css'
// Shared styles first: a component's own stylesheet, imported with it, comes after and wins ties.
import './App.css'
import App from './App.tsx'
import { registerFeatures } from './features/register'

registerFeatures()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
