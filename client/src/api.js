// Small fetch helper. Server errors come back as { success: false, message } and are thrown as Error(message).
export const api = async (path, { method = "GET", body, token } = {}) => {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || "Request failed");
  return data;
};
