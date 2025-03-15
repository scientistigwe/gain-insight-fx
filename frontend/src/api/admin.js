// api/admin.js
import apiClient from "./client";

/**
 * Get all users (admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Users
 */
export const getUsers = (params = {}) => {
  return apiClient.get("/admin/users", { params });
};

/**
 * Create new user (admin only)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
export const createUser = (userData) => {
  return apiClient.post("/admin/users", userData);
};

/**
 * Update user (admin only)
 * @param {string|number} id - User ID
 * @param {Object} userData - User update data
 * @returns {Promise<Object>} - Updated user
 */
export const updateUser = (id, userData) => {
  return apiClient.put(`/admin/users/${id}`, userData);
};

/**
 * Delete user (admin only)
 * @param {string|number} id - User ID
 * @returns {Promise<Object>} - Response
 */
export const deleteUser = (id) => {
  return apiClient.delete(`/admin/users/${id}`);
};

/**
 * Get audit logs (admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Audit logs
 */
export const getAuditLogs = (params = {}) => {
  return apiClient.get("/admin/audit-logs", { params });
};
