import { useFocusEffect } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alertHelper';

export default function EstadisticasScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useContext(AuthContext);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/estadisticas');
      setData(response.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudieron cargar los datos. Comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const borrarHistorial = () => {
    showConfirm(
      '⚠️ ¿Estás seguro?',
      'Esto borrará TODOS los pedidos y el historial de ventas. No se puede deshacer.',
      async () => {
        try {
          await api.delete('/admin/reset-pedidos');
          await Promise.all([cargarDatos(), refreshUser()]);
          showAlert('🧹 Limpieza completada', 'Se ha borrado todo el historial y los saldos se han reiniciado a 0.');
        } catch {
          showAlert('Error', 'No se pudo borrar el historial');
        }
      }
    );
  };

  if (loading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  // Pantalla de error con botón reintentar
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={cargarDatos}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos y cuenta final</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarDatos} />}
      >
        {/* SECCIÓN A: RANKING DE BEBIDAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Ranking de Bebidas</Text>
          <View style={styles.table}>
            {data?.resumen.map((item: any, index: number) => (
              <View key={index} style={styles.row}>
                <Text style={styles.rowName}>{index + 1}. {item.nombre}</Text>
                <Text style={styles.rowValue}>{item.total_vendido} uds.</Text>
              </View>
            ))}
            {(!data?.resumen || data?.resumen.length === 0) && (
              <Text style={styles.emptyText}>Nada servido aún 🤷‍♂️</Text>
            )}
          </View>
        </View>

        {/* SECCIÓN B: CUENTAS POR CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 Cuentas por Persona</Text>

          {data?.historial.map((cliente: any) => (
            <View key={cliente.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.user}>👤 {cliente.nombre}</Text>
                <Text style={styles.totalPrice}>{cliente.total_gastado} €</Text>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={{ fontSize: 12, color: '#999', marginBottom: 5 }}>Ha consumido:</Text>
                {Object.entries(cliente.bebidas).map(([nombreBebida, cantidad]: any, index) => (
                  <Text key={index} style={styles.detail}>• {cantidad} x {nombreBebida}</Text>
                ))}
              </View>
            </View>
          ))}

          {(!data?.historial || data?.historial.length === 0) && (
            <Text style={styles.emptyText}>No has servido nada a nadie... todavía.</Text>
          )}
        </View>

        {/* SECCIÓN C: BOTÓN DEL PÁNICO */}
        {data?.historial?.length > 0 && (
          <TouchableOpacity style={styles.dangerButton} onPress={borrarHistorial}>
            <Text style={styles.dangerText}>🗑️ BORRAR TODOS LOS PEDIDOS</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50, paddingHorizontal: 15 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },

  errorEmoji: { fontSize: 50, marginBottom: 15 },
  errorText: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#555', marginLeft: 5 },
  emptyText: { textAlign: 'center', color: '#999', padding: 10 },

  table: {
    backgroundColor: 'white', borderRadius: 12, padding: 15,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rowName: { fontSize: 16, color: '#333', fontWeight: '500' },
  rowValue: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },

  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  user: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30' },
  detailsContainer: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  detail: { fontSize: 14, color: '#555', marginVertical: 2 },

  dangerButton: {
    backgroundColor: '#dc3545', padding: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
  },
  dangerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
