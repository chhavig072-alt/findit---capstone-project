// Thin Fetch wrapper. Access token lives in memory only; the refresh token is an
// httpOnly cookie handled by the browser. On a 401 we try one silent refresh.
let accessToken = null;
let onSessionLost = () => {};
let refreshing = null;

export const setOnSessionLost = (fn) => { onSessionLost = fn; };

export function refreshSession() {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) { accessToken = null; return null; }
        const data = await res.json();
        accessToken = data.accessToken;
        return data;
      })
      .catch(() => null)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export function setSession(data) { accessToken = data ? data.accessToken : null; }

async function request(path, { method = 'GET', body } = {}, retry = true) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    const data = await refreshSession();
    if (data) return request(path, { method, body }, false);
    onSessionLost();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body: body || {} }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};

export const CATEGORIES = [
  'Electronics', 'Books', 'ID Cards', 'Keys', 'Clothing',
  'Bags', 'Wallets', 'Accessories', 'Other',
];
