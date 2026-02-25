import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

// ─── Material 3 Expressive tokens ────────────────────────────────────────────
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
};

// ─── Press animation ──────────────────────────────────────────────────────────
function PressCard({ onPress, style, children }: { onPress: () => void; style?: any; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={handlePress} android_ripple={{ color: 'rgba(0,0,0,0.08)' }}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── ActionCard ───────────────────────────────────────────────────────────────
function ActionCard({ icon, label, bg, color, onPress }: { icon: string; label: string; bg: string; color: string; onPress: () => void }) {
  return (
    <PressCard onPress={onPress} style={[styles.actionCard, { backgroundColor: bg }]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </PressCard>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { userInfo, logout, refreshUser } = useContext(AuthContext);
  const [adminMenuVisible, setAdminMenuVisible] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => { refreshUser(); }, []));

  const saldo = parseFloat(userInfo?.saldo ?? '0');
  const saldoColor = saldo > 0 ? M3.primary : saldo < 0 ? M3.error : M3.onSurfaceVariant;

  const isCliente = userInfo?.role === 'cliente';
  const isSuperAdmin = userInfo?.role === 'superadmin';
  const isAdmin = userInfo?.role !== 'cliente';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={M3.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Ongi etorri!</Text>
          {isSuperAdmin && (
            <TouchableOpacity style={styles.menuBtn} onPress={() => setAdminMenuVisible(true)} activeOpacity={0.75}>
              <Text style={styles.menuBtnText}>☰</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {isSuperAdmin ? '✨ SuperAdmin' : isAdmin ? '🛡️ Socio' : '🍺 Invitado'}
            </Text>
          </View>
          <Text style={styles.greetSmall}>¡Aupa,</Text>
          <Text style={styles.greetName}>{userInfo?.name}!</Text>
          <View style={[styles.saldoChip, { borderColor: saldoColor }]}>
            <Text style={styles.saldoChipLabel}>Saldo</Text>
            <Text style={[styles.saldoChipValue, { color: saldoColor }]}>
              {saldo >= 0 ? '+' : ''}{saldo.toFixed(2)} €
            </Text>
          </View>
        </View>

        {/* Extended FAB */}
        <PressCard style={styles.fab} onPress={() => router.push('/carta')}>
          <Text style={styles.fabIcon}>🍺</Text>
          <Text style={styles.fabText}>PEDIR A MI SOCIO</Text>
        </PressCard>

        {/* Action cards — 2 columnas con width explícito */}
        <View style={styles.grid}>

          <View style={styles.halfCol}>
            <ActionCard
              icon="🧾" label="Mi Cuenta"
              bg={M3.tertiaryContainer} color={M3.onTertiaryContainer}
              onPress={() => router.push('/mi-cuenta')}
            />
          </View>

          {isCliente && (
            <View style={styles.halfCol}>
              <ActionCard
                icon="🍺" label="Mis Camareros"
                bg={M3.secondaryContainer} color={M3.onSecondaryContainer}
                onPress={() => router.push('/elegir-camareros')}
              />
            </View>
          )}

          {isAdmin && (
            <>
              <View style={styles.halfCol}>
                <ActionCard
                  icon="👨‍🍳" label="Ver Pedidos"
                  bg={M3.secondaryContainer} color={M3.onSecondaryContainer}
                  onPress={() => router.push('/comanda')}
                />
              </View>
              <View style={styles.halfCol}>
                <ActionCard
                  icon="📈" label="Estadísticas"
                  bg={M3.purple} color={M3.onPurple}
                  onPress={() => router.push('/estadisticas')}
                />
              </View>
            </>
          )}

        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom sheet SuperAdmin */}
      {isSuperAdmin && (
        <Modal animationType="slide" transparent visible={adminMenuVisible} onRequestClose={() => setAdminMenuVisible(false)}>
          <Pressable style={styles.scrim} onPress={() => setAdminMenuVisible(false)}>
            <Pressable style={styles.sheet} onPress={() => { }}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Opciones de Admin</Text>

              <PressCard
                style={[styles.sheetCard, { backgroundColor: M3.primaryContainer }]}
                onPress={() => { setAdminMenuVisible(false); router.push('/gestion-usuarios'); }}
              >
                <Text style={styles.sheetCardIcon}>👥</Text>
                <Text style={[styles.sheetCardText, { color: M3.onPrimaryContainer }]}>Gestionar Usuarios</Text>
              </PressCard>

              <PressCard
                style={[styles.sheetCard, { backgroundColor: M3.tertiaryContainer }]}
                onPress={() => { setAdminMenuVisible(false); router.push('/gestion-bebidas'); }}
              >
                <Text style={styles.sheetCardIcon}>🍹</Text>
                <Text style={[styles.sheetCardText, { color: M3.onTertiaryContainer }]}>Gestionar Bebidas</Text>
              </PressCard>

              <TouchableOpacity style={styles.sheetCloseRow} onPress={() => setAdminMenuVisible(false)} activeOpacity={0.7}>
                <Text style={styles.sheetCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  scroll: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  appTitle: { fontSize: 22, fontWeight: '800', color: M3.onSurface, letterSpacing: -0.3 },
  menuBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: M3.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  menuBtnText: { fontSize: 20, color: M3.onSurfaceVariant },

  heroCard: {
    backgroundColor: M3.primaryContainer,
    borderRadius: M3.shapeXL,
    padding: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45,106,31,0.18)',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '600', color: M3.primary },
  greetSmall: { fontSize: 30, fontWeight: '400', color: M3.onPrimaryContainer, lineHeight: 36 },
  greetName: { fontSize: 38, fontWeight: '800', color: M3.primary, lineHeight: 44, marginBottom: 20 },
  saldoChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 2,
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saldoChipLabel: { fontSize: 14, fontWeight: '500', color: M3.onSurfaceVariant },
  saldoChipValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: M3.primary,
    borderRadius: M3.shapeXXL,
    paddingVertical: 22,
    marginBottom: 16,
    shadowColor: M3.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 6,
  },
  fabIcon: { fontSize: 26 },
  fabText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  // ── GRID: usa width porcentual para que funcione con flexWrap ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,   // compensa el padding de halfCol
    marginBottom: 8,
  },
  halfCol: {
    width: '50%',
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  actionCard: {
    borderRadius: M3.shapeL,
    padding: 20,
    minHeight: 112,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: { fontSize: 30 },
  actionLabel: { fontSize: 14, fontWeight: '700', lineHeight: 18, marginTop: 8 },

  logoutBtn: { alignSelf: 'center', marginTop: 16, paddingVertical: 12, paddingHorizontal: 28 },
  logoutText: { color: M3.error, fontSize: 15, fontWeight: '600' },

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
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: M3.outlineVariant, marginBottom: 24 },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: M3.onSurface, marginBottom: 20 },
  sheetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: M3.shapeL,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetCardIcon: { fontSize: 24 },
  sheetCardText: { fontSize: 16, fontWeight: '700' },
  sheetCloseRow: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: M3.outline,
  },
  sheetCloseText: { fontSize: 15, fontWeight: '600', color: M3.onSurfaceVariant },
});