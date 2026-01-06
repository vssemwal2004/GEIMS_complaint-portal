import '../index.css';

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { setNavigationHandler } from '../services/api';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const pathname = router.pathname;

  // Register navigation handler for api interceptors
  useEffect(() => {
    setNavigationHandler((path) => {
      router.push(path);
    });
  }, [router]);

  const isAdminRoute = pathname.startsWith('/admin');
  const isStudentRoute = pathname.startsWith('/student');
  const isChangePasswordRoute = pathname === '/ChangePassword';

  // Use router.asPath as key to force re-render on navigation
  let content = <Component {...pageProps} key={router.asPath} />;

  if (isAdminRoute) {
    content = (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <Layout>{content}</Layout>
      </ProtectedRoute>
    );
  } else if (isStudentRoute) {
    content = (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <Layout>{content}</Layout>
      </ProtectedRoute>
    );
  } else if (isChangePasswordRoute) {
    content = <ProtectedRoute>{content}</ProtectedRoute>;
  }

  return (
    <AuthProvider>
      <Head>
        <title>GEIMS Complaint Portal</title>
        <meta
          name="description"
          content="GEIMS Complaint Portal - Submit and track your complaints"
        />
        <link rel="icon" href="/sc/geims-logo.webp" type="image/webp" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
      {content}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </AuthProvider>
  );
}
