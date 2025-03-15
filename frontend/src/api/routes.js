/**
 * Unified API service for the Savings Tracker application.
 * This file provides methods to interact with all API endpoints.
 */
import apiClient from "./apiClient";

/**
 * Authentication services
 */
export const authService = {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @param {string} data.email - User email
   * @param {string} data.password - User password
   * @param {string} data.confirm_password - Password confirmation
   * @param {string} data.full_name - User's full name (optional)
   * @returns {Promise<Object>} - Registration response with tokens and user data
   */
  register: (data) => apiClient.post("/auth/register", data),

  /**
   * Login with email and password
   * @param {Object} data - Login credentials
   * @param {string} data.username - Email address (must be named 'username' for OAuth2)
   * @param {string} data.password - Password
   * @returns {Promise<Object>} - Authentication response with tokens and user data
   */
  login: (data) =>
    apiClient.post("/auth/login", new URLSearchParams(data), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }),

  /**
   * Refresh authentication token
   * @param {Object} data - Refresh data
   * @param {string} data.refresh_token - Refresh token
   * @returns {Promise<Object>} - New tokens
   */
  refreshToken: (data) => apiClient.post("/auth/refresh", data),

  /**
   * Request password reset
   * @param {Object} data - Reset request data
   * @param {string} data.email - User email
   * @returns {Promise<Object>} - Status response
   */
  requestPasswordReset: (data) => apiClient.post("/auth/reset-password", data),

  /**
   * Verify password reset and set new password
   * @param {Object} data - Password reset data
   * @param {string} data.oob_code - Out-of-band code (from email)
   * @param {string} data.new_password - New password
   * @returns {Promise<Object>} - Status response
   */
  verifyPasswordReset: (data) =>
    apiClient.post("/auth/verify-password-reset", data),
};

/**
 * User services
 */
export const userService = {
  /**
   * Get current user data
   * @returns {Promise<Object>} - User data
   */
  getCurrentUser: () => apiClient.get("/users/me"),

  /**
   * Update user profile
   * @param {Object} data - Profile update data
   * @returns {Promise<Object>} - Updated user data
   */
  updateProfile: (data) => apiClient.put("/users/me/profile", data),

  /**
   * Update user password
   * @param {Object} data - Password update data
   * @param {string} data.current_password - Current password
   * @param {string} data.new_password - New password
   * @param {string} data.confirm_password - New password confirmation
   * @returns {Promise<Object>} - Status response
   */
  updatePassword: (data) => apiClient.put("/users/me/password", data),

  /**
   * Get user wallets
   * @returns {Promise<Array>} - User wallets
   */
  getWallets: () => apiClient.get("/users/me/wallets"),
};

/**
 * Currency services
 */
export const currencyService = {
  /**
   * Get current exchange rates
   * @param {Object} params - Query parameters
   * @param {string} params.base_currency - Base currency code
   * @returns {Promise<Object>} - Current exchange rates
   */
  getCurrentRates: (params) =>
    apiClient.get("/currencies/rates/current", { params }),

  /**
   * Get historical exchange rates
   * @param {Object} params - Query parameters
   * @param {string} params.base_currency - Base currency code
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} - Historical exchange rates
   */
  getHistoricalRates: (params) =>
    apiClient.get("/currencies/rates/historical", { params }),

  /**
   * Get currency trends
   * @param {Object} params - Query parameters
   * @param {string} params.base_currency - Base currency code
   * @param {number} params.days - Number of days to analyze
   * @returns {Promise<Array>} - Currency trends
   */
  getCurrencyTrends: (params) =>
    apiClient.get("/currencies/trends", { params }),
};

/**
 * Transaction services
 */
export const transactionService = {
  /**
   * Get all transactions
   * @param {Object} params - Query parameters
   * @param {number} params.skip - Number of records to skip
   * @param {number} params.limit - Maximum number of records to return
   * @param {string} params.currency - Filter by currency
   * @param {string} params.type - Filter by transaction type
   * @returns {Promise<Array>} - Transactions
   */
  getTransactions: (params) => apiClient.get("/transactions/", { params }),

  /**
   * Create a new transaction
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} - Created transaction
   */
  createTransaction: (data) => apiClient.post("/transactions/", data),

  /**
   * Get transaction by ID
   * @param {string|number} id - Transaction ID
   * @returns {Promise<Object>} - Transaction details
   */
  getTransaction: (id) => apiClient.get(`/transactions/${id}`),

  /**
   * Delete a transaction
   * @param {string|number} id - Transaction ID
   * @returns {Promise<Object>} - Status response
   */
  deleteTransaction: (id) => apiClient.delete(`/transactions/${id}`),

  /**
   * Get wallet balances
   * @returns {Promise<Array>} - Wallet balances
   */
  getWallets: () => apiClient.get("/transactions/wallets/"),
};

/**
 * Alert services
 */
export const alertService = {
  /**
   * Get all alerts
   * @param {Object} params - Query parameters
   * @param {number} params.skip - Number of records to skip
   * @param {number} params.limit - Maximum number of records to return
   * @returns {Promise<Array>} - Alerts
   */
  getAlerts: (params) => apiClient.get("/alerts/", { params }),

  /**
   * Create a new alert
   * @param {Object} data - Alert data
   * @returns {Promise<Object>} - Created alert
   */
  createAlert: (data) => apiClient.post("/alerts/", data),

  /**
   * Get alert by ID
   * @param {string|number} id - Alert ID
   * @returns {Promise<Object>} - Alert details
   */
  getAlert: (id) => apiClient.get(`/alerts/${id}`),

  /**
   * Update an alert
   * @param {string|number} id - Alert ID
   * @param {Object} data - Alert update data
   * @returns {Promise<Object>} - Updated alert
   */
  updateAlert: (id, data) => apiClient.put(`/alerts/${id}`, data),

  /**
   * Delete an alert
   * @param {string|number} id - Alert ID
   * @returns {Promise<Object>} - Status response
   */
  deleteAlert: (id) => apiClient.delete(`/alerts/${id}`),
};

/**
 * Analytics services
 */
export const analyticsService = {
  /**
   * Get profit/loss analysis
   * @param {Object} params - Query parameters
   * @param {string} params.currency - Base currency
   * @param {string} params.period - Time period (e.g., '7d', '30d', '1y')
   * @returns {Promise<Object>} - Profit/loss data
   */
  getProfitLoss: (params) =>
    apiClient.get("/analytics/profit-loss", { params }),

  /**
   * Get transaction statistics
   * @param {Object} params - Query parameters
   * @param {string} params.period - Time period (e.g., '7d', '30d', '1y')
   * @returns {Promise<Object>} - Transaction statistics
   */
  getTransactionStats: (params) =>
    apiClient.get("/analytics/transaction-stats", { params }),

  /**
   * Get currency performance
   * @param {Object} params - Query parameters
   * @param {string} params.base_currency - Base currency
   * @param {number} params.days - Number of days to analyze
   * @returns {Promise<Object>} - Currency performance data
   */
  getCurrencyPerformance: (params) =>
    apiClient.get("/analytics/currency-performance", { params }),

  /**
   * Get investment opportunities
   * @returns {Promise<Array>} - Investment opportunities
   */
  getOpportunities: () => apiClient.get("/analytics/opportunities"),
};

/**
 * Admin services
 */
export const adminService = {
  /**
   * Get all users (admin only)
   * @param {Object} params - Query parameters
   * @param {number} params.skip - Number of records to skip
   * @param {number} params.limit - Maximum number of records to return
   * @returns {Promise<Array>} - Users
   */
  getUsers: (params) => apiClient.get("/admin/users", { params }),

  /**
   * Create a new user (admin only)
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Created user
   */
  createUser: (data) => apiClient.post("/admin/users", data),

  /**
   * Update a user (admin only)
   * @param {string} id - User ID
   * @param {Object} data - User update data
   * @returns {Promise<Object>} - Updated user
   */
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),

  /**
   * Delete a user (admin only)
   * @param {string} id - User ID
   * @returns {Promise<Object>} - Status response
   */
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  /**
   * Get audit logs (admin only)
   * @param {Object} params - Query parameters
   * @param {number} params.skip - Number of records to skip
   * @param {number} params.limit - Maximum number of records to return
   * @param {string} params.user_id - Filter by user ID
   * @param {string} params.action - Filter by action type
   * @param {string} params.entity_type - Filter by entity type
   * @returns {Promise<Array>} - Audit logs
   */
  getAuditLogs: (params) => apiClient.get("/admin/audit-logs", { params }),
};

// Export all services as a unified API
export default {
  auth: authService,
  user: userService,
  currency: currencyService,
  transaction: transactionService,
  alert: alertService,
  analytics: analyticsService,
  admin: adminService,
};
