
const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:3000/api'
  : 'https://api.hopeforpaws.club/api';

export const AUTH_BASE_URL = isLocalhost
  ? 'http://localhost:3000/auth'
  : 'https://api.hopeforpaws.club/auth';

export const ADMIN_BASE_URL = isLocalhost
  ? 'http://localhost:3000/api/admin'
  : 'https://api.hopeforpaws.club/api/admin';
export const API_ROUTES_BASE_URL = API_BASE_URL;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "495806156812-uqmc0tenm7i0ljnjdo3ick68d3v053sl.apps.googleusercontent.com";

