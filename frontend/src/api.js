const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function requestJSON(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.mensaje || data?.error || `Error HTTP ${res.status}`);
  return data;
}

export function getJSON(path) {
  return requestJSON(path);
}

export function postJSON(path, body) {
  return requestJSON(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function putJSON(path, body) {
  return requestJSON(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export function deleteJSON(path) {
  return requestJSON(path, {
    method: 'DELETE'
  });
}

export { API_URL };
