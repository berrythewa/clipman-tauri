import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { MainLayout } from '../components/layout/MainLayout'
import { HistoryView } from '../components/features/history/historyView'
import { loginRoute } from './auth/login'
import { registerRoute } from './auth/register'
import { forgotPasswordRoute } from './auth/forgot-password'
import { resetPasswordRoute } from './auth/reset-password'
import { verifyEmailRoute } from './auth/verify-email'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export const rootRoute = createRootRoute({
  component: MainLayout,
})

// Public routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HistoryView,
})

// Protected routes (user-specific features)
const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms',
  component: () => (
    <ProtectedRoute>
      <div>Rooms View</div>
    </ProtectedRoute>
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <ProtectedRoute>
      <div>Settings View</div>
    </ProtectedRoute>
  ),
})

// Auth routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  roomsRoute,
  settingsRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  verifyEmailRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
