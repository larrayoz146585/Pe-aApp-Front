import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://pe-aapp-back.onrender.com'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

'http://192.168.1.158:8000/api'; 
