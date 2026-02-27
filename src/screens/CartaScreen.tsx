import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { showAlert } from '../utils/alertHelper';

// ─── M3 tokens (misma paleta que HomeScreen y LoginScreen) ───────────────────
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
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',

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
}
interface ItemCarrito {
  bebida: Bebida;
  cantidad: number;
}
interface SeccionBebidas {
  title: string;
  data: Bebida[];
}

// ─── Press animation ──────────────────────────────────────────────────────────
function ScalePress({ onPress, style, children, disabled }: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
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

// ─── BebidaCard ───────────────────────────────────────────────────────────────
function BebidaCard({ item, cantidad, onAdd, onRemove, isFavorito, onToggleFavorito }: {
  item: Bebida;
  cantidad: number;
  onAdd: () => void;
  onRemove: () => void;
  isFavorito: boolean;
  onToggleFavorito: () => void;
}) {
  const inCart = cantidad > 0;

  return (
    <View style={[styles.card, inCart && styles.cardActive]}>

      {/* ── Info ── */}
      <View style={styles.cardInfo}>

        {/* NUEVO: Metemos la estrella y el nombre en una fila (row) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={onToggleFavorito} activeOpacity={0.7}>
            <Text style={{ fontSize: 22 }}>
              {isFavorito ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.cardNombre}>{item.nombre}</Text>
        </View>
        {/* FIN NUEVO */}

        <View style={[styles.priceBadge, inCart && styles.priceBadgeActive]}>
          <Text style={[styles.cardPrecio, inCart && styles.cardPrecioActive]}>
            {parseFloat(String(item.precio)).toFixed(2)} €
          </Text>
        </View>
      </View>

      {/* ── Controles (ESTO SE QUEDA IGUAL) ── */}
      <View style={styles.controles}>
        {inCart && (
          <>
            <ScalePress style={styles.btnMinus} onPress={onRemove}>
              <Text style={styles.btnMinusText}>−</Text>
            </ScalePress>
            <Text style={styles.cantidad}>{cantidad}</Text>
          </>
        )}
        <ScalePress style={styles.btnPlus} onPress={onAdd}>
          <Text style={styles.btnPlusText}>{inCart ? '+' : '+ Añadir'}</Text>
        </ScalePress>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CartaScreen() {
  const router = useRouter();
  const { userInfo } = useContext(AuthContext);

  const [secciones, setSecciones] = useState<SeccionBebidas[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const nombresCategorias = secciones.map(s => s.title);
  const categoriasDisponibles = ['Todas', ...nombresCategorias];

  // Animación del footer
  const footerY = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    api.get('/bebidas')
      .then(response => {
        const bebidasAgrupadas = response.data;
        const arraySecciones = Object.keys(bebidasAgrupadas).map(categoria => ({
          title: categoria,
          data: bebidasAgrupadas[categoria],
        }));
        setSecciones(arraySecciones);
        setLoading(false);
      })
      .catch(() => {
        showAlert('Error', 'No se ha podido cargar la carta');
        setLoading(false);
      });
  }, []);

  // Animar footer al aparecer/desaparecer
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
  useEffect(() => {
    Animated.spring(footerY, {
      toValue: totalItems > 0 ? 0 : 120,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6,
    }).start();
  }, [totalItems]);

  const agregarBebida = (bebida: Bebida) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.bebida.id === bebida.id);
      if (existe) return prev.map(i => i.bebida.id === bebida.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { bebida, cantidad: 1 }];
    });
  };

  const quitarBebida = (bebida: Bebida) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.bebida.id === bebida.id);
      if (existe && existe.cantidad > 1) return prev.map(i => i.bebida.id === bebida.id ? { ...i, cantidad: i.cantidad - 1 } : i);
      return prev.filter(i => i.bebida.id !== bebida.id);
    });
  };

  const total = carrito.reduce((s, i) => s + parseFloat(String(i.bebida.precio)) * i.cantidad, 0);

  const confirmarPedido = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    try {
      const items = carrito.map(i => ({ bebida_id: i.bebida.id, cantidad: i.cantidad }));
      await api.post('/pedidos', { items });
      showAlert('¡Oído Cocina! 🍻', 'Tu pedido se ha enviado.', () => router.back());
      setCarrito([]);
    } catch (error: any) {
      console.log('Error completo:', error);
      const respuestaServidor = error.response?.data;
      const mensajeError = JSON.stringify(respuestaServidor) || error.message;
      showAlert('Detectado Error 🛑', mensajeError);
    } finally {
      setEnviando(false);
    }
  };
  const toggleFavorito = (idBebida: number) => {
    setFavoritos(prev => {
      if (prev.includes(idBebida)) {
        return prev.filter(id => id !== idBebida);
      }
      return [...prev, idBebida];
    });
  };
  // 1. Buscamos las bebidas favoritas en TODA la carta
  // .flatMap aplana los arrays (como sacar todas las bebidas de sus cajas)
  // 1. Sacamos las bebidas favoritas de toda la carta
  const bebidasFavoritas = secciones
    .flatMap(s => s.data)
    .filter(bebida => favoritos.includes(bebida.id));

  // 2. NUEVO: Limpiamos las secciones originales para quitar las favoritas de su sitio viejo
  const seccionesLimpias = secciones.map(seccion => ({
    ...seccion,
    // Nos quedamos SOLO con las bebidas que NO ( ! ) están en la lista de favoritos
    data: seccion.data.filter(bebida => !favoritos.includes(bebida.id))
  }));

  // 3. Juntamos la categoría VIP (si hay) con las secciones limpias
  const seccionesConFavoritos = bebidasFavoritas.length > 0
    ? [{ title: '⭐ Mis Favoritos', data: bebidasFavoritas }, ...seccionesLimpias]
    : seccionesLimpias;

  // 4. Tus filtros de botones y buscador (se quedan exactamente igual)
  const seccionesFiltradas = seccionesConFavoritos
    .filter(seccion =>
      categoriaSeleccionada === 'Todas' || seccion.title === categoriaSeleccionada
    )
    .map(seccion => {
      const coincideCategoria = seccion.title.toLowerCase().includes(busqueda.toLowerCase());
      const data = seccion.data.filter(b =>
        coincideCategoria || b.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      return { ...seccion, data };
    })
    // Limpieza final de categorías vacías
    .filter(s => s.data.length > 0);


  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={M3.primary} />
      <Text style={styles.loadingText}>Cargando la carta...</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={M3.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>La Carta 🍹</Text>
          <Text style={styles.headerSubtitle}>Peña Sanduzelai</Text>
        </View>
        {totalItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        )}
      </View>

      {/* ── Búsqueda ── */}
      <View style={[styles.searchWrapper, searchFocused && styles.searchWrapperFocused]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Busca tu bebida..."
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
      {/* ── Filtros de Categoría (Píldoras) ── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {categoriasDisponibles.map((cat, index) => {
            const isSelected = categoriaSeleccionada === cat;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setCategoriaSeleccionada(cat)}
                style={{
                  backgroundColor: isSelected ? M3.primary : M3.surfaceVariant,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: M3.shapeXXL,
                }}
              >
                <Text style={{
                  color: isSelected ? M3.onPrimary : M3.onSurfaceVariant,
                  fontWeight: isSelected ? 'bold' : '600'
                }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Lista ── */}
      <SectionList
        sections={seccionesFiltradas}
        // Le sumamos el index para que no choque si la bebida está repetida en favoritos
        keyExtractor={(item, index) => item.id.toString() + '-' + index}
        contentContainerStyle={styles.listContent}

        // ... resto de tu SectionList ...

        renderItem={({ item }) => {
          const enCarrito = carrito.find(c => c.bebida.id === item.id);
          const esFav = favoritos.includes(item.id); // Comprobamos si es favorita
          return (
            <BebidaCard
              item={item}
              cantidad={enCarrito?.cantidad ?? 0}
              onAdd={() => agregarBebida(item)}
              onRemove={() => quitarBebida(item)}
              isFavorito={esFav} // Se lo pasamos a la tarjeta
              onToggleFavorito={() => toggleFavorito(item.id)} // Le pasamos la acción
            />
          );
        }}
      />

      {/* ── Footer flotante ── */}
      <Animated.View style={[styles.footer, { transform: [{ translateY: footerY }] }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total pedido</Text>
          <Text style={styles.footerTotal}>{total.toFixed(2)} €</Text>
        </View>
        <ScalePress
          style={styles.confirmarBtn}
          onPress={confirmarPedido}
          disabled={enviando}
        >
          {enviando
            ? <ActivityIndicator color={M3.onPrimary} />
            : <Text style={styles.confirmarText}>Confirmar 🍺</Text>
          }
        </ScalePress>
      </Animated.View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: M3.onSurface,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: M3.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  cartBadge: {
    backgroundColor: M3.primary,
    borderRadius: M3.shapeXXL,
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cartBadgeText: {
    color: M3.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },

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
  searchWrapperFocused: {
    borderColor: M3.primary,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: M3.onSurface,
    paddingVertical: 12,
  },
  searchClear: {
    fontSize: 13,
    color: M3.onSurfaceVariant,
    fontWeight: '600',
    padding: 4,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '800',
    color: M3.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: M3.primaryContainer,
    borderRadius: 1,
  },

  // BebidaCard
  card: {
    backgroundColor: M3.surface,
    borderRadius: M3.shapeL,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: {
    backgroundColor: '#FAFFFC',
    borderColor: M3.primaryContainer,
  },
  cardInfo: { flex: 1, gap: 6 },
  cardNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: M3.onSurface,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: M3.surfaceVariant,
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  priceBadgeActive: {
    backgroundColor: M3.primaryContainer,
  },
  cardPrecio: {
    fontSize: 13,
    fontWeight: '600',
    color: M3.onSurfaceVariant,
  },
  cardPrecioActive: {
    color: M3.primary,
  },

  // Controles
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnMinus: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: M3.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMinusText: {
    color: M3.error,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  cantidad: {
    fontSize: 17,
    fontWeight: '800',
    color: M3.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  btnPlus: {
    height: 34,
    borderRadius: 17,
    backgroundColor: M3.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  btnPlusText: {
    color: M3.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: M3.onSurface,
    borderRadius: M3.shapeXL,
    paddingVertical: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  footerLeft: { gap: 2 },
  footerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  confirmarBtn: {
    backgroundColor: M3.primary,
    borderRadius: M3.shapeXXL,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: M3.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmarText: {
    color: M3.onPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});