// src/config/env.ts
export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  ROOT_DOMAIN: import.meta.env.VITE_ROOT_DOMAIN || 'localhost',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'SchoolSaaS',
  NODE_ENV: import.meta.env.MODE,
};