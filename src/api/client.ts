import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';
const ADMIN_TOKEN = process.env.REACT_APP_ADMIN_TOKEN;

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
