import React, { createContext, useState, useEffect, useContext } from "react";
import {
  login as loginApi,
  register as registerApi,
  refreshToken as refreshApi,
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  isAuthenticated as checkAuth,
  isAdmin as checkAdmin,
} from "../api/auth";
import { getCurrentUser } from "../api/users";

// Create the authentication context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const loadUser = async () => {
      if (checkAuth()) {
        try {
          const response = await getCurrentUser();
          setCurrentUser(response.data);
        } catch (err) {
          // If getting user data fails, clear tokens as they might be invalid
          clearTokens();
          console.error("Failed to load user data:", err);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginApi(email, password);

      // Save tokens
      if (response.data.access_token) {
        setToken(response.data.access_token);
      }

      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }

      // Get user data
      const userResponse = await getCurrentUser();
      setCurrentUser(userResponse.data);

      return userResponse.data;
    } catch (err) {
      setError(err.message || "Failed to login");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearTokens();
    setCurrentUser(null);
    // Redirect to login page is handled by the axios interceptor in apiClient
  };

  // Registration function
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerApi(userData);
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to register");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Token refresh function
  const refreshUserToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await refreshApi(refreshToken);
      if (response.data.access_token) {
        setToken(response.data.access_token);
        return true;
      }
      return false;
    } catch (err) {
      clearTokens();
      setCurrentUser(null);
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      // This would call your API to update the user profile
      // const response = await updateUserProfile(profileData);
      // setCurrentUser({ ...currentUser, ...response.data });
      // For now, just update the current user state
      setCurrentUser({ ...currentUser, ...profileData });
      return true;
    } catch (err) {
      setError(err.message || "Failed to update profile");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return checkAuth() && !!currentUser;
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser ? checkAdmin(currentUser) : false;
  };

  // Auth context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    refreshUserToken,
    updateProfile,
    isAuthenticated,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
