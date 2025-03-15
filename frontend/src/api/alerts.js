// api/alerts.js
import apiClient from "./client";

/**
 * Get user alerts
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Alerts
 */
export const getUserAlerts = (params = {}) => {
  return apiClient.get("/alerts/", { params });
};

/**
 * Get alert by ID
 * @param {string|number} id - Alert ID
 * @returns {Promise<Object>} - Alert data
 */
export const getAlert = (id) => {
  return apiClient.get(`/alerts/${id}`);
};

/**
 * Create new alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} - Created alert
 */
export const createAlert = (alertData) => {
  return apiClient.post("/alerts/", alertData);
};

/**
 * Update alert
 * @param {string|number} id - Alert ID
 * @param {Object} alertData - Alert update data
 * @returns {Promise<Object>} - Updated alert
 */
export const updateAlert = (id, alertData) => {
  return apiClient.put(`/alerts/${id}`, alertData);
};

/**
 * Delete alert
 * @param {string|number} id - Alert ID
 * @returns {Promise<Object>} - Response
 */
export const deleteAlert = (id) => {
  return apiClient.delete(`/alerts/${id}`);
};