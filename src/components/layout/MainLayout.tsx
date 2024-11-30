import { Link, Outlet } from '@tanstack/react-router'
import { History, Users2, Settings } from 'lucide-react'

export function MainLayout() {
  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
        <Link
          to="/"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          activeProps={{ className: 'text-white bg-gray-800' }}
        >
          <History size={24} />
        </Link>
        <Link
          to="/rooms"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          activeProps={{ className: 'text-white bg-gray-800' }}
        >
          <Users2 size={24} />
        </Link>
        <Link
          to="/settings"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          activeProps={{ className: 'text-white bg-gray-800' }}
        >
          <Settings size={24} />
        </Link>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}