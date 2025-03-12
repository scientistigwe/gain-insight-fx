import apiClient from "./client";

export const getUserAlerts = () => {
  return apiClient.get("/alerts/");
};

export const getAlert = (id) => {
  return apiClient.get(`/alerts/${id}`);
};

export const createAlert = (alertData) => {
  return apiClient.post("/alerts/", alertData);
};

export const updateAlert = (id, alertData) => {
  return apiClient.put(`/alerts/${id}`, alertData);
};

export const deleteAlert = (id) => {
  return apiClient.delete(`/alerts/${id}`);
};
