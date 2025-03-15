import axios from "axios";

// Use a default API URL if the environment variable isn't set
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1", // Replace with your actual backend URL
  headers: {
    "Content-Type": "application/json",
  },
  // Enable sending cookies with every request - critical for cookie auth
  withCredentials: true
});

// Modified interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;