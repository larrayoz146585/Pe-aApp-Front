import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alertHelper';

// ─── M3 tokens ────────────────────────────────────────────────────────────────
const M3 = {
  primary: '#2D6A1F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#B7F397',
  onPrimaryContainer: '#042100',

  secondaryContainer: '#BFE0B0',
  onSecondaryContainer: '#131F0D',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Dark surface para pantalla de cocina — contraste alto, legible de lejos
  surfaceDark: '#1A1C18',
  surfaceDark2: '#252822',
  surfaceDark3: '#2E3229',
  onSurfaceDark: '#E2E3DB',
  onSurfaceDarkVar: '#C3C8BB',
  outlineDark: '#454942',

  surface: '#F5F7EF',
  onSurface: '#191D16',
  onSurfaceVariant: '#434940',
  outlineVariant: '#C3C8BB',
  background: '#F0F2EA',

  shapeXXL: 50,
  shapeXL: 36,
  shapeL: 28,
  shapeM: 16,
  shapeS: 12,
};

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
    <Pressable onPress={go} android_ripple={{ color: 'rgba(255,255,255,0.1)' }}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── PedidoCard ───────────────────────────────────────────────────────────────
function PedidoCard({ item, onServir, onCancelar }: {
  item: any; onServir: () => void; onCancelar: () => void;
}) {
  const totalPedido = parseFloat(item.total ?? 0);
  const fecha = new Date(item.created_at);
  const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // Calcular minutos desde que llegó el pedido
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  const urgente = minutos >= 5;

  return (
    <View style={[styles.card, urgente && styles.cardUrgente]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.clienteNombre}>{item.user.name}</Text>
              <Text style={styles.horaText}>hace {minutos < 1 ? 'menos de 1 min' : `${minutos} min`}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          {urgente && (
            <View style={styles.urgenteBadge}>
              <Text style={styles.urgenteText}>🔥 Urgente</Text>
            </View>
          )}
          <Text style={styles.horaChip}>{hora}</Text>
          <View style={styles.totalChip}>
            <Text style={styles.totalChipText}>{totalPedido.toFixed(2)} €</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Bebidas */}
      <View style={styles.bebidasList}>
        {item.detalles.map((d: any, i: number) => (
          <View key={i} style={styles.bebidaRow}>
            <View style={styles.cantidadBadge}>
              <Text style={styles.cantidadText}>{d.cantidad}×</Text>
            </View>
            <Text style={styles.bebidaNombre}>{d.bebida.nombre}</Text>
            <Text style={styles.bebidaPrecio}>
              {(d.precio_unitario * d.cantidad).toFixed(2)} €
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ScalePress style={styles.btnCancelar} onPress={onCancelar}>
          <Text style={styles.btnCancelarText}>  Cancelar  </Text>
        </ScalePress>
        <ScalePress style={styles.btnServir} onPress={onServir}>
          <Text style={styles.btnServirText}>   Servido   </Text>
        </ScalePress>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ComandaScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const router = useRouter();
  const { refreshUser } = useContext(AuthContext);

  const pedidosIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarComandas = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const response = await api.get('/admin/pedidos');
      const nuevosPedidos: any[] = response.data;

      if (!isFirstLoad.current) {
        const hayNuevas = nuevosPedidos.some(p => !pedidosIdsRef.current.has(p.id));
        if (hayNuevas && Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }

      pedidosIdsRef.current = new Set(nuevosPedidos.map(p => p.id));
      isFirstLoad.current = false;
      setPedidos(nuevosPedidos);
      setLastUpdate(new Date());
    } catch (error: any) {
      if (!silencioso) showAlert('Error', error.response?.data?.message || 'No puedes ver esto');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      isFirstLoad.current = true;
      cargarComandas();
      intervalRef.current = setInterval(() => cargarComandas(true), 15000);
      return () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      };
    }, [])
  );

  const marcarServido = async (id: number) => {
    try {
      await api.put(`/pedidos/${id}/servir`);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Promise.all([cargarComandas(), refreshUser()]);
    } catch { showAlert('Error', 'No se pudo marcar como servido'); }
  };

  const cancelarPedido = (id: number) => {
    showConfirm(
      '¿Cancelar Pedido?',
      'Esta acción eliminará el pedido. ¿Estás seguro?',
      async () => {
        try {
          await api.delete(`/admin/pedidos/${id}`);
          showAlert('Éxito', 'El pedido ha sido cancelado.');
          cargarComandas();
        } catch (error: any) {
          showAlert('Error', error.response?.data?.message || 'No se pudo cancelar.');
        }
      }
    );
  };

  if (loading && pedidos.length === 0) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={M3.primaryContainer} />
      <Text style={styles.loadingText}>Cargando comandas...</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={M3.surfaceDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pedidos </Text>
          <Text style={styles.headerSubtitle}>
            {pedidos.length > 0
              ? `${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} pendiente${pedidos.length > 1 ? 's' : ''}`
              : 'Todo al día'}
          </Text>
        </View>
        {/* Live indicator */}
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {pedidos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Nada que servir</Text>
          <Text style={styles.emptySubtitle}>Se actualiza automáticamente cada 15s </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => cargarComandas()}
              tintColor={M3.primaryContainer}
              colors={[M3.primary]}
            />
          }
          renderItem={({ item }) => (
            <PedidoCard
              item={item}
              onServir={() => marcarServido(item.id)}
              onCancelar={() => cancelarPedido(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.surfaceDark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: M3.surfaceDark },
  loadingText: { fontSize: 15, color: M3.onSurfaceDarkVar, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: M3.onSurfaceDark, letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, color: M3.onSurfaceDarkVar, fontWeight: '500', marginTop: 2 },

  // Live chip
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: M3.surfaceDark3,
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: M3.outlineDark,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: M3.primaryContainer,
  },
  liveText: { fontSize: 13, fontWeight: '700', color: M3.onSurfaceDarkVar },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 60,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 4 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: M3.onSurfaceDark },
  emptySubtitle: { fontSize: 14, color: M3.onSurfaceDarkVar },

  // Card
  card: {
    backgroundColor: M3.surfaceDark2,
    borderRadius: M3.shapeL,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: M3.outlineDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardUrgente: {
    borderColor: '#E6A800',
    shadowColor: '#E6A800',
    shadowOpacity: 0.25,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardHeaderLeft: {},
  cardHeaderRight: { alignItems: 'flex-end', gap: 6 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: M3.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: M3.primary },
  clienteNombre: { fontSize: 17, fontWeight: '800', color: M3.onSurfaceDark },
  horaText: { fontSize: 12, color: M3.onSurfaceDarkVar, marginTop: 1 },

  urgenteBadge: {
    backgroundColor: '#3A2800',
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E6A800',
  },
  urgenteText: { fontSize: 11, fontWeight: '700', color: '#E6A800' },
  horaChip: { fontSize: 13, fontWeight: '600', color: M3.onSurfaceDarkVar },
  totalChip: {
    backgroundColor: M3.surfaceDark3,
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  totalChipText: { fontSize: 15, fontWeight: '800', color: M3.primaryContainer },

  cardDivider: { height: 1, backgroundColor: M3.outlineDark, marginBottom: 14 },

  // Bebidas
  bebidasList: { gap: 10, marginBottom: 16 },
  bebidaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cantidadBadge: {
    backgroundColor: M3.surfaceDark3,
    borderRadius: M3.shapeS,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 34,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: M3.outlineDark,
  },
  cantidadText: { fontSize: 13, fontWeight: '800', color: M3.primaryContainer },
  bebidaNombre: { flex: 1, fontSize: 16, fontWeight: '600', color: M3.onSurfaceDark },
  bebidaPrecio: { fontSize: 13, fontWeight: '600', color: M3.onSurfaceDarkVar },

  // Actions
  actions: { flexDirection: 'row', gap: 10 },
  btnCancelar: {
    flex: 1,
    borderRadius: M3.shapeXXL,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: M3.outlineDark,
  },
  btnCancelarText: { color: M3.onSurfaceDarkVar, fontSize: 14, fontWeight: '700' },
  btnServir: {
    flex: 2,
    backgroundColor: M3.primary,
    borderRadius: M3.shapeXXL,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: M3.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  btnServirText: { color: M3.onPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});