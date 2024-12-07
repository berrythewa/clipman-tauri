import { createRoute, Link, useSearch } from '@tanstack/react-router';
import { rootRoute } from '../index';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResetPasswordConfirm } from '../../types/auth';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ResetPasswordSearchParams {
  token: string;
}

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearchParams => {
    if (typeof search.token !== 'string') {
      throw new Error('Token is required');
    }
    return { token: search.token };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = useSearch({ from: '/auth/reset-password' });
  const token = search.token as string;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordConfirm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
    },
  });

  const onSubmit = async (data: ResetPasswordConfirm) => {
    try {
      // TODO: Implement password reset logic
      console.log('Resetting password with token:', data);
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your new password below"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New Password
          </label>
          <input
            {...register('newPassword')}
            type="password"
            id="newPassword"
            className="w-full p-2 border rounded-md"
            placeholder="Enter your new password"
          />
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            id="confirmPassword"
            className="w-full p-2 border rounded-md"
            placeholder="Confirm your new password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Resetting password...' : 'Reset password'}
        </button>

        <p className="text-sm text-center text-muted-foreground">
          Remember your password?{' '}
          <Link to="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
 