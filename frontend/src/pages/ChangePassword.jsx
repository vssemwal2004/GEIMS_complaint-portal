import { memo, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';

const getPasswordChecks = (newPassword, confirmPassword) => ({
  length: newPassword.length >= 8,
  special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  match: newPassword === confirmPassword && newPassword.length > 0,
});

const PasswordInput = memo(function PasswordInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  valid,
  showPassword,
  onToggle,
  disabled,
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>
        {valid ? <FiCheck className="text-green-600" aria-label="Valid" /> : null}
      </label>
      <div className="relative">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder={`Enter ${label.toLowerCase()}`}
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
});

const ChangePassword = () => {
  const router = useRouter();
  const { changePassword, user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newPasswordValid = (() => {
    if (newPassword.length === 0) return false;
    const checks = getPasswordChecks(newPassword, confirmPassword);
    return checks.length && checks.special;
  })();

  const validatePasswords = useCallback(
    ({ requireMatch }) => {
      const checks = getPasswordChecks(newPassword, confirmPassword);

      const basePass = checks.length && checks.special;
      const matchPass = checks.match;

      if (basePass && (!requireMatch || matchPass)) {
        setError('');
        return true;
      }

      if (requireMatch) {
        if (confirmPassword.length === 0) {
          setError('');
          return false;
        }

        if (!matchPass) {
          setError('Passwords do not match');
          return false;
        }
      }

      setError('Password must be at least 8 characters and include 1 special character');
      return false;
    },
    [newPassword, confirmPassword]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePasswords({ requireMatch: true })) {
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword, confirmPassword);
      
      if (result.success) {
        const redirectPath = user?.role === 'ADMIN' ? '/admin' : '/student';
        router.push(redirectPath);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <FiLock className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Change Password</h1>
              <p className="text-xs text-gray-500">
                {user?.forcePasswordChange ? 'Password update required' : 'Update your password'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" />
              <span className="text-sm leading-5">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              onBlur={() => setError('')}
              valid={false}
              showPassword={showPasswords.current}
              onToggle={() => toggleShowPassword('current')}
              disabled={loading}
            />

            <PasswordInput
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              onBlur={() => validatePasswords({ requireMatch: false })}
              valid={newPasswordValid}
              showPassword={showPasswords.new}
              onToggle={() => toggleShowPassword('new')}
              disabled={loading}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              onBlur={() => validatePasswords({ requireMatch: true })}
              valid={false}
              showPassword={showPasswords.confirm}
              onToggle={() => toggleShowPassword('confirm')}
              disabled={loading}
            />

            {/* Password requirements */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-600 leading-5">
                Requirements: minimum 8 characters; include at least 1 special character; must match confirmation.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
