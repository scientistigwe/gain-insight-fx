import apiClient from "./client";

/**
 * Get profit/loss analysis
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Profit/loss data
 */
export const getProfitLoss = (params = {}) => {
  return apiClient.get("/analytics/profit-loss", { params });
};

/**
 * Get transaction statistics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Transaction statistics
 */
export const getTransactionStats = (params = {}) => {
  return apiClient.get("/analytics/transaction-stats", { params });
};

/**
 * Alias for getTransactionStats to maintain backward compatibility
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Transaction statistics
 */
export const getTransactionStatistics = (params = {}) => {
  return getTransactionStats(params);
};

/**
 * Get currency performance
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Currency performance data
 */
export const getCurrencyPerformance = (params = {}) => {
  return apiClient.get("/analytics/currency-performance", { params });
};

/**
 * Get investment opportunities
 * @returns {Promise<Array>} - Investment opportunities
 */
export const getOpportunities = () => {
  return apiClient.get("/analytics/opportunities");
};
