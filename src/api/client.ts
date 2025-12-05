import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://gpu-compare-backend-production.up.railway.app/api/v1';
const ADMIN_TOKEN = process.env.REACT_APP_ADMIN_TOKEN || 'Enes_Super_Admin_Secret_93247';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (ADMIN_TOKEN) {
    config.headers = config.headers || {};
    (config.headers as any)['x-admin-token'] = ADMIN_TOKEN;
  }
  return config;
});
