import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { login as loginApi, register as registerApi } from "../api/auth";
import { getCurrentUser } from "../api/users";

/**
 * Custom hook to access and use authentication functionality
 * Provides login, logout, registration, and user management
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { currentUser, setCurrentUser, loading, setLoading, error, setError } =
    context;

  /**
   * Logs in a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - Resolves with user data or rejects with error
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginApi(email, password);

      // Get user data after successful login
      const userResponse = await getCurrentUser();
      setCurrentUser(userResponse.data);

      return userResponse.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to login. Please check your credentials.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the current user
   */
  const logout = () => {
    // Clear user data and auth tokens
    setCurrentUser(null);
  };

  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Resolves with success data or rejects with error
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerApi(userData);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Registration failed. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the current user's profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} - Resolves with updated user data
   */
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      // Implementation would depend on your API
      // const response = await updateUserProfileApi(profileData);
      // setCurrentUser({...currentUser, ...response.data});

      // For now, just update the state
      setCurrentUser({ ...currentUser, ...profileData });
      return { ...currentUser, ...profileData };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update profile.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checks if user is authenticated
   * @returns {boolean} Authentication status
   */
  const isAuthenticated = () => {
    return !!currentUser;
  };

  /**
   * Checks if user has admin privileges
   * @returns {boolean} Admin status
   */
  const isAdmin = () => {
    return currentUser?.is_admin === true;
  };

  return {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated,
    isAdmin,
  };
};

export default useAuth;
