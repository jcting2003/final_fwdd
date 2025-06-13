// frontend/src/api/auth.js

// Point at your auth service, not just "/api"
import { AUTH_API_BASE  } from '../config';

export async function signup({ username, email, password }) {
  const res = await fetch(`${AUTH_API_BASE }/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  });
  return res.json();
}

export async function login({ username, password }) {
  const res = await fetch(`${AUTH_API_BASE }/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${AUTH_API_BASE }/currentuser`, {
    method: 'GET',
    credentials: 'include'
  });
  if (res.status === 401) {
    // no session yet, swallow the 401
    return { user: null };
  }
  if (!res.ok) {
    // only throw on unexpected errors
    throw new Error(`Error ${res.status}`);
  }
  return res.json();  // { user: {...} }
}


export async function logout() {
  const res = await fetch(`${AUTH_API_BASE }/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  return res.json();
}
