import axios from 'axios';
import { requestInterceptor, responseInterceptor, responseErrorInterceptor } from './interceptors';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
apiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
export default apiClient;
