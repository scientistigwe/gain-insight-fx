// api/transactions.js
import apiClient from "./client";

/**
 * Get user transactions
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Transactions
 */
export const getUserTransactions = (params = {}) => {
  return apiClient.get("/transactions/", { params });
};

/**
 * Get transaction by ID
 * @param {string|number} id - Transaction ID
 * @returns {Promise<Object>} - Transaction data
 */
export const getTransaction = (id) => {
  return apiClient.get(`/transactions/${id}`);
};

/**
 * Create new transaction
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} - Created transaction
 */
export const createTransaction = (transactionData) => {
  return apiClient.post("/transactions/", transactionData);
};

/**
 * Delete transaction
 * @param {string|number} id - Transaction ID
 * @returns {Promise<Object>} - Response
 */
export const deleteTransaction = (id) => {
  return apiClient.delete(`/transactions/${id}`);
};

/**
 * Get wallet balances
 * @returns {Promise<Array>} - Wallet balances
 */
export const getWallets = () => {
  return apiClient.get("/transactions/wallets/");
};
