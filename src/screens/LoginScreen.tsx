import React, { useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { showAlert } from '../utils/alertHelper';

// ─── Material 3 Expressive tokens (igual que HomeScreen) ──────────────────────
const M3 = {
  primary: '#2D6A1F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#B7F397',
  onPrimaryContainer: '#042100',

  secondaryContainer: '#BFE0B0',
  onSecondaryContainer: '#131F0D',

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
  shapeM: 16,
  shapeS: 12,
};

// ─── Press animation ──────────────────────────────────────────────────────────
function PressCard({ onPress, style, children, disabled }: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Focused Input ────────────────────────────────────────────────────────────
function M3Input({ placeholder, value, onChangeText, secureTextEntry, autoCapitalize }: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={M3.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'none'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { login, register } = useContext(AuthContext);

  const handleSubmit = async () => {
    if (!name || !password) {
      showAlert('Faltan datos', 'Pon tu nombre y una contraseña');
      return;
    }
    setLoading(true);
    try {
      if (isRegistering) {
        await register(name, password);
        showAlert('¡Bienvenido!', 'Usuario creado correctamente.');
      } else {
        await login(name, password);
      }
    } catch (error: any) {
      console.log('Error completo:', error);
      const errorDelServidor = error.response?.data?.message || error.message;
      showAlert('Error Real 🛑', errorDelServidor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={M3.background} />

      {/* ── Decoración superior ── */}
      <View style={styles.topBlob} />

      {/* ── Hero ── */}
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🍻</Text>
        <Text style={styles.heroTitle}>PEÑA APP</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {isRegistering ? '✨ Nuevo socio' : '👋 Bienvenido de vuelta'}
          </Text>
        </View>
        <Text style={styles.heroSubtitle}>
          {isRegistering
            ? 'Crea tu cuenta para pedir'
            : 'Identifícate para beber'}
        </Text>
      </View>

      {/* ── Card formulario ── */}
      <View style={styles.formCard}>

        <M3Input
          placeholder="Tu nombre (ej: Patxi)"
          value={name}
          onChangeText={setName}
        />

        <M3Input
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Botón principal */}
        <PressCard style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={M3.onPrimary} />
            : <Text style={styles.submitBtnText}>
              {isRegistering ? 'Crear cuenta y entrar' : 'Entrar'}
            </Text>
          }
        </PressCard>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Toggle registro/login */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => setIsRegistering(!isRegistering)}
          activeOpacity={0.7}
        >
          <Text style={styles.switchBtnText}>
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿Eres nuevo? Regístrate aquí'}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: M3.background,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },

  // Blob decorativo arriba
  topBlob: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: M3.primaryContainer,
    opacity: 0.55,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: M3.onSurface,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroBadge: {
    backgroundColor: M3.primaryContainer,
    borderRadius: M3.shapeXXL,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: M3.primary,
  },
  heroSubtitle: {
    fontSize: 15,
    color: M3.onSurfaceVariant,
    fontWeight: '400',
  },

  // Form card — sube desde abajo
  formCard: {
    backgroundColor: M3.surface,
    borderTopLeftRadius: M3.shapeXL,
    borderTopRightRadius: M3.shapeXL,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },

  // Input
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: M3.outlineVariant,
    borderRadius: M3.shapeM,
    backgroundColor: M3.background,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputWrapperFocused: {
    borderColor: M3.primary,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  input: {
    fontSize: 16,
    color: M3.onSurface,
    paddingVertical: 14,
  },

  // Submit button
  submitBtn: {
    backgroundColor: M3.primary,
    borderRadius: M3.shapeXXL,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: M3.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
  submitBtnText: {
    color: M3.onPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: M3.outlineVariant,
  },
  dividerText: {
    fontSize: 13,
    color: M3.onSurfaceVariant,
    fontWeight: '500',
  },

  // Switch
  switchBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: M3.shapeXXL,
  },
  switchBtnText: {
    color: M3.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});