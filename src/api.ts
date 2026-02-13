import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native'; // <--- IMPORTANTE: Importar esto

const API_URL = 'https://pena-app-back.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para añadir el token automáticamente
api.interceptors.request.use(async (config) => {
  let token;

  // --- LÓGICA HÍBRIDA (WEB vs MÓVIL) ---
  if (Platform.OS === 'web') {
    // Si estamos en el navegador, usamos localStorage
    token = localStorage.getItem('user_token');
  } else {
    // Si estamos en el móvil, usamos SecureStore
    token = await SecureStore.getItemAsync('user_token');
  }
  // -------------------------------------

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

