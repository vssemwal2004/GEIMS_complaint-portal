import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiX } from 'react-icons/fi';
import { Merriweather, Plus_Jakarta_Sans } from 'next/font/google';

import Navbar from '../components/navbar';
import FooterRevealShell from '../components/FooterRevealShell';
import HeroSection from '../HOMESECTION/HeroSection';
import ComplaintsInfoSection from '../HOMESECTION/ComplaintsInfoSection';
import ComplaintsAtGEIMS from '../HOMESECTION/ComplaintsAtGEIMS';

const headingFont = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const Login = ({ __isHomeLanding = false }) => {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if this is home landing based on both prop and current route
  const isHomeLanding = __isHomeLanding || router.asPath === '/' || router.pathname === '/';

  // If already authenticated, skip login page.
  // (Useful when / is rewritten to /Login.)
  useEffect(() => {
    if (isHomeLanding) return;
    if (authLoading) return;
    if (!user) return;
    const redirectPath = user.role === 'ADMIN' ? '/admin' : '/student';
    router.replace(redirectPath);
  }, [authLoading, user, router, isHomeLanding]);

  if (!isHomeLanding && !authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isHomeLanding) {
    return (
      <FooterRevealShell>
        <Navbar />
        <HeroSection />
        <ComplaintsAtGEIMS />
        <ComplaintsInfoSection />
      </FooterRevealShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (result.requirePasswordChange) {
          router.push('/change-password');
        } else {
          const fromQuery = Array.isArray(router.query?.from)
            ? router.query.from[0]
            : router.query?.from;

          const from = typeof fromQuery === 'string' && fromQuery.startsWith('/')
            ? fromQuery
            : (result.role === 'ADMIN' ? '/admin' : '/student');

          router.push(from);
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={[bodyFont.className, 'min-h-screen relative overflow-hidden'].join(' ')}>
      {/* Render home page in background - fixed and behind everything */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FooterRevealShell>
          <Navbar />
          <HeroSection />
          <ComplaintsAtGEIMS />
          <ComplaintsInfoSection />
        </FooterRevealShell>
      </div>

      {/* Semi-transparent overlay (40% opacity for better contrast) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-10 bg-black/40"
      />

      {/* Login card layer */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl animate-fadeIn">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                router.push('/');
              }}
              className="absolute top-4 right-4 z-30 p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close"
              type="button"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Left branding */}
              <div className="flex items-center justify-center p-10 bg-[rgb(var(--color-section-bg))]">
                <div className="text-center">
                  <img
                    src="/geims-logo.png"
                    alt="GEIMS logo"
                    className="mx-auto h-10 w-auto"
                    loading="eager"
                    decoding="async"
                  />
                  <p className="mt-6 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                    Graphic Era Institute of Medical Sciences
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Complaint Portal
                  </p>
                  <div className="mt-6 h-px w-16 mx-auto bg-[rgb(var(--color-accent-green))]" />
                </div>
              </div>

              {/* Right form */}
              <div className="p-8 sm:p-10">
                <div className="mb-6">
                  <h1
                    className={[
                      headingFont.className,
                      'text-2xl sm:text-3xl font-bold tracking-tight text-[rgb(var(--color-text-strong))]'
                    ].join(' ')}
                  >
                    Login
                  </h1>
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Use your provided credentials to access the portal.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email / Username
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:border-[rgb(var(--color-accent-green))] transition-colors"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:border-[rgb(var(--color-accent-green))] transition-colors"
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[rgb(var(--color-accent-green))] hover:underline underline-offset-4"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[rgb(var(--color-accent-green))] px-4 py-3 font-semibold text-[rgb(var(--color-on-accent))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Logging in...
                      </span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/');
                    }}
                    className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-strong))] hover:underline underline-offset-4 transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    Back to Home
                  </button>
                  <span className="text-[rgb(var(--color-text-muted))]">
                    Students change password on first login.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

export async function getServerSideProps(context) {
  const requestUrl = context.req?.url || '';
  const pathname = requestUrl.split('?')[0] || '';
  const isHome = pathname === '/' || pathname === '';

  return {
    props: {
      __isHomeLanding: isHome,
    },
  };
}
