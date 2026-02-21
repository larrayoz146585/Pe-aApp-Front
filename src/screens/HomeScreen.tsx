import { useFocusEffect, useRouter } from 'expo-router'; // Importamos useFocusEffect
import React, { useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  // Sacamos también la función refreshUser del contexto
  const { userInfo, logout, refreshUser } = useContext(AuthContext);
  const [adminMenuVisible, setAdminMenuVisible] = useState(false);
  const router = useRouter();

  // ESTO ES LA MAGIA: 
  // Se ejecuta cada vez que la pantalla vuelve a estar visible
  useFocusEffect(
    useCallback(() => {
      refreshUser(); // Actualiza el saldo
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* BOTÓN DE ICONO DE MENÚ (Solo Admins) */}
      {userInfo?.role === 'superadmin' && (
        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => setAdminMenuVisible(true)}
        >
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.emoji}>🍻</Text>
      <Text style={styles.greeting}>¡Aupa, {userInfo?.name}!</Text>

      {/* Tarjeta de Saldo */}
      <View style={styles.card}>
        <Text style={styles.saldoTitle}>Tu Saldo Actual </Text>

        {/* VAMOS A IMPRIMIRLO SIN FILTROS PARA VER QUÉ PASA */}
        <Text style={[styles.saldo, { color: 'blue' }]}>
          {userInfo?.saldo} €
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bigButton}
        onPress={() => router.push('/carta')}
      >
        <Text style={styles.bigButtonText}>🍺 PEDIR A MI SOCIO</Text>
      </TouchableOpacity>

      {/* BOTONES DE ACCIONES DE ADMIN */}
      {userInfo?.role !== 'cliente' && (
        <>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/comanda')}
          >
            <Text style={styles.adminButtonText}>👨‍🍳 VER PEDIDOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: '#5856D6' }]}
            onPress={() => router.push('/estadisticas')}
          >
            <Text style={styles.adminButtonText}>📈 VER ESTADÍSTICAS</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión </Text>
      </TouchableOpacity>

      {/* --- MODAL DEL MENÚ DE ADMINISTRACIÓN --- */}
      {userInfo?.role === 'superadmin' && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={adminMenuVisible}
          onRequestClose={() => setAdminMenuVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setAdminMenuVisible(false)}>
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Opciones de Admin</Text>

              {userInfo?.role === 'superadmin' && (
                <>
                  <TouchableOpacity style={styles.menuButton} onPress={() => { setAdminMenuVisible(false); router.push('/gestion-usuarios'); }}>
                    <Text style={styles.menuButtonText}>👥 Gestionar Usuarios</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.menuButton, { backgroundColor: '#17a2b8' }]} onPress={() => { setAdminMenuVisible(false); router.push('/gestion-bebidas'); }}>
                    <Text style={styles.menuButtonText}>🍹 Gestionar Bebidas</Text>
                  </TouchableOpacity>
                </>
              )}



              {/* Botón para cerrar el menú */}
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: '#6c757d', marginTop: 20 }]}
                onPress={() => setAdminMenuVisible(false)}
              >
                <Text style={styles.menuButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  emoji: { fontSize: 50, marginBottom: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 15, width: '100%', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 30 },
  saldoTitle: { fontSize: 16, color: '#888' },
  saldo: { fontSize: 40, fontWeight: 'bold', marginTop: 10 },
  bigButton: { backgroundColor: '#34C759', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20, elevation: 5 },
  bigButtonText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  logoutButton: { padding: 10 },
  logoutText: { color: 'red', fontSize: 16 },
  adminButton: { backgroundColor: '#FF9500', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  adminButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Icono de menú hamburguesa
  menuIcon: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  menuIconText: {
    fontSize: 30,
    color: '#333',
  },
  // Estilos para el Modal y Menú
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { backgroundColor: 'white', borderRadius: 20, padding: 25, width: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  menuTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  menuButton: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  menuButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});