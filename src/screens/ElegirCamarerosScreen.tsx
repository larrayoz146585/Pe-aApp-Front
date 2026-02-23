import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import api from '../api';
import { showAlert } from '../utils/alertHelper';

interface Admin {
    id: number;
    name: string;
    role: 'admin' | 'superadmin';
}

export default function ElegirCamarerosScreen() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const router = useRouter();

    const cargarDatos = async () => {
        setLoading(true);
        try {
            // Cargamos la lista de admins disponibles y mis selecciones actuales en paralelo
            const [adminsRes, misRes] = await Promise.all([
                api.get('/camareros'),
                api.get('/mis-camareros'),
            ]);
            setAdmins(adminsRes.data);
            setSeleccionados(misRes.data); // Array de IDs
        } catch (error: any) {
            showAlert('Error', 'No se pudo cargar la lista de camareros.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { cargarDatos(); }, []));

    const toggleCamarero = (id: number) => {
        setSeleccionados(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)   // Deseleccionar
                : [...prev, id]                 // Seleccionar
        );
    };

    const guardar = async () => {
        setGuardando(true);
        try {
            await api.post('/mis-camareros', { camarero_ids: seleccionados });

            const mensaje = seleccionados.length === 0
                ? 'Tus pedidos los verán todos los camareros disponibles.'
                : `Tus pedidos solo los verán los ${seleccionados.length} camarero(s) que elegiste.`;

            showAlert('✅ Guardado', mensaje, () => router.back());
        } catch (error: any) {
            showAlert('Error', 'No se pudo guardar la selección.');
        } finally {
            setGuardando(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>🍺 Mis Camareros</Text>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    Elige quién recibirá tus pedidos. Si no seleccionas nadie, los verán todos los camareros disponibles.
                </Text>
            </View>

            {admins.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay camareros disponibles aún</Text>
                </View>
            ) : (
                admins.map(admin => {
                    const seleccionado = seleccionados.includes(admin.id);
                    return (
                        <TouchableOpacity
                            key={admin.id}
                            style={[styles.card, seleccionado && styles.cardSeleccionada]}
                            onPress={() => toggleCamarero(admin.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardLeft}>
                                <Text style={styles.adminEmoji}>
                                    {admin.role === 'superadmin' ? '👑' : '🍺'}
                                </Text>
                                <View>
                                    <Text style={[styles.adminNombre, seleccionado && styles.textoSeleccionado]}>
                                        {admin.name}
                                    </Text>
                                    <Text style={styles.adminRol}>
                                        {admin.role === 'superadmin' ? 'Super Admin' : 'Camarero'}
                                    </Text>
                                </View>
                            </View>

                            {/* Checkbox visual */}
                            <View style={[styles.checkbox, seleccionado && styles.checkboxSeleccionado]}>
                                {seleccionado && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}

            {/* Resumen de selección */}
            <View style={styles.resumen}>
                {seleccionados.length === 0 ? (
                    <Text style={styles.resumenTexto}>
                        📢 Todos los camareros verán tus pedidos
                    </Text>
                ) : (
                    <Text style={styles.resumenTexto}>
                        🎯 Solo {seleccionados.length} camarero(s) verán tus pedidos
                    </Text>
                )}
            </View>

            <TouchableOpacity
                style={[styles.botonGuardar, guardando && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={guardando}
            >
                {guardando
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.botonGuardarTexto}>💾 GUARDAR</Text>
                }
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },

    infoBox: {
        backgroundColor: '#E8F4FD', borderRadius: 12, padding: 15,
        marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#007AFF',
    },
    infoText: { fontSize: 14, color: '#333', lineHeight: 20 },

    emptyContainer: { alignItems: 'center', paddingTop: 40 },
    emptyText: { fontSize: 16, color: '#888' },

    card: {
        backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
        borderWidth: 2, borderColor: 'transparent',
    },
    cardSeleccionada: {
        borderColor: '#007AFF', backgroundColor: '#F0F8FF',
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    adminEmoji: { fontSize: 30 },
    adminNombre: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    textoSeleccionado: { color: '#007AFF' },
    adminRol: { fontSize: 13, color: '#888', marginTop: 2 },

    checkbox: {
        width: 28, height: 28, borderRadius: 14, borderWidth: 2,
        borderColor: '#ccc', alignItems: 'center', justifyContent: 'center',
    },
    checkboxSeleccionado: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    checkmark: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    resumen: {
        backgroundColor: 'white', borderRadius: 12, padding: 15,
        marginTop: 10, marginBottom: 20, alignItems: 'center',
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
    },
    resumenTexto: { fontSize: 15, color: '#555', fontWeight: '600' },

    botonGuardar: {
        backgroundColor: '#34C759', padding: 18, borderRadius: 14,
        alignItems: 'center', elevation: 3,
    },
    botonGuardarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
