import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import api from '../api';
import { showAlert } from '../utils/alertHelper';

// ─── M3 tokens ────────────────────────────────────────────────────────────────
const M3 = {
    primary: '#2D6A1F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#B7F397',
    onPrimaryContainer: '#042100',

    secondaryContainer: '#BFE0B0',
    onSecondaryContainer: '#131F0D',

    tertiaryContainer: '#BCEBEB',
    onTertiaryContainer: '#002020',

    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',

    warning: '#7A5200',
    warningContainer: '#FFF0C2',

    surface: '#F5F7EF',
    surfaceVariant: '#DFE4D7',
    onSurface: '#191D16',
    onSurfaceVariant: '#434940',
    outline: '#737970',
    outlineVariant: '#C3C8BB',
    background: '#F0F2EA',

    shapeXXL: 50,
    shapeXL: 36,
    shapeL: 28,
    shapeM: 16,
    shapeS: 12,
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    pendiente: { label: 'Pendiente', icon: '⏳', bg: M3.warningContainer, text: M3.warning },
    servido: { label: 'Servido', icon: '✅', bg: M3.secondaryContainer, text: M3.onSecondaryContainer },
    pagado: { label: 'Pagado', icon: '💰', bg: M3.tertiaryContainer, text: M3.onTertiaryContainer },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MiCuentaScreen() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarPedidos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/mis-pedidos');
            setPedidos(response.data);
        } catch {
            showAlert('Error', 'No se pudo cargar tu historial');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { cargarPedidos(); }, []));

    const totalAcumulado = pedidos.reduce((s, p) => s + parseFloat(p.total), 0);
    const pendientesCount = pedidos.filter(p => p.status === 'pendiente').length;
    const totalPedidos = pedidos.length;

    if (loading && pedidos.length === 0) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={M3.primary} />
            <Text style={styles.loadingText}>Cargando tu cuenta...</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={M3.background} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={cargarPedidos} tintColor={M3.primary} colors={[M3.primary]} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🧾 Mi Cuenta</Text>
                    <Text style={styles.headerSubtitle}>Tu historial de pedidos</Text>
                </View>

                {/* ── Resumen cards ── */}
                <View style={styles.statsRow}>
                    {/* Total pedidos */}
                    <View style={[styles.statCard, { backgroundColor: M3.primaryContainer }]}>
                        <Text style={styles.statNum}>{totalPedidos}</Text>
                        <Text style={[styles.statLabel, { color: M3.onPrimaryContainer }]}>Pedidos</Text>
                    </View>

                    {/* Pendientes */}
                    <View style={[styles.statCard, {
                        backgroundColor: pendientesCount > 0 ? M3.warningContainer : M3.surfaceVariant,
                    }]}>
                        <Text style={[styles.statNum, { color: pendientesCount > 0 ? M3.warning : M3.onSurfaceVariant }]}>
                            {pendientesCount}
                        </Text>
                        <Text style={[styles.statLabel, { color: pendientesCount > 0 ? M3.warning : M3.onSurfaceVariant }]}>
                            Pendientes
                        </Text>
                    </View>

                    {/* Total gastado */}
                    <View style={[styles.statCard, {
                        backgroundColor: totalAcumulado > 0 ? M3.errorContainer : M3.secondaryContainer,
                    }]}>
                        <Text style={[styles.statNum, {
                            color: totalAcumulado > 0 ? M3.error : M3.primary,
                            fontSize: totalAcumulado >= 100 ? 18 : 22,
                        }]}>
                            {totalAcumulado.toFixed(2)} €
                        </Text>
                        <Text style={[styles.statLabel, { color: totalAcumulado > 0 ? M3.error : M3.primary }]}>
                            Total
                        </Text>
                    </View>
                </View>

                {/* ── Lista vacía ── */}
                {pedidos.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyEmoji}>🍺</Text>
                        <Text style={styles.emptyTitle}>Aún no has pedido nada</Text>
                        <Text style={styles.emptySubtitle}>¡Pide algo y aparecerá aquí!</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Historial</Text>
                            <View style={styles.sectionLine} />
                        </View>

                        {pedidos.map((pedido) => {
                            const cfg = STATUS[pedido.status] ?? { label: pedido.status, icon: '•', bg: M3.surfaceVariant, text: M3.onSurfaceVariant };
                            const fecha = new Date(pedido.created_at);
                            const total = parseFloat(pedido.total);

                            return (
                                <View key={pedido.id} style={styles.pedidoCard}>
                                    {/* Card header */}
                                    <View style={styles.pedidoHeader}>
                                        <View style={styles.pedidoHeaderLeft}>
                                            <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
                                            <Text style={styles.pedidoFecha}>
                                                {fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                {' · '}
                                                {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <View style={styles.pedidoHeaderRight}>
                                            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                                <Text style={[styles.statusText, { color: cfg.text }]}>
                                                    {cfg.icon} {cfg.label}
                                                </Text>
                                            </View>
                                            <Text style={styles.pedidoTotal}>{total.toFixed(2)} €</Text>
                                        </View>
                                    </View>

                                    {/* Divider */}
                                    <View style={styles.pedidoDivider} />

                                    {/* Detalles */}
                                    <View style={styles.detallesList}>
                                        {pedido.detalles.map((d, i) => (
                                            <View key={i} style={styles.detalleRow}>
                                                <View style={styles.detalleCantidadBadge}>
                                                    <Text style={styles.detalleCantidad}>{d.cantidad}×</Text>
                                                </View>
                                                <Text style={styles.detalleNombre}>{d.bebida.nombre}</Text>
                                                <Text style={styles.detallePrecio}>
                                                    {(parseFloat(d.precio_unitario) * d.cantidad).toFixed(2)} €
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: M3.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: M3.background },
    loadingText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },
    scroll: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 48 },

    // Header
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: M3.onSurface, letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 13, color: M3.onSurfaceVariant, fontWeight: '500', marginTop: 2 },

    // Stats row
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    statCard: {
        flex: 1,
        borderRadius: M3.shapeL,
        padding: 16,
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
    },
    statNum: { fontSize: 22, fontWeight: '800', color: M3.primary },
    statLabel: { fontSize: 11, fontWeight: '600', color: M3.onPrimaryContainer, textTransform: 'uppercase', letterSpacing: 0.3 },

    // Section header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: M3.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionLine: { flex: 1, height: 1.5, backgroundColor: M3.primaryContainer, borderRadius: 1 },

    // Empty
    emptyCard: {
        backgroundColor: M3.surface,
        borderRadius: M3.shapeXL,
        padding: 48,
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    emptyEmoji: { fontSize: 52, marginBottom: 4 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: M3.onSurface },
    emptySubtitle: { fontSize: 14, color: M3.onSurfaceVariant },

    // Pedido card
    pedidoCard: {
        backgroundColor: M3.surface,
        borderRadius: M3.shapeL,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    pedidoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    pedidoHeaderLeft: { gap: 3 },
    pedidoId: { fontSize: 15, fontWeight: '800', color: M3.onSurface },
    pedidoFecha: { fontSize: 12, color: M3.onSurfaceVariant, fontWeight: '500' },
    pedidoHeaderRight: { alignItems: 'flex-end', gap: 6 },
    statusBadge: {
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    pedidoTotal: { fontSize: 20, fontWeight: '800', color: M3.onSurface },

    pedidoDivider: { height: 1, backgroundColor: M3.outlineVariant, marginBottom: 12 },

    // Detalles
    detallesList: { gap: 8 },
    detalleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detalleCantidadBadge: {
        backgroundColor: M3.primaryContainer,
        borderRadius: M3.shapeS,
        paddingHorizontal: 8,
        paddingVertical: 3,
        minWidth: 34,
        alignItems: 'center',
    },
    detalleCantidad: { fontSize: 12, fontWeight: '800', color: M3.primary },
    detalleNombre: { flex: 1, fontSize: 14, fontWeight: '600', color: M3.onSurface },
    detallePrecio: { fontSize: 13, fontWeight: '700', color: M3.onSurfaceVariant },
});