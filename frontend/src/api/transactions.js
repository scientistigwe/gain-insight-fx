import apiClient from "./client";

export const getUserTransactions = () => {
  return apiClient.get("/transactions/");
};

export const getTransaction = (id) => {
  return apiClient.get(`/transactions/${id}`);
};

export const createTransaction = (transactionData) => {
  return apiClient.post("/transactions/", transactionData);
};

export const deleteTransaction = (id) => {
  return apiClient.delete(`/transactions/${id}`);
};
