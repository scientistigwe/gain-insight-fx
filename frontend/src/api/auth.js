import apiClient from "./client";

// Authentication functions
export const login = (email, password) => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  return apiClient.post("/auth/login", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const register = (userData) => {
  return apiClient.post("/auth/register", userData);
};

export const refreshToken = (refreshToken) => {
  return apiClient.post("/auth/refresh", { refresh_token: refreshToken });
};

// Token management functions
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const setRefreshToken = (token) => {
  localStorage.setItem("refreshToken", token);
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const clearTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token; // Return true if token exists
};

export const isAdmin = (user) => {
  return user && user.is_admin === true;
};
