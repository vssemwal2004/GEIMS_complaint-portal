import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, requirePasswordChange } = useAuth();
  const router = useRouter();

  // During SSR we can't read auth state from localStorage/cookies here,
  // so we block rendering and let the client decide.
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (loading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentPath = (router.asPath || '').split('?')[0];

  useEffect(() => {
    if (!router.isReady) return;

    // Not authenticated - redirect to login
    if (!user) {
      const from = router.asPath || '/';
      const loginUrl = `/login?from=${encodeURIComponent(from)}`;
      if (currentPath !== '/login') {
        router.replace(loginUrl);
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
      router.replace(user.role === 'ADMIN' ? '/admin' : '/student');
    }
  }, [router, user, requirePasswordChange, allowedRoles, currentPath]);

  // While redirecting, show loader
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (requirePasswordChange && currentPath !== '/change-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
