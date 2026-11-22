// Where the backend (Laravel API) lives.
// On your laptop this is http://localhost:8000.
// Online, set VITE_API_URL to your backend's web address (e.g. on Vercel).
export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
