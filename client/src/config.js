// config.js
export const API_URL =
  import.meta.env.MODE === "production"
    ? "https://bneyhayeshivot.onrender.com"
    : "http://localhost:5000";