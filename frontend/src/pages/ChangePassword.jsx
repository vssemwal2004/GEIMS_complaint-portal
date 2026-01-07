import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Merriweather, Plus_Jakarta_Sans } from 'next/font/google';

const headingFont = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const ChangePassword = () => {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check if this is a forced password change
    setIsFirstLogin(user.forcePasswordChange === true);
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        
        // Update user context with new token and forcePasswordChange: false
        if (response.data.data?.token) {
          localStorage.setItem('token', response.data.data.token);
        }
        
        if (response.data.data?.user) {
          setUser(response.data.data.user);
        }

        // Redirect to dashboard
        const redirectPath = user.role === 'ADMIN' ? '/admin' : '/student';
        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to change password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={[bodyFont.className, 'min-h-screen bg-white flex items-center justify-center px-4 py-12'].join(' ')}>
      <div className="w-full max-w-md animate-fadeIn">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center">
            <img
              src="/sc/geims-logo.webp"
              alt="GEIMS logo"
              className="mx-auto h-12 w-auto"
              loading="eager"
              decoding="async"
            />
            <p className="mt-4 text-sm font-semibold text-white">
              Graphic Era Institute of Medical Sciences
            </p>
            {isFirstLogin && (
              <div className="mt-4 rounded-lg bg-amber-500/20 border border-amber-500/30 p-3">
                <p className="text-xs text-amber-100 font-medium">
                  ⚠️ First Login: You must change your password before continuing
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="mb-6">
              <h1
                className={[
                  headingFont.className,
                  'text-2xl font-bold tracking-tight text-slate-900'
                ].join(' ')}
              >
                Change Password
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {isFirstLogin 
                  ? 'Create a new secure password to access your account'
                  : 'Update your password to keep your account secure'}
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <FiEyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <FiEyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="h-4 w-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>

              {/* Cancel Button (only if not first login) */}
              {!isFirstLogin && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
