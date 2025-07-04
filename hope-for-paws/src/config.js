// Use environment variable for API URL, with deployed backend as fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hope-for-paws-official-backend.vercel.app';
// Remove /api from the end if it exists to get the base URL
const BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
export const AUTH_BASE_URL = `${BASE_URL}/auth`;
export const API_ROUTES_BASE_URL = `${BASE_URL}/api`;
