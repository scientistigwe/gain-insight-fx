import apiClient from "./client";

export const getProfitLoss = () => {
  return apiClient.get("/analytics/profit-loss");
};

export const getTransactionStatistics = () => {
  return apiClient.get("/analytics/transaction-stats");
};

export const getCurrencyPerformance = (days = 90) => {
  return apiClient.get(`/analytics/currency-performance?days=${days}`);
};

export const getOpportunities = () => {
  return apiClient.get("/analytics/opportunities");
};
