import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  const { userInfo, logout, refreshUser } = useContext(AuthContext);
  const [adminMenuVisible, setAdminMenuVisible] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  const saldo = parseFloat(userInfo?.saldo ?? '0');
  const saldoColor = saldo > 0 ? '#34C759' : saldo < 0 ? '#FF3B30' : '#888';

  return (
    <View style={styles.container}>
      {/* Botón menú hamburguesa (Solo SuperAdmin) */}
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
        <Text style={styles.saldoTitle}>Tu Saldo Actual</Text>
        <Text style={[styles.saldo, { color: saldoColor }]}>
          {saldo.toFixed(2)} €
        </Text>
      </View>

      {/* Botón principal: pedir */}
      <TouchableOpacity
        style={styles.bigButton}
        onPress={() => router.push('/carta')}
      >
        <Text style={styles.bigButtonText}>🍺 PEDIR A MI SOCIO</Text>
      </TouchableOpacity>

      {/* Mi Cuenta: todos lo ven */}
      <TouchableOpacity
        style={styles.miCuentaButton}
        onPress={() => router.push('/mi-cuenta')}
      >
        <Text style={styles.adminButtonText}>🧾 MI CUENTA</Text>
      </TouchableOpacity>

      {/* Elegir camareros: solo clientes */}
      {userInfo?.role === 'cliente' && (
        <TouchableOpacity
          style={styles.camarerosButton}
          onPress={() => router.push('/elegir-camareros')}
        >
          <Text style={styles.adminButtonText}>🍺 MIS CAMAREROS</Text>
        </TouchableOpacity>
      )}

      {/* Botones Admin */}
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
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Modal menú SuperAdmin */}
      {userInfo?.role === 'superadmin' && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={adminMenuVisible}
          onRequestClose={() => setAdminMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setAdminMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Opciones de Admin</Text>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => { setAdminMenuVisible(false); router.push('/gestion-usuarios'); }}
              >
                <Text style={styles.menuButtonText}>👥 Gestionar Usuarios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: '#17a2b8' }]}
                onPress={() => { setAdminMenuVisible(false); router.push('/gestion-bebidas'); }}
              >
                <Text style={styles.menuButtonText}>🍹 Gestionar Bebidas</Text>
              </TouchableOpacity>

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
  card: {
    backgroundColor: 'white', padding: 30, borderRadius: 15, width: '100%',
    alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 5, marginBottom: 30,
  },
  saldoTitle: { fontSize: 16, color: '#888' },
  saldo: { fontSize: 40, fontWeight: 'bold', marginTop: 10 },
  bigButton: {
    backgroundColor: '#34C759', width: '100%', padding: 20, borderRadius: 15,
    alignItems: 'center', marginBottom: 10, elevation: 5,
  },
  bigButtonText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  miCuentaButton: {
    backgroundColor: '#007AFF', width: '100%', padding: 15, borderRadius: 15,
    alignItems: 'center', marginBottom: 10,
  },
  camarerosButton: {
    backgroundColor: '#FF9500', width: '100%', padding: 15, borderRadius: 15,
    alignItems: 'center', marginBottom: 10,
  },
  adminButton: {
    backgroundColor: '#FF9500', width: '100%', padding: 15, borderRadius: 15,
    alignItems: 'center', marginBottom: 10,
  },
  adminButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { padding: 10, marginTop: 10 },
  logoutText: { color: 'red', fontSize: 16 },
  menuIcon: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  menuIconText: { fontSize: 30, color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: {
    backgroundColor: 'white', borderRadius: 20, padding: 25, width: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  menuTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  menuButton: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  menuButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
