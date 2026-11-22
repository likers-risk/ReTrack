import { API_URL } from "./config";

/**
 * Small helper for calling the backend.
 * Returns { ok, status, data }. Throws only when the server can't be reached
 * (no internet, server asleep, etc.) so callers can fall back to offline mode.
 */
export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  return { ok: response.ok, status: response.status, data };
}

/** Turns a Laravel error response into one readable sentence. */
export function errorMessage(data, fallback = "Something went wrong.") {
  if (data && data.errors) {
    return Object.values(data.errors).flat().join(" ");
  }
  return (data && data.message) || fallback;
}

export const isAdmin = () => localStorage.getItem("role") === "Admin";

export const peso = (n) =>
  "₱" +
  (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Log out without wiping offline data that hasn't been synced yet. */
export function clearLogin() {
  ["authToken", "token", "username", "userId", "role", "storeName"].forEach((k) =>
    localStorage.removeItem(k)
  );
}
