import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { Merriweather, Plus_Jakarta_Sans } from 'next/font/google';

const headingFont = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const Login = () => {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const redirectPath = user.role === 'ADMIN' ? '/admin' : '/student';
    router.replace(redirectPath);
  }, [authLoading, user, router]);

  if (!authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
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
    <div className={[bodyFont.className, 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12'].join(' ')}>
      <div className="w-full max-w-4xl animate-fadeIn">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="grid md:grid-cols-2">
            {/* Left branding */}
            <div className="flex items-center justify-center p-10 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="text-center">
                <img
                  src="/geims-logo.png"
                  alt="GEIMS logo"
                  className="mx-auto h-12 w-auto"
                  loading="eager"
                  decoding="async"
                />
                <p className="mt-6 text-sm font-semibold text-white">
                  Graphic Era Institute of Medical Sciences
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Complaint Portal
                </p>
                <div className="mt-6 h-px w-16 mx-auto bg-emerald-500" />
              </div>
            </div>

            {/* Right form */}
            <div className="p-8 sm:p-10">
              <div className="mb-6">
                <h1
                  className={[
                    headingFont.className,
                    'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900'
                  ].join(' ')}
                >
                  Login
                </h1>
                <p className="mt-2 text-sm text-slate-500">
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
                      className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    href="/ForgotPassword"
                    className="text-sm text-emerald-600 hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="mt-6 text-center">
                <span className="text-sm text-slate-500">
                  Students change password on first login.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
