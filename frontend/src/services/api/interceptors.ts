import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { tokenManager } from './tokenManager';

export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = tokenManager.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const responseInterceptor = (response: AxiosResponse) => {
  return response;
};

export const responseErrorInterceptor = async (error: AxiosError) => {
  if (error.response && error.response.status === 401) {
    const requestUrl = error.config?.url;
    // Do not trigger automatic logout if the failure happens during login credential verification
    if (requestUrl && !requestUrl.includes('/auth/login')) {
      tokenManager.clear();
      useAuthStore.getState().logout();
    }
  }
  return Promise.reject(error);
};
