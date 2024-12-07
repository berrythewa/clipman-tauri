import { useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import { initializeClipboardMonitoring } from './stores/useClipboardStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './components/auth/AuthProvider'
import './App.css'

function App() {
  useEffect(() => {
    initializeClipboardMonitoring().catch(console.error)
  }, [])

  return (
    <AuthProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App