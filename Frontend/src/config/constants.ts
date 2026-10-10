// src/config/constants.ts
export const APP_NAME = 'SchoolSaaS';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  FORBIDDEN: '/forbidden',
  NOT_FOUND: '/404',
} as const;

export const QUERY_KEYS = {
  AUTH: 'auth',
  ME: 'me',
  SCHOOLS: 'schools',
  STUDENTS: 'students',
  FEES: 'fees',
  ATTENDANCE: 'attendance',
  EXAMS: 'exams',
  ROLES: 'roles',
  USERS: 'users',
} as const;