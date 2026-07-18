const API_BASE = 'http://localhost:9080/api';

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

async function parseResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

export const finguardApi = {
  login: (body) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body)
    }).then(parseResponse),

  register: (body) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body)
    }).then(parseResponse),

  getProfile: (token) =>
    fetch(`${API_BASE}/auth/profile`, { headers: authHeaders(token) }).then(parseResponse),

  updateProfile: (token, body) =>
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  getDashboard: (token) =>
    fetch(`${API_BASE}/dashboard`, { headers: authHeaders(token) }).then(parseResponse),

  getStability: (token) =>
    fetch(`${API_BASE}/stability`, { headers: authHeaders(token) }).then(parseResponse),

  getIncomes: (token) =>
    fetch(`${API_BASE}/income`, { headers: authHeaders(token) }).then(parseResponse),

  addIncome: (token, body) =>
    fetch(`${API_BASE}/income`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  updateIncome: (token, id, body) =>
    fetch(`${API_BASE}/income/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  deleteIncome: (token, id) =>
    fetch(`${API_BASE}/income/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }).then(parseResponse),

  getExpenses: (token) =>
    fetch(`${API_BASE}/expense`, { headers: authHeaders(token) }).then(parseResponse),

  addExpense: (token, body) =>
    fetch(`${API_BASE}/expense`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  updateExpense: (token, id, body) =>
    fetch(`${API_BASE}/expense/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  deleteExpense: (token, id) =>
    fetch(`${API_BASE}/expense/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }).then(parseResponse),

  getFraudAlerts: (token) =>
    fetch(`${API_BASE}/fraud/alerts`, { headers: authHeaders(token) }).then(parseResponse),

  resolveFraudAlert: (token, id, status) =>
    fetch(`${API_BASE}/fraud/alerts/${id}/resolve?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
      headers: authHeaders(token)
    }).then(parseResponse),

  getNotifications: (token) =>
    fetch(`${API_BASE}/notifications`, { headers: authHeaders(token) }).then(parseResponse),

  markNotificationRead: (token, id) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: authHeaders(token)
    }).then(parseResponse),

  markAllNotificationsRead: (token) =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders(token)
    }).then(parseResponse),

  getAssets: (token) =>
    fetch(`${API_BASE}/networth/assets`, { headers: authHeaders(token) }).then(parseResponse),

  addAsset: (token, body) =>
    fetch(`${API_BASE}/networth/assets`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  deleteAsset: (token, id) =>
    fetch(`${API_BASE}/networth/assets/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }).then(parseResponse),

  getLiabilities: (token) =>
    fetch(`${API_BASE}/networth/liabilities`, { headers: authHeaders(token) }).then(parseResponse),

  addLiability: (token, body) =>
    fetch(`${API_BASE}/networth/liabilities`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  deleteLiability: (token, id) =>
    fetch(`${API_BASE}/networth/liabilities/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }).then(parseResponse),

  advisorChat: (token, body) =>
    fetch(`${API_BASE}/advisor/chat`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  getSavingsGoals: (token) =>
    fetch(`${API_BASE}/savings`, { headers: authHeaders(token) }).then(parseResponse),

  addSavingsGoal: (token, body) =>
    fetch(`${API_BASE}/savings`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body)
    }).then(parseResponse),

  contributeToSavingsGoal: (token, id, amount) =>
    fetch(`${API_BASE}/savings/${id}/contribute?amount=${amount}`, {
      method: 'POST',
      headers: authHeaders(token)
    }).then(parseResponse),

  deleteSavingsGoal: (token, id) =>
    fetch(`${API_BASE}/savings/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }).then(parseResponse)
};
