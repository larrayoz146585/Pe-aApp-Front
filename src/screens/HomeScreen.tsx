import { useFocusEffect, useRouter } from 'expo-router'; // Importamos useFocusEffect
import React, { useCallback, useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  // Sacamos también la función refreshUser del contexto
  const { userInfo, logout, refreshUser } = useContext(AuthContext); 
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
      {/* BOTÓN SOLO PARA EL BARMAN (O si quieres probarlo tú) */}
      <TouchableOpacity 
        style={styles.adminButton} 
        onPress={() => router.push('/comanda')}
      >
        <Text style={styles.adminButtonText}>👨‍🍳 VER PEDIDOS(Solo socios)</Text>
      </TouchableOpacity>
      {/* BOTÓN DE ESTADÍSTICAS (Solo Admin) */}
      <TouchableOpacity 
        style={[styles.adminButton, { backgroundColor: '#5856D6', marginTop: 10 }]} 
        onPress={() => router.push('/estadisticas')}
      >
        <Text style={styles.adminButtonText}>📈 VER ESTADÍSTICAS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión </Text>
      </TouchableOpacity>
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
  adminButton: { backgroundColor: '#333', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#555' },
  adminButtonText: { color: '#ddd', fontSize: 18, fontWeight: 'bold' },
});