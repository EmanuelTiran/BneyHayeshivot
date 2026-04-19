// client/src/config.js
export const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://bneyhayeshivot.onrender.com"
    : "http://localhost:5000";