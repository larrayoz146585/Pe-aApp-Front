import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
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
    purple: '#EAE3F7',
    onPurple: '#2D1B69',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    warning: '#7A5200',
    warningContainer: '#FFF0C2',
    surface: '#F5F7EF',
    surfaceVariant: '#DFE4D7',
    onSurface: '#191D16',
    onSurfaceVariant: '#434940',
    outlineVariant: '#C3C8BB',
    background: '#F0F2EA',
    shapeXXL: 50,
    shapeL: 28,
};

// ─── Configuración visual por acción ──────────────────────────────────────────
const ACTION_CFG: Record<string, { icon: string; bg: string; text: string; label: string }> = {
    LOGIN: { icon: '👋', bg: M3.secondaryContainer, text: M3.onSecondaryContainer, label: 'Login' },
    LOGOUT: { icon: '🚪', bg: M3.surfaceVariant, text: M3.onSurfaceVariant, label: 'Logout' },
    REGISTRO: { icon: '✨', bg: M3.purple, text: M3.onPurple, label: 'Nuevo Registro' },
    NUEVO_PEDIDO: { icon: '📝', bg: M3.primaryContainer, text: M3.primary, label: 'Pedido' },
    PEDIDO_SERVIDO: { icon: '✅', bg: M3.tertiaryContainer, text: M3.onTertiaryContainer, label: 'Servido' },
    PEDIDO_CANCELADO: { icon: '❌', bg: M3.errorContainer, text: M3.error, label: 'Cancelado' },
    RESETEO_HISTORIAL: { icon: '🧹', bg: M3.warningContainer, text: M3.warning, label: 'Historial Borrado' },
};

export default function LogsScreen() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const cargarLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/logs');
            setLogs(response.data.data);
        } catch (error: any) {
            showAlert('Acceso Denegado', 'No tienes permiso para ver esto.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { cargarLogs(); }, []));

    const renderLogCard = ({ item }: { item: any }) => {
        const cfg = ACTION_CFG[item.action] ?? { icon: '📌', bg: M3.surfaceVariant, text: M3.onSurfaceVariant, label: item.action };
        const fecha = new Date(item.created_at);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.actionRow}>
                        <View style={[styles.iconBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={styles.iconText}>{cfg.icon}</Text>
                        </View>
                        <View>
                            <Text style={[styles.actionTitle, { color: cfg.text }]}>{cfg.label}</Text>
                            <Text style={styles.timeText}>
                                {fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardDivider} />
                <Text style={styles.descriptionText}>{item.description}</Text>
                <View style={styles.userChip}>
                    <Text style={styles.userEmoji}>👤</Text>
                    <Text style={styles.userName}>{item.user?.name || 'Sistema / Borrado'}</Text>
                </View>
            </View>
        );
    };

    if (loading && logs.length === 0) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={M3.primary} />
            <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={M3.background} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Logs</Text>
                <Text style={styles.headerSubtitle}>Registro de actividad del sistema</Text>
            </View>
            <FlatList
                data={logs}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarLogs} tintColor={M3.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyEmoji}>📭</Text>
                        <Text style={styles.emptyText}>No hay actividad registrada aún.</Text>
                    </View>
                }
                renderItem={renderLogCard}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: M3.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: M3.background },
    loadingText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: M3.onSurface, letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 14, color: M3.onSurfaceVariant, fontWeight: '500', marginTop: 2 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyCard: { backgroundColor: M3.surface, borderRadius: M3.shapeL, padding: 32, alignItems: 'center', gap: 8, marginTop: 20 },
    emptyEmoji: { fontSize: 36 },
    emptyText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },
    card: { backgroundColor: M3.surface, borderRadius: M3.shapeL, padding: 16, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBadge: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 18 },
    actionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeText: { fontSize: 12, color: M3.onSurfaceVariant, fontWeight: '500', marginTop: 2 },
    cardDivider: { height: 1, backgroundColor: M3.outlineVariant, marginBottom: 12 },
    descriptionText: { fontSize: 15, color: M3.onSurface, lineHeight: 22, marginBottom: 12 },
    userChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: M3.surfaceVariant, borderRadius: M3.shapeXXL, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
    userEmoji: { fontSize: 12 },
    userName: { fontSize: 13, fontWeight: '700', color: M3.onSurfaceVariant },
});