import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiLock, FiAlertCircle, FiX } from 'react-icons/fi';
import { Merriweather, Plus_Jakarta_Sans } from 'next/font/google';
import toast from 'react-hot-toast';

import api from '../services/api';

const headingFont = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const ResetPassword = () => {
  const router = useRouter();
  const token = useMemo(() => {
    const t = router.query?.token;
    return typeof t === 'string' ? t : '';
  }, [router.query]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // When token is missing, show a clear message.
    if (router.isReady && !token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [router.isReady, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });

      if (res.data?.success) {
        toast.success('Password reset successful. You can now log in.');
        router.push('/login');
      } else {
        toast.error('Unable to reset password.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to reset password.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={[bodyFont.className, 'min-h-screen bg-white flex items-center justify-center px-4 py-12'].join(' ')}>
        <div className="w-full max-w-4xl animate-fadeIn">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl relative">
            {/* Close button */}
            <button
              onClick={() => router.push('/Login')}
              className="absolute top-4 right-4 z-30 p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close"
              type="button"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Left branding (same as Login) */}
              <div className="flex items-center justify-center p-10 bg-[rgb(var(--color-section-bg))]">
                <div className="text-center">
                  <img
                    src="/sc/geims-logo.webp"
                    alt="GEIMS logo"
                    className="mx-auto h-10 w-auto"
                    loading="eager"
                    decoding="async"
                  />
                  <p className="mt-6 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                    Graphic Era Institute of Medical Sciences
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Complaint Portal</p>
                  <div className="mt-6 h-px w-16 mx-auto bg-[rgb(var(--color-accent-green))]" />
                </div>
              </div>

              {/* Right content */}
              <div className="p-8 sm:p-10">
                <div className="mb-6">
                  <h1
                    className={[
                      headingFont.className,
                      'text-2xl sm:text-3xl font-bold tracking-tight text-[rgb(var(--color-text-strong))]'
                    ].join(' ')}
                  >
                    Reset Password
                  </h1>
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Set a new password for your account.
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
                    <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:border-[rgb(var(--color-accent-green))] transition-colors"
                        placeholder="Enter new password"
                        required
                        disabled={loading}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Minimum 8 characters.</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:border-[rgb(var(--color-accent-green))] transition-colors"
                        placeholder="Re-enter new password"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (!token && router.isReady)}
                    className="w-full rounded-lg bg-[rgb(var(--color-accent-green))] px-4 py-3 font-semibold text-[rgb(var(--color-on-accent))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[rgb(var(--color-accent-green))] hover:underline underline-offset-4"
                    >
                      Request a new link
                    </Link>
                    <Link
                      href="/login"
                      className="text-sm text-[rgb(var(--color-text-muted))] hover:text-slate-700 hover:underline underline-offset-4"
                    >
                      Back to Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ResetPassword;
