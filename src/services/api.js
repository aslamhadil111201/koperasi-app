const BASE_URL = 'http://localhost:8000/api';

// ── Helper ────────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('koperasi_token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const request = async (method, path, body = null) => {
  const options = { method, headers: headers() };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (username, password) => request('POST', '/login', { username, password }),
  logout: ()                   => request('POST', '/logout'),
  me:     ()                   => request('GET',  '/me'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => request('GET', '/dashboard'),
};

// ── Members ───────────────────────────────────────────────────────────────────
export const membersApi = {
  getAll:  ()           => request('GET',    '/members'),
  create:  (data)       => request('POST',   '/members', data),
  update:  (id, data)   => request('PUT',    `/members/${id}`, data),
  destroy: (id)         => request('DELETE', `/members/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll:  ()         => request('GET',    '/products'),
  create:  (data)     => request('POST',   '/products', data),
  update:  (id, data) => request('PUT',    `/products/${id}`, data),
  destroy: (id)       => request('DELETE', `/products/${id}`),
};

// ── Consignments ──────────────────────────────────────────────────────────────
export const consignmentsApi = {
  getAll:  ()         => request('GET',    '/consignments'),
  create:  (data)     => request('POST',   '/consignments', data),
  update:  (id, data) => request('PUT',    `/consignments/${id}`, data),
  destroy: (id)       => request('DELETE', `/consignments/${id}`),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll:  ()         => request('GET',    '/services'),
  create:  (data)     => request('POST',   '/services', data),
  update:  (id, data) => request('PUT',    `/services/${id}`, data),
  destroy: (id)       => request('DELETE', `/services/${id}`),
};

// ── Journal ───────────────────────────────────────────────────────────────────
export const journalApi = {
  getAll: ()     => request('GET',  '/journal'),
  create: (data) => request('POST', '/journal', data),
};

// ── Cash Loans ────────────────────────────────────────────────────────────────
export const cashLoansApi = {
  getAll:  ()              => request('GET',    '/cash-loans'),
  create:  (data)          => request('POST',   '/cash-loans', data),
  approve: (id)            => request('POST',   `/cash-loans/${id}/approve`),
  pay:     (id, amount)    => request('POST',   `/cash-loans/${id}/pay`, { amount }),
};

// ── Credit Goods ──────────────────────────────────────────────────────────────
export const creditGoodsApi = {
  getAll:  ()           => request('GET',  '/credit-goods'),
  create:  (data)       => request('POST', '/credit-goods', data),
  approve: (id)         => request('POST', `/credit-goods/${id}/approve`),
  pay:     (id, amount) => request('POST', `/credit-goods/${id}/pay`, { amount }),
};
