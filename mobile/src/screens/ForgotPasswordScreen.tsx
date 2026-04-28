import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../services/api';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

function InputIcon({ char, color, bg }: { char: string; color: string; bg: string }) {
  return (
    <View style={[iconStyles.wrap, { backgroundColor: bg }]}>
      <Text style={[iconStyles.char, { color }]}>{char}</Text>
    </View>
  );
}
const iconStyles = StyleSheet.create({
  wrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  char: { fontSize: 14, fontWeight: '800' },
});

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorX = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 45, friction: 8 }),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(cardY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (sent) {
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 40, friction: 8 }).start();
    }
  }, [sent]);

  function shake() {
    Animated.sequence([
      Animated.timing(errorX, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  async function handleSend() {
    if (!email.trim()) {
      setError('Ingresa tu correo institucional.');
      shake();
      return;
    }
    const lower = email.trim().toLowerCase();
    if (!lower.endsWith('.edu') && !lower.endsWith('.edu.co')) {
      setError('Debes usar tu correo institucional (.edu o .edu.co).');
      shake();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: lower });
      setSent(true);
    } catch (err: any) {
      const raw = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? '';
      const msg: string = Array.isArray(raw) ? (raw as string[]).join('. ') : String(raw);
      if (!err.response) {
        setError('Sin conexion al servidor. Verifica tu internet.');
      } else {
        setError(msg || 'Error al enviar el enlace. Intenta de nuevo.');
      }
      shake();
    } finally {
      setLoading(false);
    }
  }

  /* ── Estado: enlace enviado ── */
  if (sent) {
    return (
      <View style={styles.successBg}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
          <View style={styles.successCircle}>
            <Text style={styles.successChar}>✉</Text>
          </View>
          <Text style={styles.successTitle}>Revisa tu correo</Text>
          <Text style={styles.successBody}>
            Si la cuenta existe, enviamos un enlace a{'\n'}
            <Text style={styles.successEmail}>{email.trim().toLowerCase()}</Text>
          </Text>
          <Text style={styles.successHint}>
            Haz clic en el enlace del email para crear tu nueva contrasena.
            Revisa tambien la carpeta de spam.
          </Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Volver al inicio de sesion  →</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Volver</Text>
        </Pressable>
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: headerAnim }] }}>
          <View style={styles.lockBadge}>
            <Text style={styles.lockChar}>🔑</Text>
          </View>
          <Text style={styles.logoText}>Recuperar contrasena</Text>
          <Text style={styles.logoSub}>Te enviaremos un enlace seguro</Text>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.scrollBg}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}
        >
          <Text style={styles.cardTitle}>Olvidaste tu contrasena?</Text>
          <Text style={styles.cardSub}>
            Ingresa tu correo institucional y te enviaremos un enlace para crear una nueva contrasena.
          </Text>

          <View style={[styles.inputGroup, emailFocus && styles.inputFocused]}>
            <InputIcon char="@" color={COLORS.primary} bg={COLORS.primaryLight} />
            <TextInput
              style={styles.inputField}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="correo@universidad.edu.co"
              placeholderTextColor={COLORS.textLight}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>

          {error !== '' && (
            <Animated.View style={[styles.errorBox, { transform: [{ translateX: errorX }] }]}>
              <View style={styles.errorDot} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <Text style={styles.infoIconChar}>i</Text>
            </View>
            <Text style={styles.infoText}>
              Por seguridad, el enlace expira en 1 hora y solo funciona una vez.
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleSend}
              onPressIn={() =>
                Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 100, friction: 8 }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start()
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Enviar enlace  →</Text>
              )}
            </Pressable>
          </Animated.View>

          <Pressable style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Recordaste tu contrasena?  </Text>
            <Text style={styles.loginLink}>Iniciar sesion</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute', top: 54, left: 20,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  blob1: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  blob2: {
    position: 'absolute', bottom: -40, left: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(244,63,94,0.2)',
  },
  blob3: {
    position: 'absolute', top: 10, left: 50,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(245,158,11,0.25)',
  },
  lockBadge: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  lockChar: { fontSize: 32, fontWeight: '900', color: '#fff' },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  scrollBg: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 24, padding: 24, ...SHADOWS.medium,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  cardSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, lineHeight: 20 },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14, backgroundColor: COLORS.bg,
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  inputField: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12, padding: 12, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.accent,
  },
  errorDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginTop: 4,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.accentText, fontWeight: '600' },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  infoIconWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  infoIconChar: { fontSize: 12, fontWeight: '900', color: '#fff' },
  infoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18, fontWeight: '500' },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', ...SHADOWS.button,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  loginRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20,
  },
  loginText: { fontSize: 14, color: COLORS.textMuted },
  loginLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  /* Success screen */
  successBg: {
    flex: 1, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    padding: 24, overflow: 'hidden',
  },
  successCard: {
    backgroundColor: COLORS.card, borderRadius: 24,
    padding: 32, alignItems: 'center', width: '100%', ...SHADOWS.medium,
  },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successChar: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  successBody: {
    fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 8,
  },
  successEmail: { fontWeight: '700', color: COLORS.primary },
  successHint: {
    fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28, lineHeight: 19,
  },
});
