export const API = {
  userManagement: 'http://66.116.246.58:8080',
  product: 'http://66.116.246.58:8081',
  cart: 'http://66.116.246.58:8083',
  payment: 'http://66.116.246.58:8084',
  inventory: 'http://66.116.246.58:8085',
  doctor: 'http://66.116.246.58:8086',
} as const;

export type ApiServiceKey = keyof typeof API;

export const AUTH_TOKEN_KEY = 'authToken';
export const AUTH_USER_KEY = 'authUser';
