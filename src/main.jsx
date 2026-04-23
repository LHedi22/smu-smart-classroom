import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { runAutoSeedOnStartup } from './startup/autoSeedOnStartup'

async function bootstrap() {
  await runAutoSeedOnStartup()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
