import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { MainLayout } from '../components/layout/MainLayout'
import { HistoryView } from '../components/features/history/historyView'

const rootRoute = createRootRoute({
  component: MainLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HistoryView,
})

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms',
  component: () => <div>Rooms View</div>,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => <div>Settings View</div>,
})

const routeTree = rootRoute.addChildren([indexRoute, roomsRoute, settingsRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
