
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const api = async (path, { method = "GET", body, token } = {}) => {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};
