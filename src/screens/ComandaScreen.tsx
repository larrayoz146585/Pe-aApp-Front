// src/screens/ComandaScreen.tsx

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../api';

// 👇👇👇 ¡IMPORTANTE! TIENE QUE DECIR 'export default' 👇👇👇
export default function ComandaScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  
  // ... (el resto del código que te pasé antes) ...
  // Si quieres te lo vuelvo a pegar entero abajo para asegurar.
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarComandas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/pedidos');
      setPedidos(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No puedes ver esto');
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
      cargarComandas(); 
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar como servido');
    }
  };

  if (loading && pedidos.length === 0) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF"/></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍🍳 Comandas Pendientes</Text>

      {pedidos.length === 0 ? (
        <View style={styles.center}>
            <Text style={styles.emptyText}>¡Todo servido! 🎉</Text>
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
                    <Text style={styles.hora}>{new Date(item.created_at).toLocaleTimeString().slice(0,5)}</Text>
                </View>
                <View style={styles.listaBebidas}>
                    {item.detalles.map((detalle: any, index: number) => (
                        <Text key={index} style={styles.lineaBebida}>
                            {detalle.cantidad} x {detalle.bebida.nombre}
                        </Text>
                    ))}
                </View>
                <TouchableOpacity 
                    style={styles.btnServir} 
                    onPress={() => marcarServido(item.id)}
                >
                    <Text style={styles.btnText}>✅ MARCAR SERVIDO</Text>
                </TouchableOpacity>
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
  btnServir: { backgroundColor: '#34C759', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});