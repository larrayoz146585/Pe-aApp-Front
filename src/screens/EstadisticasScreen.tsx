import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../api';
import { showAlert, showConfirm } from '../utils/alertHelper';
export default function EstadisticasScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. CARGAR DATOS DEL SERVIDOR
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/estadisticas');
      setData(response.data);
    } catch (error) {
      // Si falla silenciosamente, al menos quitamos el cargando
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  // 2. FUNCIÓN PARA BORRAR TODO (EL BOTÓN ROJO)
  const borrarHistorial = () => {
    showConfirm(
      '⚠️ ¿Estás seguro?',
      'Esto borrará TODOS los pedidos y el historial de ventas. No se puede deshacer.',
      async () => {
        // --- ESTO SE EJECUTA SI EL USUARIO DICE "SÍ" ---
        try {
          await api.delete('/admin/reset-pedidos');

          // Aviso de éxito
          showAlert(
            '🧹 Limpieza completada',
            'Se ha borrado todo el historial.',
            () => cargarDatos() // Recargamos la pantalla cuando el usuario cierre la alerta
          );

        } catch (error) {
          // Aviso de error
          showAlert('Error', 'No se pudo borrar el historial');
        }
      }
    );
  };

  if (loading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos y cuenta final</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarDatos} />}
      >

        {/* SECCIÓN A: RESUMEN TOTAL (TOP VENTAS) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Ranking de Bebidas</Text>
          <View style={styles.table}>
            {data?.resumen.map((item: any, index: number) => (
              <View key={index} style={styles.row}>
                <Text style={styles.rowName}>
                  {index + 1}. {item.nombre}
                </Text>
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

              {/* Cabecera: Nombre y Total */}
              <View style={styles.cardHeader}>
                <Text style={styles.user}>👤 {cliente.nombre}</Text>
                <Text style={styles.totalPrice}>{cliente.total_gastado} €</Text>
              </View>

              {/* Lista Agrupada de Bebidas */}
              <View style={styles.detailsContainer}>
                <Text style={{ fontSize: 12, color: '#999', marginBottom: 5 }}>Ha consumido:</Text>
                {/* Truco para recorrer el objeto de bebidas: */}
                {Object.entries(cliente.bebidas).map(([nombreBebida, cantidad]: any, index) => (
                  <Text key={index} style={styles.detail}>
                    • {cantidad} x {nombreBebida}
                  </Text>
                ))}
              </View>

            </View>
          ))}

          {(!data?.historial || data?.historial.length === 0) && (
            <Text style={styles.emptyText}>No has servido nada a nadie... todavía.</Text>
          )}
        </View>

        {/* SECCIÓN C: BOTÓN DEL PÁNICO */}
        {data?.historial.length > 0 && (
          <TouchableOpacity style={styles.dangerButton} onPress={borrarHistorial}>
            <Text style={styles.dangerText}>🗑️ BORRAR TODOS LOS PEDIDOS</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50, paddingHorizontal: 15 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#555', marginLeft: 5 },
  emptyText: { textAlign: 'center', color: '#999', padding: 10 },

  // TABLA DE RANKING
  table: { backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowName: { fontSize: 16, color: '#333', fontWeight: '500' },
  rowValue: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },

  // TARJETAS DE HISTORIAL
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingBottom: 8 },

  user: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  camarero: { fontSize: 13, color: '#5856D6', fontWeight: 'bold', marginTop: 2 },
  camareroPending: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 2 },

  date: { color: '#999', fontSize: 14 },

  detailsContainer: { marginBottom: 10 },
  detail: { fontSize: 15, color: '#555', marginLeft: 5, marginVertical: 1 },

  totalPrice: { textAlign: 'right', fontWeight: 'bold', color: '#34C759', fontSize: 16 },

  // BOTÓN ROJO
  dangerButton: { backgroundColor: '#ff3b30', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 50, shadowColor: "#ff3b30", shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  dangerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  // ... tus otros estilos ...

  // AÑADE ESTOS NUEVOS PARA EL PRECIO GRANDE
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#f0f9f4', // Un fondo verde muy clarito
    padding: 10,
    borderRadius: 8,
    minWidth: 80
  },
  totalLabel: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  bigPrice: {
    fontSize: 22, // ¡Bien grande!
    fontWeight: 'bold',
    color: '#34C759' // Verde dinero
  },
});
