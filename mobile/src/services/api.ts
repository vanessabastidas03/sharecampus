import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Siempre usa la URL de producción para que funcione en dispositivos físicos y simuladores.
// Para desarrollo local con simulador cambia a 'http://localhost:3000'.
const BASE_URL = 'https://sharecampus.onrender.com';
const TOKEN_KEY = '@sharecampus_token';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// On 401, clear the stored token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export const saveToken = (token: string) => AsyncStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => AsyncStorage.removeItem(TOKEN_KEY);
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);

export default api;
