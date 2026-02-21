import React, { useContext, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { showAlert } from '../utils/alertHelper';
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
      console.log("Error completo:", error); // Para verlo en la terminal de Expo

      // Intentamos sacar el error exacto que manda Laravel o el error de red
      const errorDelServidor = error.response?.data?.message || error.message;

      showAlert('Error Real 🛑', errorDelServidor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍻</Text>
      <Text style={styles.title}>PeñaApp</Text>
      <Text style={styles.subtitle}>
        {isRegistering ? 'Crea tu cuenta para pedir' : 'Identifícate para beber'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Tu Nombre (Ej: Patxi)"
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegistering ? 'Crear Cuenta y Entrar' : 'Entrar'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchButton}>
        <Text style={styles.switchText}>{isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Eres nuevo? Regístrate aquí'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f2f2f2' },
  emoji: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#333' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#007AFF', fontSize: 14 }
});
