import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../api';
import { showAlert, showConfirm } from '../utils/alertHelper';

interface Bebida {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
    is_active: boolean;
}

const initialBebidaState = { id: 0, nombre: '', precio: 0, categoria: '', is_active: true };

export default function GestionBebidasScreen() {
    const [bebidas, setBebidas] = useState<Bebida[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [bebidaSeleccionada, setBebidaSeleccionada] = useState<Partial<Bebida>>(initialBebidaState);
    const [precioString, setPrecioString] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const router = useRouter();

    const cargarBebidas = async () => {
        setLoading(true);
        try {
            // CORRECCIÓN: Usamos la ruta de admin para obtener TODAS las bebidas (activas e inactivas).
            // La ruta '/bebidas' es para clientes y devuelve datos agrupados que no sirven para esta lista.
            // Asegúrate de que tu API tiene un endpoint GET en '/admin/bebidas'.
            const response = await api.get('/admin/bebidas');
            // CORRECCIÓN: Nos aseguramos de que el precio sea un número, no un string.
            const bebidasCorregidas = response.data.map((bebida: any) => ({
                ...bebida,
                precio: parseFloat(bebida.precio)
            }));
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

        if (!nombre || !precio || !categoria) {
            showAlert('Faltan datos', 'Completa todos los campos.');
            return;
        }

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
                } catch (error: any) {
                    showAlert('Error', `No se pudo ${accion} la bebida.`);
                }
            }
        );
    };

    if (loading && bebidas.length === 0) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🍹 Gestión de Bebidas</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => handleAbrirModal()}>
                <Text style={styles.addButtonText}>+ AÑADIR NUEVA BEBIDA</Text>
            </TouchableOpacity>

            <FlatList
                data={bebidas}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarBebidas} />}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bebidaNombre}>{item.nombre}</Text>
                            <Text style={styles.bebidaCategoria}>{item.categoria}</Text>
                            <Text style={styles.bebidaPrecio}>{item.precio.toFixed(2)} €</Text>
                        </View>
                        <View style={styles.actionsContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#28a745' : '#dc3545' }]}>
                                <Text style={styles.statusText}>{item.is_active ? 'Activa' : 'Inactiva'}</Text>
                            </View>
                            <TouchableOpacity style={styles.editButton} onPress={() => handleAbrirModal(item)}>
                                <Text style={styles.buttonText}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toggleButton} onPress={() => handleToggleActive(item)}>
                                <Text style={styles.buttonText}>{item.is_active ? 'Desactivar' : 'Activar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{isEditMode ? 'Editar Bebida' : 'Nueva Bebida'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre de la bebida"
                            value={bebidaSeleccionada.nombre}
                            onChangeText={(text) => setBebidaSeleccionada(prev => ({ ...prev, nombre: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Precio (ej: 1.50)"
                            keyboardType="decimal-pad"
                            value={precioString}
                            onChangeText={setPrecioString}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Categoría (ej: Cervezas)"
                            value={bebidaSeleccionada.categoria}
                            onChangeText={(text) => setBebidaSeleccionada(prev => ({ ...prev, categoria: text }))}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#6c757d' }]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#007AFF' }]} onPress={handleGuardar}>
                                <Text style={styles.buttonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
    addButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
    bebidaNombre: { fontSize: 18, fontWeight: 'bold' },
    bebidaCategoria: { fontSize: 14, color: '#666', fontStyle: 'italic' },
    bebidaPrecio: { fontSize: 16, color: '#007AFF', fontWeight: '600', marginTop: 4 },
    actionsContainer: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 8 },
    statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    editButton: { backgroundColor: '#ffc107', padding: 8, borderRadius: 6, marginBottom: 6, minWidth: 90, alignItems: 'center' },
    toggleButton: { backgroundColor: '#17a2b8', padding: 8, borderRadius: 6, minWidth: 90, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 15, padding: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#f0f2f5', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
});