// Use environment variable for API URL, with deployed backend as fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hope-for-paws-official-backend.vercel.app/api';
export const AUTH_BASE_URL = `${API_BASE_URL.replace('/api', '')}/auth`;
export const ADMIN_BASE_URL = `${API_BASE_URL.replace('/api', '')}/admin`;
