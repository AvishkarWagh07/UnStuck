const JWT_KEY = 'unstuck_token';

// server also sets this as an httpOnly cookie, this copy is for quick reloads

export function getJwt() {
  return localStorage.getItem(JWT_KEY);
}

export function setJwt(token) {
  if (token) localStorage.setItem(JWT_KEY, token);
}

export function clearJwt() {
  localStorage.removeItem(JWT_KEY);
}
