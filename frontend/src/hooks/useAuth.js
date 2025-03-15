import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, isAuthenticated, refreshToken, requestPasswordReset, confirmPasswordReset } from '../api/auth';
import apiClient from '../api/client';

// Create the Auth Context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  
  // Check authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authed = await isAuthenticated();
        setIsAuthed(authed);
        
        if (authed) {
          // If authenticated, fetch user data
          try {
            const userResponse = await apiClient.get('/auth/me');
            setCurrentUser(userResponse.data);
          } catch (userError) {
            console.error('Error fetching user data:', userError);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Set up refresh token interval
  useEffect(() => {
    let refreshInterval;
    
    if (isAuthed) {
      // Refresh token every 15 minutes (adjust as needed)
      refreshInterval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (err) {
          console.error('Token refresh error:', err);
          // If refresh fails, log out the user
          if (err.response && err.response.status === 401) {
            handleLogout();
          }
        }
      }, 15 * 60 * 1000); // 15 minutes
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAuthed]);
  
  // Handle login
  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await apiLogin({ email, password });
      setCurrentUser(response.data.user);
      setIsAuthed(true);
      return response.data;
    } catch (err) {
      setAuthError(err?.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle registration
  const handleRegister = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await apiRegister(userData);
      return response.data;
    } catch (err) {
      setAuthError(err?.response?.data?.detail || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setIsAuthed(false);
    }
  };
  
  // Context value
  const contextValue = {
    currentUser,
    loading,
    error: authError,
    isAuthenticated: isAuthed,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for component use
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// This hook could be used for non-context operations
export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestPasswordReset({ email });
      return response.data;
    } catch (err) {
      setError(err?.response?.data?.detail || 'Password reset request failed');
      console.error('Password reset error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirmReset = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await confirmPasswordReset(data);
      return response.data;
    } catch (err) {
      setError(err?.response?.data?.detail || 'Password reset confirmation failed');
      console.error('Password reset confirmation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    resetPassword: handlePasswordReset,
    confirmReset: handleConfirmReset
  };
};