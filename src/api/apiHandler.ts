import axios from "axios";

// Create Axios instance with default config
export const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  baseURL:
    import.meta.env.VITE_API_URL || "https://relayer-server.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (optional: add token if we were storing it in a variable,
// but we'll likely handle auth via headers automatically or explicit injection)
// For now, let's keep it simple.

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error format
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);
