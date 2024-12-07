import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';

export function UserMenu() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/10">
        <span className="text-sm font-medium">{user.username}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transform group-hover:rotate-180 transition-transform"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <Link
          to="/settings"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Settings
        </Link>
        <button
          onClick={logout}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
} 