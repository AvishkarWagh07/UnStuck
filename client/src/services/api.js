import axios from 'axios';
import { clearJwt, getJwt } from './sessionStore.js';

// fired when the server rejects a token, AuthContext listens and signs out
export const UNAUTHORIZED_EVENT = 'unstuck:unauthorized';

// one axios instance, /api gets proxied by vite to the express server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  // a step can take a while, the server retries gemini a few times
  timeout: 45000
});

api.interceptors.request.use((config) => {
  const jwt = getJwt();
  if (jwt) {
    config.headers.Authorization = 'Bearer ' + jwt;
  }
  return config;
});

// turn axios failures into a plain Error with a message the ui can show
function toReadableError(err) {
  let message = 'Something went wrong. Please try again.';
  let code = 'UNKNOWN';

  if (err.response && err.response.data && err.response.data.error) {
    message = err.response.data.error.message || message;
    code = err.response.data.error.code || code;
  } else if (err.code === 'ECONNABORTED') {
    message = 'The request took too long. Check your connection and try again.';
    code = 'TIMEOUT';
  } else if (!err.response) {
    message = 'Could not reach the server. Is the backend running?';
    code = 'NETWORK';
  }

  const readable = new Error(message);
  readable.status = err.response ? err.response.status : 0;
  readable.code = code;
  return readable;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearJwt();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(toReadableError(error));
  }
);

export default api;
