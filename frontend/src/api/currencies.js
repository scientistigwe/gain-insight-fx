import apiClient from "./client";

export const getCurrentRates = () => {
  return apiClient.get("/currencies/rates/current");
};

export const getHistoricalRates = (currencyCode, days = 30) => {
  return apiClient.get(
    `/currencies/rates/historical?currency_code=${currencyCode}&days=${days}`
  );
};

export const getTrends = (currencyCode, days = 30) => {
  return apiClient.get(
    `/currencies/trends?currency_code=${currencyCode}&days=${days}`
  );
};
