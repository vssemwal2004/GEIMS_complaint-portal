import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMail, FiAlertCircle, FiX, FiClock } from 'react-icons/fi';
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

const ForgotPassword = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownData, setCooldownData] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check cooldown status when email changes
  useEffect(() => {
    if (!email || !isValidEmail(email.trim())) {
      setCooldownData(null);
      setRemainingTime(0);
      return;
    }

    const checkCooldown = async () => {
      try {
        const res = await api.post('/api/auth/check-forgot-cooldown', { email: email.trim() });
        if (res.data?.success && res.data.data?.isBlocked) {
          setCooldownData(res.data.data);
          setRemainingTime(res.data.data.remainingSeconds);
        } else {
          setCooldownData(null);
          setRemainingTime(0);
        }
      } catch (err) {
        // Ignore errors on cooldown check
        setCooldownData(null);
        setRemainingTime(0);
      }
    };

    const debounce = setTimeout(checkCooldown, 500);
    return () => clearTimeout(debounce);
  }, [email]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) {
      setCooldownData(null);
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setCooldownData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const isValidEmail = (value) => {
    // Minimal email validation (backend does the authoritative validation)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (cooldownData?.isBlocked) {
      setError(`Too many attempts. Please try again in ${formatTime(remainingTime)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email: trimmedEmail });
      if (res.data?.success) {
        toast.success('If an account exists for that email, a reset link has been sent.');
        
        // Recheck cooldown status after sending
        setTimeout(async () => {
          try {
            const cooldownRes = await api.post('/api/auth/check-forgot-cooldown', { email: trimmedEmail });
            if (cooldownRes.data?.success && cooldownRes.data.data?.isBlocked) {
              setCooldownData(cooldownRes.data.data);
              setRemainingTime(cooldownRes.data.data.remainingSeconds);
              // Don't clear email if user is now in cooldown
            } else {
              // Only clear email if not in cooldown
              setEmail('');
            }
          } catch (err) {
            // Clear email on error
            setEmail('');
          }
        }, 500);
      } else {
        toast.error('Unable to process your request right now.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to process your request right now.';
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
                    Forgot Password
                  </h1>
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Enter your registered email to receive a password reset link.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {cooldownData?.isBlocked && remainingTime > 0 && (
                  <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-700">
                    <FiClock className="mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">Too many attempts</p>
                      <p className="mt-1">You can try again in <span className="font-mono font-semibold">{formatTime(remainingTime)}</span></p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
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

                  <button
                    type="submit"
                    disabled={loading || (cooldownData?.isBlocked && remainingTime > 0)}
                    className="w-full rounded-lg bg-[rgb(var(--color-accent-green))] px-4 py-3 font-semibold text-[rgb(var(--color-on-accent))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : cooldownData?.isBlocked && remainingTime > 0 ? `Wait ${formatTime(remainingTime)}` : 'Send Reset Link'}
                  </button>

                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="text-sm text-[rgb(var(--color-accent-green))] hover:underline underline-offset-4"
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

export default ForgotPassword;
