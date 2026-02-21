// src/screens/ComandaScreen.tsx

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alertHelper';

// 👇👇👇 ¡IMPORTANTE! TIENE QUE DECIR 'export default' 👇👇👇
export default function ComandaScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refreshUser } = useContext(AuthContext);

  const cargarComandas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/pedidos');
      setPedidos(response.data);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'No puedes ver esto');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarComandas();
    }, [])
  );

  const marcarServido = async (idPedido: number) => {
    try {
      await api.put(`/pedidos/${idPedido}/servir`);
      // Usamos Promise.all para lanzar ambas actualizaciones en paralelo y
      // asegurarnos de que la interfaz esté lo más sincronizada posible.
      await Promise.all([
        cargarComandas(), // Recarga la lista de comandas pendientes
        refreshUser()     // Recarga la información del usuario actual (el barman)
      ]);
    } catch (error) {
      showAlert('Error', 'No se pudo marcar como servido');
    }
  };

  const cancelarPedido = (idPedido: number) => {
    showConfirm(
      '¿Cancelar Pedido?',
      'Esta acción eliminará el pedido de la lista. ¿Estás seguro?',
      async () => {
        try {
          // NOTA: Asumo que tu API tiene una ruta DELETE /admin/pedidos/{id} para borrar un pedido.
          // Si la ruta es diferente, ajústala aquí.
          await api.delete(`/admin/pedidos/${idPedido}`);
          showAlert('Éxito', 'El pedido ha sido cancelado.');
          cargarComandas(); // Recarga la lista de comandas
        } catch (error: any) {
          showAlert('Error', error.response?.data?.message || 'No se pudo cancelar el pedido.');
        }
      }
    );
  };

  if (loading && pedidos.length === 0) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍🍳 Comandas Pendientes</Text>

      {pedidos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>¡No hay nada nuevo para servir!</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarComandas} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerCard}>
                <Text style={styles.mesa}>👤 {item.user.name}</Text>
                <Text style={styles.hora}>{new Date(item.created_at).toLocaleTimeString().slice(0, 5)}</Text>
              </View>
              <View style={styles.listaBebidas}>
                {item.detalles.map((detalle: any, index: number) => (
                  <Text key={index} style={styles.lineaBebida}>
                    {detalle.cantidad} x {detalle.bebida.nombre}
                  </Text>
                ))}
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.btnCancelar}
                  onPress={() => cancelarPedido(item.id)}
                >
                  <Text style={styles.btnText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnServir}
                  onPress={() => marcarServido(item.id)}
                >
                  <Text style={styles.btnText}>✅ SERVIDO</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#333', paddingTop: 50, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: 'white' },
  emptyText: { fontSize: 22, color: 'white', fontWeight: 'bold', marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 15 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  mesa: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  hora: { fontSize: 16, color: '#666' },
  listaBebidas: { marginBottom: 15 },
  lineaBebida: { fontSize: 18, marginVertical: 2 },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnServir: { backgroundColor: '#34C759', padding: 15, borderRadius: 8, alignItems: 'center', flex: 1, marginLeft: 5 },
  btnCancelar: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});
