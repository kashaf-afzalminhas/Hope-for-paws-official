// Use localhost for dev, or set up for production as needed
export const API_BASE_URL = 'http://localhost:3000/api';
export const AUTH_BASE_URL = `${API_BASE_URL.replace('/api', '')}/auth`;
export const ADMIN_BASE_URL = `${API_BASE_URL.replace('/api', '')}/admin`;
