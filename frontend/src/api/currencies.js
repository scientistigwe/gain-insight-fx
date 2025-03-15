import apiClient from "./client";

/**
 * Get current exchange rates
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Current rates
 */
export const getCurrentRates = (params = {}) => {
  return apiClient.get("/currencies/rates/current", { params });
};

/**
 * Get historical exchange rates
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Historical rates
 */
export const getHistoricalRates = (params = {}) => {
  return apiClient.get("/currencies/rates/historical", { params });
};

/**
 * Get currency trends
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Currency trends
 */
export const getCurrencyTrends = (params = {}) => {
  return apiClient.get("/currencies/trends", { params });
};

/**
 * Alias for getCurrencyTrends to maintain backward compatibility
 * @param {string} currencyCode - Currency code
 * @param {number} days - Number of days
 * @returns {Promise<Array>} - Currency trends
 */
export const getTrends = (currencyCode, days = 30) => {
  return apiClient.get(
    `/currencies/trends?currency_code=${currencyCode}&days=${days}`
  );
};
