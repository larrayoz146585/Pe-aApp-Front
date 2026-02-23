import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import api from '../api';
import { showAlert } from '../utils/alertHelper';

interface DetallePedido {
    id: number;
    cantidad: number;
    precio_unitario: string;
    bebida: { nombre: string };
}

interface Pedido {
    id: number;
    status: 'pendiente' | 'servido' | 'pagado';
    total: string;
    created_at: string;
    detalles: DetallePedido[];
}

export default function MiCuentaScreen() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarPedidos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/mis-pedidos');
            setPedidos(response.data);
        } catch (error: any) {
            showAlert('Error', 'No se pudo cargar tu historial');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { cargarPedidos(); }, []));

    const totalAcumulado = pedidos.reduce((sum, p) => sum + parseFloat(p.total), 0);
    const pendientesCount = pedidos.filter(p => p.status === 'pendiente').length;

    const statusConfig: Record<string, { label: string; color: string }> = {
        pendiente: { label: '⏳ Pendiente', color: '#FF9500' },
        servido: { label: '✅ Servido', color: '#34C759' },
        pagado: { label: '💰 Pagado', color: '#007AFF' },
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarPedidos} />}
        >
            <Text style={styles.title}>🧾 Mi Cuenta</Text>

            {/* Resumen rápido */}
            <View style={styles.resumenRow}>
                <View style={styles.resumenCard}>
                    <Text style={styles.resumenNum}>{pedidos.length}</Text>
                    <Text style={styles.resumenLabel}>Pedidos</Text>
                </View>
                <View style={[styles.resumenCard, { backgroundColor: pendientesCount > 0 ? '#FFF3CD' : 'white' }]}>
                    <Text style={[styles.resumenNum, { color: pendientesCount > 0 ? '#FF9500' : '#333' }]}>
                        {pendientesCount}
                    </Text>
                    <Text style={styles.resumenLabel}>Pendientes</Text>
                </View>
                <View style={styles.resumenCard}>
                    <Text style={[styles.resumenNum, { color: '#FF3B30' }]}>
                        {totalAcumulado.toFixed(2)} €
                    </Text>
                    <Text style={styles.resumenLabel}>Total</Text>
                </View>
            </View>

            {/* Lista de pedidos */}
            {pedidos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🍺</Text>
                    <Text style={styles.emptyText}>Aún no has pedido nada</Text>
                    <Text style={styles.emptySubtext}>¡Pide algo y aparecerá aquí!</Text>
                </View>
            ) : (
                pedidos.map((pedido) => {
                    const config = statusConfig[pedido.status] ?? { label: pedido.status, color: '#888' };
                    const fecha = new Date(pedido.created_at);
                    return (
                        <View key={pedido.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
                                    <Text style={styles.hora}>
                                        {fecha.toLocaleDateString()} · {fecha.toLocaleTimeString().slice(0, 5)}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
                                        <Text style={styles.statusText}>{config.label}</Text>
                                    </View>
                                    <Text style={styles.totalText}>{parseFloat(pedido.total).toFixed(2)} €</Text>
                                </View>
                            </View>

                            <View style={styles.detalles}>
                                {pedido.detalles.map((d, i) => (
                                    <Text key={i} style={styles.lineaDetalle}>
                                        {d.cantidad} × {d.bebida.nombre}
                                        <Text style={styles.precioDetalle}>
                                            {' '}— {(parseFloat(d.precio_unitario) * d.cantidad).toFixed(2)} €
                                        </Text>
                                    </Text>
                                ))}
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },

    resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
    resumenCard: {
        flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 15,
        alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    },
    resumenNum: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    resumenLabel: { fontSize: 12, color: '#888', marginTop: 4 },

    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 60, marginBottom: 15 },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 5 },

    card: {
        backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    pedidoId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    hora: { fontSize: 12, color: '#999', marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    totalText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 5 },
    detalles: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    lineaDetalle: { fontSize: 15, color: '#444', marginVertical: 2 },
    precioDetalle: { color: '#888', fontSize: 13 },
});
