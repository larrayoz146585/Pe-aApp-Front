import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Platform } from 'react-native'; 
import api from '../api'; // Asegúrate de que la ruta a api.ts es correcta

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // 🛠️ FUNCIONES AUXILIARES (Para que funcione en Web y Móvil)
  // ==========================================
  
  const saveStorage = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  };

  const getStorage = async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  };

  const removeStorage = async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  };

  // ==========================================
  // 🔄 LÓGICA DE SESIÓN
  // ==========================================

  const checkLoginStatus = async () => {
    try {
      const token = await getStorage('user_token');
      const user = await getStorage('user_info');
      
      if (token && user) {
        // Configuramos axios con el token recuperado
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUserToken(token);
        setUserInfo(JSON.parse(user));
      }
    } catch (e) {
      console.log('Error recuperando sesión:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  // ==========================================
  // 🚀 ACCIONES (Login, Register, Logout...)
  // ==========================================

  const login = async (name: string, password: string) => {
    try {
      const response = await api.post('/login', { name, password });
      const { access_token, user } = response.data;
      await guardarSesion(access_token, user);
    } catch (error: any) {
      console.log("Login error:", error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (name: string, password: string) => {
    try {
      const response = await api.post('/register', { name, password });
      const { access_token, user } = response.data;
      await guardarSesion(access_token, user);
    } catch (error: any) {
      console.log("Register error:", error.response?.data);
      throw error;
    }
  };

  const guardarSesion = async (token: string, user: any) => {
    // 1. Actualizamos estado
    setUserToken(token);
    setUserInfo(user);
    
    // 2. Configuramos Axios para futuras peticiones
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3. Guardamos en disco (o localStorage)
    await saveStorage('user_token', token);
    await saveStorage('user_info', JSON.stringify(user));
  };

  const logout = async () => {
    setUserToken(null);
    setUserInfo(null);
    api.defaults.headers.common['Authorization'] = ''; // Limpiamos cabecera
    await removeStorage('user_token');
    await removeStorage('user_info');
  };

  // --- FUNCIÓN BLINDADA ANT-ZOMBIES 🧟 ---
  const refreshUser = async () => {
    try {
        console.log("🔄 Actualizando datos del usuario...");
        const response = await api.get('/me'); 
        
        // Si llegamos aquí, el token es bueno
        const userActualizado = response.data;
        setUserInfo(userActualizado);
        await saveStorage('user_info', JSON.stringify(userActualizado));
        
    } catch (error: any) {
        console.log("❌ Error refrescando usuario", error);

        // Si el error es 401, el token ha caducado -> Cerramos sesión
        if (error.response && error.response.status === 401) {
            console.log("🔒 El token ha caducado. Cerrando sesión...");
            await logout(); 
        }
    }
  };

  return (
    <AuthContext.Provider value={{ login, register, logout, refreshUser, userToken, userInfo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
