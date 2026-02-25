import { useFocusEffect } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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

  gold: '#FFF0C2',
  onGold: '#3A2800',
  goldAccent: '#E6A800',

  shapeXXL: 50,
  shapeXL: 36,
  shapeL: 28,
  shapeM: 16,
  shapeS: 12,
};

// ─── Medal colors ─────────────────────────────────────────────────────────────
const MEDALS = [
  { bg: '#FFF0C2', text: '#7A5200', border: '#E6A800', emoji: '🥇' },
  { bg: '#F0F0F0', text: '#444', border: '#AAA', emoji: '🥈' },
  { bg: '#FFE8D6', text: '#7A3200', border: '#CD7F32', emoji: '🥉' },
];

export default function EstadisticasScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useContext(AuthContext);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/estadisticas');
      setData(response.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { cargarDatos(); }, []));

  const borrarHistorial = () => {
    showConfirm(
      '⚠️ ¿Estás seguro?',
      'Esto borrará TODOS los pedidos y el historial de ventas. No se puede deshacer.',
      async () => {
        try {
          await api.delete('/admin/reset-pedidos');
          await Promise.all([cargarDatos(), refreshUser()]);
          showAlert('🧹 Limpieza completada', 'Se ha borrado todo el historial y los saldos se han reiniciado a 0.');
        } catch {
          showAlert('Error', 'No se pudo borrar el historial');
        }
      }
    );
  };

  // ── Loading ──
  if (loading && !data) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={M3.primary} />
      <Text style={styles.loadingText}>Cargando estadísticas...</Text>
    </View>
  );

  // ── Error ──
  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorEmoji}>😕</Text>
      <Text style={styles.errorTitle}>Algo fue mal</Text>
      <Text style={styles.errorMsg}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={cargarDatos} activeOpacity={0.8}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const maxVendido = data?.resumen?.[0]?.total_vendido ?? 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={M3.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estadísticas 📈</Text>
        <Text style={styles.headerSubtitle}>Resumen de ventas</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={cargarDatos}
            tintColor={M3.primary}
            colors={[M3.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ── RANKING ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Ranking de Bebidas</Text>
        </View>

        {(!data?.resumen || data.resumen.length === 0) ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🍺</Text>
            <Text style={styles.emptyText}>Nada servido aún</Text>
          </View>
        ) : (
          <View style={styles.rankingCard}>
            {data.resumen.map((item: any, index: number) => {
              const medal = MEDALS[index] ?? null;
              const barWidth = Math.max(8, (item.total_vendido / maxVendido) * 100);
              return (
                <View key={index} style={[styles.rankRow, index < data.resumen.length - 1 && styles.rankRowBorder]}>
                  <View style={styles.rankLeft}>
                    {medal ? (
                      <View style={[styles.medalBadge, { backgroundColor: medal.bg, borderColor: medal.border }]}>
                        <Text style={styles.medalEmoji}>{medal.emoji}</Text>
                      </View>
                    ) : (
                      <View style={styles.rankNumBadge}>
                        <Text style={styles.rankNum}>{index + 1}</Text>
                      </View>
                    )}
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName}>{item.nombre}</Text>
                      {/* Progress bar */}
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${barWidth}%` as any }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.rankUdsBadge}>
                    <Text style={styles.rankUds}>{item.total_vendido}</Text>
                    <Text style={styles.rankUdsLabel}>uds</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── CUENTAS ── */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>🧾 Cuentas por Persona</Text>
        </View>

        {(!data?.historial || data.historial.length === 0) ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={styles.emptyText}>No hay consumos registrados</Text>
          </View>
        ) : (
          data.historial.map((cliente: any) => {
            const gasto = parseFloat(String(cliente.total_gastado));
            const gastoBg = gasto > 0 ? M3.errorContainer : M3.primaryContainer;
            const gastoColor = gasto > 0 ? M3.error : M3.primary;
            return (
              <View key={cliente.id} style={styles.clienteCard}>
                {/* Card header */}
                <View style={styles.clienteHeader}>
                  <View style={styles.clienteAvatarRow}>
                    <View style={styles.clienteAvatar}>
                      <Text style={styles.clienteAvatarText}>
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
                  </View>
                  <View style={[styles.gastoBadge, { backgroundColor: gastoBg }]}>
                    <Text style={[styles.gastoText, { color: gastoColor }]}>
                      {gasto >= 0 ? '+' : ''}{gasto.toFixed(2)} €
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.clienteDivider} />

                {/* Consumos */}
                <Text style={styles.consumidoLabel}>Ha consumido</Text>
                <View style={styles.consumosList}>
                  {Object.entries(cliente.bebidas).map(([nombreBebida, cantidad]: any, i) => (
                    <View key={i} style={styles.consumoChip}>
                      <Text style={styles.consumoCantidad}>{cantidad}×</Text>
                      <Text style={styles.consumoNombre}>{nombreBebida}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}

        {/* ── BOTÓN DEL PÁNICO ── */}
        {data?.historial?.length > 0 && (
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={borrarHistorial}
            activeOpacity={0.85}
          >
            <Text style={styles.dangerBtnText}>🗑️  Borrar todos los pedidos</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: M3.background, gap: 10 },
  loadingText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },
  errorEmoji: { fontSize: 48, marginBottom: 4 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: M3.onSurface },
  errorMsg: { fontSize: 15, color: M3.onSurfaceVariant, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: M3.primary,
    borderRadius: M3.shapeXXL,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryText: { color: M3.onPrimary, fontWeight: '700', fontSize: 15 },

  // Header
  header: {
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

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: M3.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  emptyCard: {
    backgroundColor: M3.surface,
    borderRadius: M3.shapeL,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 15, color: M3.onSurfaceVariant, fontWeight: '500' },

  // Ranking card
  rankingCard: {
    backgroundColor: M3.surface,
    borderRadius: M3.shapeL,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rankRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: M3.outlineVariant,
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  medalBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalEmoji: { fontSize: 18 },
  rankNumBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: M3.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: { fontSize: 14, fontWeight: '700', color: M3.onSurfaceVariant },
  rankInfo: { flex: 1, gap: 6 },
  rankName: { fontSize: 15, fontWeight: '700', color: M3.onSurface },
  barTrack: {
    height: 5,
    backgroundColor: M3.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: M3.primary,
    borderRadius: 3,
  },
  rankUdsBadge: {
    alignItems: 'center',
    backgroundColor: M3.primaryContainer,
    borderRadius: M3.shapeM,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 52,
  },
  rankUds: { fontSize: 16, fontWeight: '800', color: M3.primary },
  rankUdsLabel: { fontSize: 10, fontWeight: '600', color: M3.onPrimaryContainer, textTransform: 'uppercase', letterSpacing: 0.3 },

  // Cliente card
  clienteCard: {
    backgroundColor: M3.surface,
    borderRadius: M3.shapeL,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clienteAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clienteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: M3.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clienteAvatarText: { fontSize: 18, fontWeight: '800', color: M3.onSecondaryContainer },
  clienteNombre: { fontSize: 17, fontWeight: '700', color: M3.onSurface },
  gastoBadge: {
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  gastoText: { fontSize: 15, fontWeight: '800' },
  clienteDivider: { height: 1, backgroundColor: M3.outlineVariant, marginBottom: 12 },
  consumidoLabel: { fontSize: 11, fontWeight: '600', color: M3.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  consumosList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  consumoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: M3.surfaceVariant,
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  consumoCantidad: { fontSize: 13, fontWeight: '800', color: M3.primary },
  consumoNombre: { fontSize: 13, fontWeight: '500', color: M3.onSurfaceVariant },

  // Danger button
  dangerBtn: {
    marginTop: 24,
    backgroundColor: M3.errorContainer,
    borderRadius: M3.shapeXXL,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: M3.error,
  },
  dangerBtnText: {
    color: M3.error,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});