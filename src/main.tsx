import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { bootstrapSessionFromHash, supabase } from './lib/supabase'

// Ensure any OAuth hash tokens are persisted BEFORE the app mounts
bootstrapSessionFromHash()
  .catch(() => undefined)
  .then(() => supabase.auth.getSession())
  .finally(() => {
    createRoot(document.getElementById("root")!).render(<App />)
  })
