import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = 'https://pena-app-back.onrender.com/api';
//const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  let token: string | null = null;

  // --- DIAGNÓSTICO ---
  console.log(`📡 Petición saliendo hacia: ${config.url}`);
  console.log(`📱 Plataforma detectada: ${Platform.OS}`);

  if (Platform.OS === 'web') {
    // WEB: Leemos del localStorage
    token = localStorage.getItem('user_token');
    console.log("🔍 Token en LocalStorage (user_token):", token);

    // Si sale null, probamos con el otro nombre por si acaso
    if (!token) {
      const tokenAlternativo = localStorage.getItem('userToken');
      console.log("🔍 ¿Quizás estaba como 'userToken'?:", tokenAlternativo);
      if (tokenAlternativo) token = tokenAlternativo;
    }

  } else {
    // MÓVIL
    token = await SecureStore.getItemAsync('user_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ Token adjuntado correctamente.");
  } else {
    console.warn("⚠️ CUIDADO: Se está enviando la petición SIN TOKEN.");
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
