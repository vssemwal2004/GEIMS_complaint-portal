import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });
  const [loading, setLoading] = useState(typeof window !== 'undefined');

  // Set token in API headers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Verify token and get user on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/verify');
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: userData, token: newToken, requirePasswordChange } = response.data.data;
        
        setToken(newToken);
        setUser(userData);
        
        toast.success('Login successful!');
        
        return { 
          success: true, 
          requirePasswordChange,
          role: userData.role 
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
    } finally {
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
        toast.success('Password changed successfully!');
        return { success: true };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      const data = error.response?.data;
      const detailedMessage = Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors[0].message
        : null;

      const message =
        // Prefer specific validation reason over generic envelope message
        ((data?.message === 'Validation failed' || data?.message === 'Invalid parameters') && detailedMessage)
          ? detailedMessage
          : (data?.message || detailedMessage || 'Failed to change password');
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Get current user
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch {
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isStudent: user?.role === 'STUDENT',
    requirePasswordChange: user?.forcePasswordChange,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
