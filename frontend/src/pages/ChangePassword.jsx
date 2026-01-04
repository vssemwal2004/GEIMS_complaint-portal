import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';

const ChangePassword = () => {
  const navigate = useNavigate();
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

  // Password validation
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0,
  };

  const allChecksPass = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allChecksPass) {
      setError('Please ensure all password requirements are met');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword, confirmPassword);
      
      if (result.success) {
        const redirectPath = user?.role === 'ADMIN' ? '/admin' : '/student';
        navigate(redirectPath);
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

  const PasswordInput = ({ id, label, value, onChange, showPassword, onToggle }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder={`Enter ${label.toLowerCase()}`}
          required
          disabled={loading}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );

  const CheckItem = ({ passed, text }) => (
    <li className={`flex items-center gap-2 ${passed ? 'text-green-600' : 'text-gray-500'}`}>
      {passed ? <FiCheck className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
      <span className="text-sm">{text}</span>
    </li>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
            <FiLock className="text-3xl text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Change Password</h1>
          <p className="text-primary-100 mt-2">
            {user?.forcePasswordChange 
              ? 'You must change your password before continuing'
              : 'Update your account password'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <FiAlertCircle className="flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <PasswordInput
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              showPassword={showPasswords.current}
              onToggle={() => toggleShowPassword('current')}
            />

            <PasswordInput
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              showPassword={showPasswords.new}
              onToggle={() => toggleShowPassword('new')}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={showPasswords.confirm}
              onToggle={() => toggleShowPassword('confirm')}
            />

            {/* Password requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
              <ul className="space-y-2">
                <CheckItem passed={passwordChecks.length} text="At least 8 characters" />
                <CheckItem passed={passwordChecks.uppercase} text="One uppercase letter" />
                <CheckItem passed={passwordChecks.lowercase} text="One lowercase letter" />
                <CheckItem passed={passwordChecks.number} text="One number" />
                <CheckItem passed={passwordChecks.special} text="One special character (!@#$%^&*)" />
                <CheckItem passed={passwordChecks.match} text="Passwords match" />
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allChecksPass}
              className="w-full py-3 px-4 gradient-primary text-white font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Changing Password...
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
