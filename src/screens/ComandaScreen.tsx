import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alertHelper';

export default function ComandaScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refreshUser } = useContext(AuthContext);

  // Guardamos los IDs de los pedidos que ya conocemos para detectar nuevas comandas
  const pedidosIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarComandas = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const response = await api.get('/admin/pedidos');
      const nuevosPedidos: any[] = response.data;

      // Detectar si hay comandas NUEVAS que no teníamos antes
      if (!isFirstLoad.current) {
        const hayNuevas = nuevosPedidos.some(p => !pedidosIdsRef.current.has(p.id));
        if (hayNuevas) {
          // Vibración de alerta de nueva comanda
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      }

      // Actualizamos el set de IDs conocidos
      pedidosIdsRef.current = new Set(nuevosPedidos.map(p => p.id));
      isFirstLoad.current = false;

      setPedidos(nuevosPedidos);
    } catch (error: any) {
      if (!silencioso) {
        showAlert('Error', error.response?.data?.message || 'No puedes ver esto');
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // Auto-refresco cada 15 segundos mientras la pantalla está visible
  useFocusEffect(
    useCallback(() => {
      isFirstLoad.current = true;
      cargarComandas();

      intervalRef.current = setInterval(() => {
        cargarComandas(true); // silencioso: no muestra spinner
      }, 15000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [])
  );

  const marcarServido = async (idPedido: number) => {
    try {
      await api.put(`/pedidos/${idPedido}/servir`);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await Promise.all([cargarComandas(), refreshUser()]);
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
          await api.delete(`/admin/pedidos/${idPedido}`);
          showAlert('Éxito', 'El pedido ha sido cancelado.');
          cargarComandas();
        } catch (error: any) {
          showAlert('Error', error.response?.data?.message || 'No se pudo cancelar el pedido.');
        }
      }
    );
  };

  if (loading && pedidos.length === 0)
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍🍳 Comandas Pendientes</Text>

      {pedidos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>¡No hay nada nuevo para servir!</Text>
          <Text style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>
            Se actualiza automáticamente cada 15s
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => cargarComandas()} />}
          renderItem={({ item }) => {
            // Calcular total del pedido para mostrarlo en la comanda
            const totalPedido = parseFloat(item.total ?? 0).toFixed(2);

            return (
              <View style={styles.card}>
                <View style={styles.headerCard}>
                  <Text style={styles.mesa}>👤 {item.user.name}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.hora}>
                      {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                    </Text>
                    <Text style={styles.totalBadge}>{totalPedido} €</Text>
                  </View>
                </View>

                <View style={styles.listaBebidas}>
                  {item.detalles.map((detalle: any, index: number) => (
                    <Text key={index} style={styles.lineaBebida}>
                      {detalle.cantidad} x {detalle.bebida.nombre}
                      <Text style={styles.precioLinea}>
                        {' '}({(detalle.precio_unitario * detalle.cantidad).toFixed(2)} €)
                      </Text>
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
            );
          }}
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
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5,
  },
  mesa: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  hora: { fontSize: 16, color: '#666' },
  totalBadge: { fontSize: 18, fontWeight: 'bold', color: '#34C759', marginTop: 2 },
  listaBebidas: { marginBottom: 15 },
  lineaBebida: { fontSize: 18, marginVertical: 2, color: '#333' },
  precioLinea: { fontSize: 14, color: '#888' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  btnServir: {
    backgroundColor: '#34C759', padding: 15, borderRadius: 8,
    alignItems: 'center', flex: 1, marginLeft: 5,
  },
  btnCancelar: {
    backgroundColor: '#ff3b30', padding: 15, borderRadius: 8,
    alignItems: 'center', flex: 1, marginRight: 5,
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});
