import apiClient from "./client";

/**
 * Login with credentials
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} - Login response with user data
 */
export const login = (credentials) => {
  // Map email to username as expected by the OAuth2 backend
  const formData = {
    username: credentials.email, // Map email to username
    password: credentials.password,
    grant_type: "password", // Required for OAuth2
  };

  return apiClient.post("/auth/login", new URLSearchParams(formData), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

/**
 * Register a new user
 * @param {Object} data - Registration data
 * @returns {Promise<Object>} - Registration response
 */
export const register = (data) => {
  return apiClient.post("/auth/register", data);
};

/**
 * Refresh authentication token
 * @returns {Promise<Object>} - New token response
 */
export const refreshToken = () => {
  return apiClient.post("/auth/refresh");
};

/**
 * Logout the user by clearing cookies
 * @returns {Promise<Object>} - Logout response
 */
export const logout = () => {
  return apiClient.post("/auth/logout");
};

/**
 * Request password reset
 * @param {Object} data - Password reset request data
 * @returns {Promise<Object>} - Response
 */
export const requestPasswordReset = (data) => {
  return apiClient.post("/auth/reset-password", data);
};

/**
 * Confirm password reset
 * @param {Object} data - Password reset confirmation data
 * @returns {Promise<Object>} - Response
 */
export const confirmPasswordReset = (data) => {
  return apiClient.post("/auth/verify-password-reset", data);
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - Promise resolving to authentication status
 */
export const isAuthenticated = async () => {
  try {
    await apiClient.get("/auth/verify");
    return true;
  } catch (error) {
    // Check if the error is due to being unauthorized
    if (error.response && error.response.status === 401) {
      return false;
    }
    // For other errors, log them but still return false
    console.error("Auth verification error:", error);
    return false;
  }
};

/**
 * Check if user is an admin
 * @param {Object} user - User object
 * @returns {boolean} - True if admin, false otherwise
 */
export const isAdmin = (user) => {
  return user && user.is_superuser === true;
};
