import axios from 'axios';
import { AUTH_BASE_URL } from '../config';

const api = axios.create({
    baseURL: AUTH_BASE_URL,
    withCredentials: true,
});

export const googleAuth = (code) => api.post('/google', { code });