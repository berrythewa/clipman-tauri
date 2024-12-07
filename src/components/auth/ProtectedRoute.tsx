import { ReactNode, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { useClipboardStore } from '../../stores/clipboardStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { startMonitoring, isMonitoring, stopMonitoring } = useClipboardStore();
  const monitoringInitialized = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/auth/login' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Start clipboard monitoring when authenticated
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isMonitoring, initialized: monitoringInitialized.current });
    
    if (isAuthenticated && !isMonitoring && !monitoringInitialized.current) {
      console.log('Starting clipboard monitoring...');
      monitoringInitialized.current = true;
      startMonitoring().catch(error => {
        console.error('Failed to start monitoring:', error);
        monitoringInitialized.current = false;
      });
    }
    
    // Cleanup monitoring when component unmounts or user logs out
    return () => {
      if (isMonitoring) {
        console.log('Stopping clipboard monitoring...');
        stopMonitoring();
        monitoringInitialized.current = false;
      }
    };
  }, [isAuthenticated, isMonitoring, startMonitoring, stopMonitoring]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 