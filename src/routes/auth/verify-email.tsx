import { createRoute, Link, useSearch } from '@tanstack/react-router';
import { rootRoute } from '../index';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { useEffect, useState } from 'react';

interface VerifyEmailSearchParams {
  token: string;
}

export const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/verify-email',
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearchParams => {
    if (typeof search.token !== 'string') {
      throw new Error('Token is required');
    }
    return { token: search.token };
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const search = useSearch({ from: '/auth/verify-email' });
  const token = search.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // TODO: Implement email verification logic
        console.log('Verifying email with token:', token);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify your email. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <AuthLayout
      title="Email Verification"
      description="Please wait while we verify your email address"
    >
      <div className="space-y-6 text-center">
        <div className={`text-lg font-medium ${
          status === 'error' ? 'text-red-500' : 
          status === 'success' ? 'text-green-500' : 
          'text-primary'
        }`}>
          {message}
        </div>

        {status !== 'loading' && (
          <div className="space-y-4">
            {status === 'success' ? (
              <Link
                to="/auth/login"
                className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
              >
                Sign in
              </Link>
            ) : (
              <>
                <Link
                  to="/"
                  className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                >
                  Go to homepage
                </Link>
                <p className="text-sm text-muted-foreground">
                  Need help?{' '}
                  <Link to="/auth/login" className="text-primary hover:underline">
                    Contact support
                  </Link>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 