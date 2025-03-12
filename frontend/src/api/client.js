import axios from "axios";
import { getToken, clearTokens } from "./auth";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle token expiration
      clearTokens();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
