import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import api from '../api';

// Añadimos refreshUser al tipo del contexto
export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await getStorage('user_token');
      const user = await getStorage('user_info');
      
      if (token && user) {
        // 1. Antes de nada, le damos el token a Axios para probarlo
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
            // 2. Hacemos una prueba rápida al servidor (endpoint /me o cualquiera protegido)
            // Si el servidor dice "401" (token malo), esto fallará y saltará al catch de abajo.
            await api.get('/me'); 
            
            // 3. SI LLEGAMOS AQUÍ, el token es bueno. ¡Adentro!
            setUserToken(token);
            setUserInfo(JSON.parse(user));
            
        } catch (apiError) {
            console.log("🧟 Token Zombie detectado (Antiguo o Inválido). Borrando...");
            // El token no vale, así que lo matamos para que no vuelva a entrar
            await removeStorage('user_token');
            await removeStorage('user_info');
            setUserToken(null);
            setUserInfo(null);
        }
      }
    } catch (e) {
      console.log('Error general recuperando sesión', e);
    }
    // Terminamos de cargar (sea login exitoso o fallido)
    setIsLoading(false);
  };

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

  // --- NUEVA FUNCIÓN: RECARGAR USUARIO ---
  const refreshUser = async () => {
    try {
        console.log("🔄 Pidiendo saldo actualizado al servidor...");
        
        const response = await api.get('/me'); 
        console.log("✅ RESPUESTA DEL SERVIDOR:", response.data); // <--- ESTO ES LO IMPORTANTE
        
        const userActualizado = response.data;
        
        // Actualizamos el estado
        setUserInfo(userActualizado);
        await SecureStore.setItemAsync('user_info', JSON.stringify(userActualizado));
        
    } catch (error) {
        console.log("❌ Error refrescando usuario", error);
    }
  };
  // ----------------------------------------

  const guardarSesion = async (token: string, user: any) => {
    setUserToken(token);
    setUserInfo(user);
    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_info', JSON.stringify(user));
  };

  const logout = async () => {
    setUserToken(null);
    setUserInfo(null);
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_info');
  };

  return (
    // ¡Asegúrate de incluir refreshUser aquí abajo! 👇
    <AuthContext.Provider value={{ login, register, logout, refreshUser, userToken, userInfo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
