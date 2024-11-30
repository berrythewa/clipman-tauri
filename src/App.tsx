import { useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import { initializeClipboardMonitoring } from './stores/useClipboardStore'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  useEffect(() => {
    initializeClipboardMonitoring().catch(console.error)
  }, [])

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App