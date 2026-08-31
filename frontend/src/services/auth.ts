import api from './api';

interface LoginResponse {
  access: string;
  refresh: string;
}

export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/usuarios/login/', { username, password }).then((res) => {
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return res.data;
  });

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};