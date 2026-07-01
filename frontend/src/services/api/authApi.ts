import apiClient from './apiClient';

export const authApi = {
  register: async (payload: any) => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },

  login: async (payload: any) => {
    const res = await apiClient.post('/auth/login', payload);
    return res.data;
  },

  verifyEmail: async (token: string) => {
    const res = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (payload: any) => {
    const res = await apiClient.post('/auth/reset-password', payload);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  }
};
