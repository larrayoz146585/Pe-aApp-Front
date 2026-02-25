import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Pressable,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import api from '../api';
import { showAlert, showConfirm } from '../utils/alertHelper';

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

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
    superadmin: { label: 'SuperAdmin', icon: '👑', bg: M3.purple, text: M3.onPurple },
    admin: { label: 'Admin', icon: '🛡️', bg: M3.warningContainer, text: M3.warning },
    cliente: { label: 'Socio', icon: '🍺', bg: M3.secondaryContainer, text: M3.onSecondaryContainer },
};

// ─── Interface ────────────────────────────────────────────────────────────────
interface User {
    id: number;
    name: string;
    role: 'superadmin' | 'admin' | 'cliente';
    saldo: string;
}

// ─── Press animation ──────────────────────────────────────────────────────────
function ScalePress({ onPress, style, children }: {
    onPress: () => void; style?: any; children: React.ReactNode;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const go = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver: true }),
        ]).start();
        onPress();
    };
    return (
        <Pressable onPress={go} android_ripple={{ color: 'rgba(0,0,0,0.08)' }}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
        </Pressable>
    );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────
function UserCard({ item, onCambiarRol, onEliminar }: {
    item: User; onCambiarRol: () => void; onEliminar: () => void;
}) {
    const rolCfg = ROLE_CFG[item.role] ?? ROLE_CFG.cliente;
    const saldo = parseFloat(item.saldo);
    const saldoColor = saldo > 0 ? M3.primary : saldo < 0 ? M3.error : M3.onSurfaceVariant;
    const saldoBg = saldo > 0 ? M3.primaryContainer : saldo < 0 ? M3.errorContainer : M3.surfaceVariant;
    const isSuperAdmin = item.role === 'superadmin';

    return (
        <View style={[styles.card, isSuperAdmin && styles.cardSuperAdmin]}>
            {/* Top row */}
            <View style={styles.cardTop}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: rolCfg.bg }]}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.roleBadge, { backgroundColor: rolCfg.bg }]}>
                            <Text style={[styles.roleText, { color: rolCfg.text }]}>
                                {rolCfg.icon} {rolCfg.label}
                            </Text>
                        </View>
                        <View style={[styles.saldoBadge, { backgroundColor: saldoBg }]}>
                            <Text style={[styles.saldoText, { color: saldoColor }]}>
                                {saldo >= 0 ? '+' : ''}{saldo.toFixed(2)} €
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Actions — solo si no es superadmin */}
            {!isSuperAdmin && (
                <View style={styles.actions}>
                    <ScalePress style={styles.btnRol} onPress={onCambiarRol}>
                        <Text style={styles.btnRolText}>
                            {item.role === 'admin' ? '  ⬇ Hacer usuario  ' : '  ⬆ Hacer Admin  '}
                        </Text>
                    </ScalePress>
                    <ScalePress style={styles.btnDelete} onPress={onEliminar}>
                        <Text style={styles.btnDeleteText}>🗑️</Text>
                    </ScalePress>
                </View>
            )}

            {/* Lock badge para superadmin */}
            {isSuperAdmin && (
                <View style={styles.lockedBadge}>
                    <Text style={styles.lockedText}>🔒 Protegido</Text>
                </View>
            )}
        </View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GestionUsuariosScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/usuarios');
            setUsers(response.data);
        } catch (error: any) {
            showAlert('Error', error.response?.data?.message || 'No tienes permiso para ver esto.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { cargarUsuarios(); }, []));

    const cambiarRol = (user: User) => {
        if (user.role === 'superadmin') { showAlert('Acción no permitida', 'No se puede cambiar el rol de un superadmin.'); return; }
        const nuevoRol = user.role === 'admin' ? 'cliente' : 'admin';
        showConfirm(
            `Cambiar rol de ${user.name}`,
            `¿Quieres cambiar el rol de este usuario a "${nuevoRol}"?`,
            async () => {
                try {
                    await api.put(`/admin/usuarios/${user.id}`, { role: nuevoRol });
                    showAlert('Éxito', `El rol de ${user.name} ha sido actualizado.`);
                    cargarUsuarios();
                } catch (error: any) {
                    showAlert('Error', error.response?.data?.message || 'No se pudo actualizar el rol.');
                }
            }
        );
    };

    const eliminarUsuario = (user: User) => {
        if (user.role === 'superadmin') { showAlert('Acción no permitida', 'No se puede eliminar a un superadmin.'); return; }
        showConfirm(
            `Eliminar a ${user.name}`,
            '¿Estás seguro? Esta acción no se puede deshacer.',
            async () => {
                try {
                    await api.delete(`/admin/usuarios/${user.id}`);
                    showAlert('Éxito', `${user.name} ha sido eliminado.`);
                    cargarUsuarios();
                } catch (error: any) {
                    showAlert('Error', error.response?.data?.message || 'No se pudo eliminar el usuario.');
                }
            }
        );
    };

    // Estadísticas rápidas
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const totalDeuda = users.reduce((s, u) => s + Math.min(0, parseFloat(u.saldo)), 0);

    if (loading && users.length === 0) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={M3.primary} />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={M3.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>👥 Usuarios</Text>
                <Text style={styles.headerSubtitle}>{totalUsers} socios registrados</Text>
            </View>

            {/* Stats strip */}
            <View style={styles.statsStrip}>
                <View style={[styles.statPill, { backgroundColor: M3.primaryContainer }]}>
                    <Text style={[styles.statPillNum, { color: M3.primary }]}>{totalUsers}</Text>
                    <Text style={[styles.statPillLabel, { color: M3.onPrimaryContainer }]}>Total</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: M3.warningContainer }]}>
                    <Text style={[styles.statPillNum, { color: M3.warning }]}>{totalAdmins}</Text>
                    <Text style={[styles.statPillLabel, { color: M3.warning }]}>Admins</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: totalDeuda < 0 ? M3.errorContainer : M3.surfaceVariant }]}>
                    <Text style={[styles.statPillNum, { color: totalDeuda < 0 ? M3.error : M3.onSurfaceVariant, fontSize: 16 }]}>
                        {totalDeuda.toFixed(2)} €
                    </Text>
                    <Text style={[styles.statPillLabel, { color: totalDeuda < 0 ? M3.error : M3.onSurfaceVariant }]}>Deuda total</Text>
                </View>
            </View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Socios</Text>
                <View style={styles.sectionLine} />
            </View>

            <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={cargarUsuarios} tintColor={M3.primary} colors={[M3.primary]} />
                }
                renderItem={({ item }) => (
                    <UserCard
                        item={item}
                        onCambiarRol={() => cambiarRol(item)}
                        onEliminar={() => eliminarUsuario(item)}
                    />
                )}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: M3.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: M3.background },
    loadingText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },

    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: M3.onSurface, letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 13, color: M3.onSurfaceVariant, fontWeight: '500', marginTop: 2 },

    // Stats
    statsStrip: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statPill: {
        flex: 1,
        borderRadius: M3.shapeL,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 2,
    },
    statPillNum: { fontSize: 20, fontWeight: '800' },
    statPillLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: M3.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionLine: { flex: 1, height: 1.5, backgroundColor: M3.primaryContainer, borderRadius: 1 },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },

    // UserCard
    card: {
        backgroundColor: M3.surface,
        borderRadius: M3.shapeL,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    cardSuperAdmin: {
        borderColor: M3.purple,
        backgroundColor: '#FDFCFF',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 20, fontWeight: '800', color: M3.onSurface },
    cardInfo: { flex: 1, gap: 6 },
    userName: { fontSize: 17, fontWeight: '700', color: M3.onSurface },
    metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

    roleBadge: {
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    roleText: { fontSize: 12, fontWeight: '700' },

    saldoBadge: {
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    saldoText: { fontSize: 12, fontWeight: '800' },

    // Actions
    actions: { flexDirection: 'row', gap: 10 },
    btnRol: {
        flex: 1,
        backgroundColor: M3.surfaceVariant,
        borderRadius: M3.shapeXXL,
        paddingVertical: 11,
        alignItems: 'center',
    },
    btnRolText: { fontSize: 13, fontWeight: '700', color: M3.onSurfaceVariant },
    btnDelete: {
        backgroundColor: M3.errorContainer,
        borderRadius: M3.shapeXXL,
        paddingVertical: 11,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    btnDeleteText: { fontSize: 16 },

    // Locked
    lockedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: M3.purple,
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    lockedText: { fontSize: 12, fontWeight: '600', color: M3.onPurple },
});