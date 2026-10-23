import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

export const TOKEN_STORAGE_KEY = 'miniledger_jwt_token';
export const USER_STORAGE_KEY = 'miniledger_user_data';

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT token if stored in SecureStore
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Could not read JWT from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors nicely
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const serverMessage = error.response?.data?.error;
    const fallbackMessage = error.message || 'Network request failed';
    const message = serverMessage || fallbackMessage;

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
