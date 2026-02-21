import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../api';
import { showAlert, showConfirm } from '../utils/alertHelper';

// Define la interfaz para un usuario según tu API
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
            router.back(); // Si hay error (ej: no es admin), vuelve atrás
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarUsuarios();
        }, [])
    );

    // Función para cambiar el rol de un usuario
    const cambiarRol = (user: User) => {
        // No se puede cambiar el rol de un superadmin
        if (user.role === 'superadmin') {
            showAlert('Acción no permitida', 'No se puede cambiar el rol de un superadmin.');
            return;
        }

        // Alterna entre 'admin' y 'cliente'
        const nuevoRol = user.role === 'admin' ? 'cliente' : 'admin';

        showConfirm(
            `Cambiar rol de ${user.name}`,
            `¿Quieres cambiar el rol de este usuario a "${nuevoRol}"?`,
            async () => {
                try {
                    // **OJO**: Asumo que tu API permite actualizar el rol con un PATCH a esta ruta.
                    // Si la ruta o el método es diferente, ajústalo aquí.
                    await api.put(`/admin/usuarios/${user.id}`, { role: nuevoRol });
                    showAlert('Éxito', `El rol de ${user.name} ha sido actualizado.`);
                    cargarUsuarios(); // Recarga la lista para ver el cambio
                } catch (error: any) {
                    showAlert('Error', error.response?.data?.message || 'No se pudo actualizar el rol.');
                }
            }
        );
    };

    const eliminarUsuario = (user: User) => {
        // No se puede eliminar a un superadmin
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
                    cargarUsuarios(); // Recarga la lista para ver el cambio
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
                        </View>
                        <View style={styles.buttonsContainer}>
                            {/* Solo muestra los botones si el usuario no es 'superadmin' */}
                            {item.role !== 'superadmin' && (
                                <>
                                    <TouchableOpacity style={styles.editButton} onPress={() => cambiarRol(item)}>
                                        <Text style={styles.editButtonText}>ROL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarUsuario(item)}>
                                        <Text style={styles.deleteButtonText}>BORRAR</Text>
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
        backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 12,
        elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    userRole: { fontSize: 14, color: '#666', textTransform: 'capitalize', marginTop: 4 },
    editButton: {
        backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 8,
    },
    editButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    deleteButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
