// api/users.js
import apiClient from "./client";

/**
 * Get current user profile
 * @returns {Promise<Object>} - User profile data
 */
export const getCurrentUser = () => {
  return apiClient.get("/users/me");
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserProfile = (profileData) => {
  return apiClient.put("/users/me/profile", profileData);
};

/**
 * Update user password
 * @param {Object} passwordData - Password update data
 * @returns {Promise<Object>} - Response
 */
export const updateUserPassword = (passwordData) => {
  return apiClient.put("/users/me/password", passwordData);
};

/**
 * Get user wallets
 * @returns {Promise<Array>} - User wallets
 */
export const getUserWallets = () => {
  return apiClient.get("/users/me/wallets");
};
