import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // TODO: Check for stored auth token
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // TODO: Validate token with server and get user data
          // const user = await validateToken(token);
          // setUser(user);
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        // Clear invalid token
        localStorage.removeItem('auth_token');
      } finally {
        // Always set loading to false, whether logged in or not
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
} 