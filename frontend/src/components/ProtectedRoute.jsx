import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, requirePasswordChange } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // All hooks must be called before any return statements
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Don't run on server or while loading
    if (!isClient || loading || !router.isReady) return;

    const currentPath = (router.asPath || '').split('?')[0];

    // Not authenticated - redirect to login
    if (!user) {
      if (currentPath !== '/Login' && currentPath !== '/login') {
        router.replace('/Login');
      }
      return;
    }

    // Requires password change - redirect to change password page
    if (requirePasswordChange && currentPath !== '/change-password') {
      router.replace('/change-password');
      return;
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    }
  }, [isClient, router, user, loading, requirePasswordChange, allowedRoles]);

  // Show loading spinner during SSR or while checking auth
  if (!isClient || loading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated - show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Needs password change - show loading while redirecting
  const currentPath = (router.asPath || '').split('?')[0];
  if (requirePasswordChange && currentPath !== '/change-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Wrong role - show loading while redirecting
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;