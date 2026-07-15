const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:3000/api'
  : 'https://api.hopeforpawshub.co/api';

export const AUTH_BASE_URL = isLocalhost
  ? 'http://localhost:3000/auth'
  : 'https://api.hopeforpawshub.co/auth';

export const ADMIN_BASE_URL = isLocalhost
  ? 'http://localhost:3000/api/admin'
  : 'https://api.hopeforpawshub.co/api/admin';

export const API_ROUTES_BASE_URL = API_BASE_URL;

/** Socket.IO is local-only while the API runs on Lambda (use REST polling in production). */
export const SOCKET_ENABLED = isLocalhost;
