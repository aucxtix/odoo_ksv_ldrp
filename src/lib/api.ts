/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple client-side API helper pointing to server proxy endpoints

const TOKEN_KEY = 'vendorbridge_session_token';

export const authHelper = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = authHelper.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  
  if (response.status === 401) {
    // Session expired or unauthorized
    authHelper.clearToken();
    if (url !== '/api/auth/me') {
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  return response;
}

export async function apiGet(url: string) {
  const r = await apiFetch(url);
  return r.json();
}

export async function apiPost(url: string, data: any) {
  const r = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiPut(url: string, data: any) {
  const r = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiPatch(url: string, data: any) {
  const r = await apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiDelete(url: string) {
  const r = await apiFetch(url, {
    method: 'DELETE',
  });
  return r.json();
}
