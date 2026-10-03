import api from "./axios";

// Login
export const loginUser = (email, password) => {
  return api.post("/auth/login", { email, password });
};

// Logout
export const logoutUser = () => {
  return api.post("/auth/logout");
};

// Get current user
export const getMe = () => {
  return api.get("/auth/me");
};

// Add HR (Admin only)
export const addHR = (email, password) => {
  return api.post("/auth/add-hr", { email, password });
};
