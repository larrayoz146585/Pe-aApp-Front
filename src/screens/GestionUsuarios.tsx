import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../api';
import { showAlert, showConfirm } from '../utils/alertHelper';

interface User {
    id: number;
    name: string;
    role: 'superadmin' | 'admin' | 'cliente';
    saldo: string;
}

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
        if (user.role === 'superadmin') {
            showAlert('Acción no permitida', 'No se puede cambiar el rol de un superadmin.');
            return;
        }
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
        if (user.role === 'superadmin') {
            showAlert('Acción no permitida', 'No se puede eliminar a un superadmin.');
            return;
        }
        showConfirm(
            `Eliminar a ${user.name}`,
            `¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.`,
            async () => {
                try {
                    await api.delete(`/admin/usuarios/${user.id}`);
                    showAlert('Éxito', `El usuario ${user.name} ha sido eliminado.`);
                    cargarUsuarios();
                } catch (error: any) {
                    showAlert('Error', error.response?.data?.message || 'No se pudo eliminar el usuario.');
                }
            }
        );
    };

    if (loading && users.length === 0) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>👑 Gestión de Usuarios</Text>
            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarUsuarios} />}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.userName}>{item.name}</Text>
                            <Text style={styles.userRole}>Rol: {item.role}</Text>
                            <Text style={styles.userSaldo}>Saldo: {parseFloat(item.saldo).toFixed(2)} €</Text>
                        </View>
                        <View style={styles.buttonsContainer}>
                            {item.role !== 'superadmin' && (
                                <>
                                    <TouchableOpacity style={styles.editButton} onPress={() => cambiarRol(item)}>
                                        <Text style={styles.buttonText}>ROL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarUsuario(item)}>
                                        <Text style={styles.buttonText}>BORRAR</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    card: {
        backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    userRole: { fontSize: 14, color: '#666', marginTop: 2 },
    userSaldo: { fontSize: 14, color: '#007AFF', marginTop: 2 },
    buttonsContainer: { flexDirection: 'row', gap: 8 },
    editButton: { backgroundColor: '#FF9500', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    deleteButton: { backgroundColor: '#FF3B30', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
});
