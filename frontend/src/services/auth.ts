import { api } from './api';

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  token: string;
  user: User;
}

export const login = async (credentials: { username: string; password?: string; role?: string }) => {
  const response = await api.post<{ data: LoginResponse }>('/auth/login', credentials);
  const { token, user } = response.data.data;
  
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return response.data.data;
};

export const register = async (credentials: { username: string; password?: string; role?: string }) => {
  const response = await api.post<{ data: LoginResponse }>('/auth/register', credentials);
  const { token, user } = response.data.data;
  
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return response.data.data;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};
