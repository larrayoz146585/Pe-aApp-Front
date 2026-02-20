import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { showAlert } from '../utils/alertHelper';
interface Bebida {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
}

interface ItemCarrito {
  bebida: Bebida;
  cantidad: number;
}

interface SeccionBebidas {
  title: string;
  data: Bebida[];
}

export default function CartaScreen() {
  const router = useRouter();
  const { userInfo } = useContext(AuthContext);

  const [secciones, setSecciones] = useState<SeccionBebidas[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get('/bebidas')
      .then(response => {
        const bebidasAgrupadas = response.data; // { Categoria1: [bebida1], ... }
        // Convertimos el objeto en un array para el SectionList
        const arraySecciones = Object.keys(bebidasAgrupadas).map(categoria => ({
          title: categoria,
          data: bebidasAgrupadas[categoria]
        }));
        setSecciones(arraySecciones);
        setLoading(false);
      })
      .catch(error => {
        showAlert('Error', 'No se ha podido cargar la carta');
        setLoading(false);
      });
  }, []);

  const agregarBebida = (bebida: Bebida) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.bebida.id === bebida.id);
      if (existe) {
        return prev.map(item =>
          item.bebida.id === bebida.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { bebida, cantidad: 1 }];
    });
  };

  const quitarBebida = (bebida: Bebida) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.bebida.id === bebida.id);
      if (existe && existe.cantidad > 1) {
        return prev.map(item =>
          item.bebida.id === bebida.id ? { ...item, cantidad: item.cantidad - 1 } : item
        );
      }
      return prev.filter(item => item.bebida.id !== bebida.id);
    });
  };

  const total = carrito.reduce((sum, item) => sum + (item.bebida.precio * item.cantidad), 0);

  const confirmarPedido = async () => {
    if (carrito.length === 0) return;

    setEnviando(true);
    try {
      // Preparamos el array 'items'
      const items = carrito.map(item => ({
        bebida_id: item.bebida.id,
        cantidad: item.cantidad
      }));

      // ENVIAMOS 'items' AL SERVIDOR
      await api.post('/pedidos', {
        items: items
      });

      showAlert(
        '¡Oído Cocina! 🍻',
        'Tu pedido se ha enviado.',
        () => router.back()
      );
      setCarrito([]);

    } catch (error: any) {
      // --- CÓDIGO DE DEBUG (CHIVATO) ---
      console.log("Error completo:", error);

      const respuestaServidor = error.response?.data;

      // Si el servidor nos manda un mensaje explicativo, lo mostramos
      const mensajeError = JSON.stringify(respuestaServidor) || error.message;

      showAlert('Detectado Error 🛑', mensajeError);
      // ---------------------------------
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bebidas en la Peña Sanduzelai </Text>

      <SectionList
        sections={secciones}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const enCarrito = carrito.find(c => c.bebida.id === item.id);
          const cantidad = enCarrito ? enCarrito.cantidad : 0;

          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bebidaNombre}>{item.nombre}</Text>
                <Text style={styles.bebidaPrecio}>{item.precio} €</Text>
              </View>

              <View style={styles.controles}>
                {cantidad > 0 && (
                  <TouchableOpacity onPress={() => quitarBebida(item)} style={[styles.btn, styles.btnMinus]}>
                    <Text style={styles.btnText}>-</Text>
                  </TouchableOpacity>
                )}

                {cantidad > 0 && <Text style={styles.cantidad}>{cantidad}</Text>}

                <TouchableOpacity onPress={() => agregarBebida(item)} style={[styles.btn, styles.btnPlus]}>
                  <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {total > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalText}>Total: {total.toFixed(2)} €</Text>
          <TouchableOpacity
            style={styles.pedirBtn}
            onPress={confirmarPedido}
            disabled={enviando}
          >
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.pedirText}>CONFIRMAR</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionHeader: { fontSize: 22, fontWeight: 'bold', backgroundColor: '#f5f5f5', paddingVertical: 10, marginTop: 15, color: '#333' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  bebidaNombre: { fontSize: 18, fontWeight: '600' },
  bebidaPrecio: { fontSize: 16, color: '#666' },
  controles: { flexDirection: 'row', alignItems: 'center' },
  btn: { width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center' },
  btnPlus: { backgroundColor: '#007AFF' },
  btnMinus: { backgroundColor: '#ff3b30' },
  btnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  cantidad: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 10 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#333', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.3, elevation: 10 },
  totalText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  pedirBtn: { backgroundColor: '#34C759', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  pedirText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
