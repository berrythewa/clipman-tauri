import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../index';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthLayout
      title="Create an account"
      description="Enter your details to create your account"
    >
      <RegisterForm />
    </AuthLayout>
  );
} 