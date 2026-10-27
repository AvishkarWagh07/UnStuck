import { createContext, useContext, useEffect, useState } from 'react';
import api, { UNAUTHORIZED_EVENT } from '../services/api.js';
import { clearJwt, setJwt } from '../services/sessionStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // cookie is the source of truth, ask the server once on load
  useEffect(() => {
    let alive = true;

    async function loadMe() {
      try {
        const res = await api.get('/auth/me');
        if (alive) setUser(res.data.user);
      } catch (err) {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, []);

  // any 401 anywhere signs the user out, the routes redirect themselves
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setJwt(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(displayName, email, password) {
    const res = await api.post('/auth/register', { displayName, email, password });
    setJwt(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // clear the local session even if logout fails
    }
    clearJwt();
    setUser(null);
  }

  // save on the server first, then update the page
  async function savePreferences(patch) {
    const res = await api.patch('/auth/preferences', patch);
    setUser(res.data.user);
    return res.data.user;
  }

  // flag on the root element, one css rule kills animations off
  useEffect(() => {
    const wantsStill = Boolean(user && user.preferences && user.preferences.reducedMotion);
    document.documentElement.classList.toggle('reduce-motion', wantsStill);
  }, [user]);

  const value = { user, loading, login, register, logout, savePreferences };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
