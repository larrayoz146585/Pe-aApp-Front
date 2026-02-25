import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
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

    secondary: '#55624C',
    secondaryContainer: '#BFE0B0',
    onSecondaryContainer: '#131F0D',

    tertiaryContainer: '#BCEBEB',
    onTertiaryContainer: '#002020',

    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',

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

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Bebida {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
    is_active: boolean;
}
const initialBebidaState: Partial<Bebida> = { id: 0, nombre: '', precio: 0, categoria: '', is_active: true };

// ─── Press animation ──────────────────────────────────────────────────────────
function ScalePress({ onPress, style, children, disabled }: {
    onPress: () => void; style?: any; children: React.ReactNode; disabled?: boolean;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const go = () => {
        if (disabled) return;
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver: true }),
        ]).start();
        onPress();
    };
    return (
        <Pressable onPress={go} disabled={disabled} android_ripple={{ color: 'rgba(0,0,0,0.08)' }}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
        </Pressable>
    );
}

// ─── M3 Input ─────────────────────────────────────────────────────────────────
function M3Input({ placeholder, value, onChangeText, keyboardType, label }: {
    placeholder?: string; value: string; onChangeText: (t: string) => void;
    keyboardType?: any; label: string;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, focused && styles.inputLabelFocused]}>{label}</Text>
            <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={M3.onSurfaceVariant}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            </View>
        </View>
    );
}

// ─── BebidaCard ───────────────────────────────────────────────────────────────
function BebidaCard({ item, onEdit, onToggle, onDelete }: {
    item: Bebida;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
}) {
    return (
        <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            {/* Top row */}
            <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                    <Text style={[styles.cardNombre, !item.is_active && styles.cardNombreInactive]}>
                        {item.nombre}
                    </Text>
                    <View style={styles.cardMeta}>
                        <View style={styles.categoriaChip}>
                            <Text style={styles.categoriaText}>{item.categoria}</Text>
                        </View>
                        <View style={[styles.statusDot, { backgroundColor: item.is_active ? M3.primary : M3.outline }]} />
                        <Text style={[styles.statusLabel, { color: item.is_active ? M3.primary : M3.outline }]}>
                            {item.is_active ? 'Activa' : 'Inactiva'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.priceBadge, !item.is_active && styles.priceBadgeInactive]}>
                    <Text style={[styles.priceText, !item.is_active && styles.priceTextInactive]}>
                        {item.precio.toFixed(2)} €
                    </Text>
                </View>
            </View>

            {/* Action row */}
            <View style={styles.cardActions}>
                <ScalePress style={styles.actionBtn} onPress={onEdit}>
                    <Text style={styles.actionBtnText}>    Editar    </Text>
                </ScalePress>

                <ScalePress
                    style={[styles.actionBtn, item.is_active ? styles.actionBtnWarning : styles.actionBtnSuccess]}
                    onPress={onToggle}
                >
                    <Text style={[styles.actionBtnText, item.is_active ? styles.actionBtnTextWarning : styles.actionBtnTextSuccess]}>
                        {item.is_active ? '   Desactivar   ' : '   Activar   '}
                    </Text>
                </ScalePress>

                <ScalePress style={[styles.actionBtn, styles.actionBtnDanger]} onPress={onDelete}>
                    <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>🗑️</Text>
                </ScalePress>
            </View>
        </View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GestionBebidasScreen() {
    const [bebidas, setBebidas] = useState<Bebida[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [bebidaSeleccionada, setBebidaSeleccionada] = useState<Partial<Bebida>>(initialBebidaState);
    const [precioString, setPrecioString] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const router = useRouter();

    const cargarBebidas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/bebidas');
            const bebidasCorregidas = response.data.map((b: any) => ({ ...b, precio: parseFloat(b.precio) }));
            setBebidas(bebidasCorregidas);
        } catch (error: any) {
            showAlert('Error', error.response?.data?.message || 'No tienes permiso para ver esto.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { cargarBebidas(); }, []));

    const handleAbrirModal = (bebida?: Bebida) => {
        if (bebida) {
            setIsEditMode(true);
            setBebidaSeleccionada(bebida);
            setPrecioString(bebida.precio.toString());
        } else {
            setIsEditMode(false);
            setBebidaSeleccionada(initialBebidaState);
            setPrecioString('');
        }
        setModalVisible(true);
    };

    const handleGuardar = async () => {
        const { nombre, categoria } = bebidaSeleccionada;
        const precio = parseFloat(precioString.replace(',', '.')) || 0;
        if (!nombre || !precio || !categoria) { showAlert('Faltan datos', 'Completa todos los campos.'); return; }
        try {
            if (isEditMode) {
                await api.put(`/admin/bebidas/${bebidaSeleccionada.id}/update`, { nombre, precio, categoria });
            } else {
                await api.post('/admin/bebidas/create', { nombre, precio, categoria });
            }
            setModalVisible(false);
            cargarBebidas();
        } catch (error: any) {
            showAlert('Error', error.response?.data?.message || 'No se pudo guardar la bebida.');
        }
    };

    const handleToggleActive = (bebida: Bebida) => {
        const nuevoEstado = !bebida.is_active;
        const accion = nuevoEstado ? 'reactivar' : 'desactivar';
        showConfirm(
            `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} bebida?`,
            `¿Quieres ${accion} "${bebida.nombre}" de la carta?`,
            async () => {
                try {
                    await api.put(`/admin/bebidas/${bebida.id}/update`, { is_active: nuevoEstado });
                    showAlert('Éxito', `Bebida ${accion}da correctamente.`);
                    cargarBebidas();
                } catch { showAlert('Error', `No se pudo ${accion} la bebida.`); }
            }
        );
    };

    const handleEliminar = (bebida: Bebida) => {
        showConfirm(
            `🗑️ Eliminar "${bebida.nombre}"`,
            'Esta acción es permanente y no se puede deshacer. ¿Estás seguro?',
            async () => {
                try {
                    await api.delete(`/admin/bebidas/${bebida.id}/delete`);
                    showAlert('✅ Eliminada', `"${bebida.nombre}" ha sido eliminada.`);
                    cargarBebidas();
                } catch (error: any) {
                    showAlert('Error', error.response?.data?.message || 'No se pudo eliminar la bebida.');
                }
            }
        );
    };

    const bebidasFiltradas = bebidas.filter(b => b.nombre.toLowerCase().includes(busqueda.toLowerCase()));

    if (loading && bebidas.length === 0) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={M3.primary} />
            <Text style={styles.loadingText}>Cargando bebidas...</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={M3.background} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🍹 Bebidas</Text>
                    <Text style={styles.headerSubtitle}>{bebidas.length} bebidas en carta</Text>
                </View>
                <ScalePress style={styles.fabSmall} onPress={() => handleAbrirModal()}>
                    <Text style={styles.fabSmallText}>+ Añadir</Text>
                </ScalePress>
            </View>

            {/* Search */}
            <View style={[styles.searchWrapper, searchFocused && styles.searchWrapperFocused]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar bebida..."
                    placeholderTextColor={M3.onSurfaceVariant}
                    value={busqueda}
                    onChangeText={setBusqueda}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
                {busqueda.length > 0 && (
                    <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.7}>
                        <Text style={styles.searchClear}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista */}
            <FlatList
                data={bebidasFiltradas}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={cargarBebidas} tintColor={M3.primary} colors={[M3.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyEmoji}>🍹</Text>
                        <Text style={styles.emptyText}>No hay bebidas{busqueda ? ' con ese nombre' : ' en carta'}</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <BebidaCard
                        item={item}
                        onEdit={() => handleAbrirModal(item)}
                        onToggle={() => handleToggleActive(item)}
                        onDelete={() => handleEliminar(item)}
                    />
                )}
            />

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.scrim} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.sheet} onPress={() => { }}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>{isEditMode ? '✏️ Editar Bebida' : '🍹 Nueva Bebida'}</Text>

                        <M3Input
                            label="Nombre"
                            placeholder="Ej: Estrella Damm"
                            value={bebidaSeleccionada.nombre ?? ''}
                            onChangeText={text => setBebidaSeleccionada(prev => ({ ...prev, nombre: text }))}
                        />
                        <M3Input
                            label="Precio"
                            placeholder="Ej: 1.50"
                            value={precioString}
                            onChangeText={setPrecioString}
                            keyboardType="decimal-pad"
                        />
                        <M3Input
                            label="Categoría"
                            placeholder="Ej: Cervezas"
                            value={bebidaSeleccionada.categoria ?? ''}
                            onChangeText={text => setBebidaSeleccionada(prev => ({ ...prev, categoria: text }))}
                        />

                        <View style={styles.sheetBtns}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <ScalePress style={styles.saveBtn} onPress={handleGuardar}>
                                <Text style={styles.saveBtnText}>
                                    {isEditMode ? 'Guardar cambios' : 'Crear bebida'}
                                </Text>
                            </ScalePress>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: M3.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: M3.background },
    loadingText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: M3.onSurface, letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 13, color: M3.onSurfaceVariant, fontWeight: '500', marginTop: 2 },
    fabSmall: {
        backgroundColor: M3.primary,
        borderRadius: M3.shapeXXL,
        paddingVertical: 12,
        paddingHorizontal: 20,
        shadowColor: M3.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    fabSmallText: { color: M3.onPrimary, fontSize: 14, fontWeight: '800' },

    // Search
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: M3.surface,
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1.5,
        borderColor: M3.outlineVariant,
        gap: 8,
    },
    searchWrapperFocused: { borderColor: M3.primary, borderWidth: 2, backgroundColor: '#FFFFFF' },
    searchIcon: { fontSize: 16 },
    searchInput: { flex: 1, fontSize: 15, color: M3.onSurface, paddingVertical: 12 },
    searchClear: { fontSize: 13, color: M3.onSurfaceVariant, fontWeight: '600', padding: 4 },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },

    emptyCard: {
        backgroundColor: M3.surface,
        borderRadius: M3.shapeL,
        padding: 32,
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
    },
    emptyEmoji: { fontSize: 36 },
    emptyText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },

    // BebidaCard
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
    cardInactive: {
        opacity: 0.65,
        borderColor: M3.outlineVariant,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    cardInfo: { flex: 1, gap: 6 },
    cardNombre: { fontSize: 17, fontWeight: '700', color: M3.onSurface },
    cardNombreInactive: { color: M3.onSurfaceVariant },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoriaChip: {
        backgroundColor: M3.surfaceVariant,
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    categoriaText: { fontSize: 12, fontWeight: '600', color: M3.onSurfaceVariant },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusLabel: { fontSize: 12, fontWeight: '600' },
    priceBadge: {
        backgroundColor: M3.primaryContainer,
        borderRadius: M3.shapeXXL,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: 10,
    },
    priceBadgeInactive: { backgroundColor: M3.surfaceVariant },
    priceText: { fontSize: 15, fontWeight: '800', color: M3.primary },
    priceTextInactive: { color: M3.onSurfaceVariant },

    // Action row
    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        flex: 1,
        backgroundColor: M3.surfaceVariant,
        borderRadius: M3.shapeM,
        paddingVertical: 9,
        alignItems: 'center',
    },
    actionBtnWarning: { backgroundColor: '#FFF3CD' },
    actionBtnSuccess: { backgroundColor: M3.secondaryContainer },
    actionBtnDanger: { backgroundColor: M3.errorContainer, flex: 0, paddingHorizontal: 14 },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: M3.onSurfaceVariant },
    actionBtnTextWarning: { fontSize: 12, fontWeight: '700', color: '#7A5200' },
    actionBtnTextSuccess: { fontSize: 12, fontWeight: '700', color: M3.onSecondaryContainer },
    actionBtnTextDanger: { fontSize: 14, fontWeight: '700', color: M3.error },

    // Bottom sheet modal
    scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: M3.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 40,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    sheetHandle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: M3.outlineVariant,
        marginBottom: 20,
    },
    sheetTitle: { fontSize: 22, fontWeight: '800', color: M3.onSurface, marginBottom: 20 },

    // Inputs
    inputGroup: { marginBottom: 14 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: M3.onSurfaceVariant, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    inputLabelFocused: { color: M3.primary },
    inputWrapper: {
        borderWidth: 1.5,
        borderColor: M3.outlineVariant,
        borderRadius: M3.shapeM,
        backgroundColor: M3.background,
        paddingHorizontal: 14,
    },
    inputWrapperFocused: { borderColor: M3.primary, borderWidth: 2, backgroundColor: '#FFFFFF' },
    input: { fontSize: 16, color: M3.onSurface, paddingVertical: 13 },

    sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1,
        borderRadius: M3.shapeXXL,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: M3.outline,
    },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: M3.onSurfaceVariant },
    saveBtn: {
        flex: 2,
        backgroundColor: M3.primary,
        borderRadius: M3.shapeXXL,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: M3.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    saveBtnText: { color: M3.onPrimary, fontSize: 15, fontWeight: '800' },
});