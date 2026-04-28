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
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Login'> };

/** Icono de texto dentro de un círculo coloreado — evita problemas de emoji */
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
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  char: { fontSize: 14, fontWeight: '800' },
});

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logoScale = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(50)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1, useNativeDriver: true, tension: 45, friction: 8,
      }),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(cardY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  function shake() {
    Animated.sequence([
      Animated.timing(errorX, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      shake();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await login(data.accessToken, data.userId);
    } catch (err: any) {
      const raw = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? '';
      const msg: string = Array.isArray(raw) ? (raw as string[]).join('. ') : String(raw);
      if (msg.includes('verificar') || msg.includes('verify')) {
        setError('Tu cuenta aun no esta verificada. Revisa tu correo o reenviale el enlace.');
        setShowResend(true);
        setResendStatus('idle');
      } else if (err.response?.status === 401) {
        setError('Correo o contrasena incorrectos.');
      } else if (err.response?.status === 400) {
        setError('Datos invalidos: ' + msg);
      } else if (!err.response) {
        setError('Sin conexion. Verifica tu internet.');
      } else {
        setError('Error ' + (err.response?.status ?? '') + ': ' + msg);
      }
      shake();
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (!email.trim() || resendCooldown > 0) return;
    setResendLoading(true);
    setResendStatus('idle');
    setResendError('');
    try {
      await api.post('/auth/resend-verification', { email: email.trim().toLowerCase() });
      setResendStatus('success');
      startCooldown();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? '';
      setResendError(msg ? String(msg) : 'Error de conexion. Verifica tu internet.');
      setResendStatus('error');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header decorativo */}
      <View style={styles.header}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: logoScale }] }}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>SC</Text>
          </View>
          <Text style={styles.logoText}>ShareCampus</Text>
          <Text style={styles.logoSub}>Tu comunidad universitaria</Text>
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
          <Text style={styles.greeting}>Hola de nuevo!</Text>
          <Text style={styles.greetingSub}>Inicia sesion para continuar</Text>

          {/* Email */}
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
            />
          </View>

          {/* Password */}
          <View style={[styles.inputGroup, passFocus && styles.inputFocused]}>
            <InputIcon char="**" color={COLORS.primary} bg={COLORS.primaryLight} />
            <TextInput
              style={styles.inputField}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="Contrasena"
              placeholderTextColor={COLORS.textLight}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
            />
            <Pressable
              onPress={() => setShowPass(s => !s)}
              hitSlop={8}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeText}>{showPass ? 'Ocultar' : 'Ver'}</Text>
            </Pressable>
          </View>

          {/* Olvidé mi contraseña */}
          <Pressable
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Olvidaste tu contrasena?</Text>
          </Pressable>

          {/* Error con shake */}
          {error !== '' && (
            <Animated.View
              style={[styles.errorBox, { transform: [{ translateX: errorX }] }]}
            >
              <View style={styles.errorDot} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Bloque de reenvio de verificacion */}
          {showResend && (
            <View style={styles.resendBox}>
              <Text style={styles.resendTitle}>Cuenta sin verificar</Text>
              <Text style={styles.resendHint}>
                Reenviaremos el enlace a{' '}
                <Text style={styles.resendEmail}>{email.trim().toLowerCase()}</Text>
              </Text>
              {resendStatus === 'success' && (
                <View style={styles.resendSuccess}>
                  <Text style={styles.resendSuccessText}>
                    Enlace enviado. Revisa tu bandeja de entrada y spam.
                  </Text>
                  <Pressable
                    onPress={() => { setShowResend(false); setError(''); setPassword(''); }}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={styles.resendRetryLoginText}>
                      Ya verifique → Intentar login
                    </Text>
                  </Pressable>
                </View>
              )}
              {resendStatus === 'error' && (
                <View style={styles.resendError}>
                  <Text style={styles.resendErrorText}>{resendError || 'Error al enviar. Intenta de nuevo.'}</Text>
                </View>
              )}
              <Pressable
                style={[
                  styles.resendBtn,
                  (resendLoading || resendCooldown > 0) && styles.resendBtnDisabled,
                ]}
                onPress={handleResend}
                disabled={resendLoading || resendCooldown > 0 || !email.trim()}
              >
                {resendLoading ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : resendCooldown > 0 ? (
                  <Text style={styles.resendBtnText}>
                    Reenviar en {resendCooldown}s
                  </Text>
                ) : (
                  <Text style={styles.resendBtnText}>Reenviar enlace de verificacion</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Boton con press scale */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleLogin}
              onPressIn={() =>
                Animated.spring(btnScale, {
                  toValue: 0.96, useNativeDriver: true, tension: 100, friction: 8,
                }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, {
                  toValue: 1, useNativeDriver: true, tension: 100, friction: 8,
                }).start()
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Iniciar sesion  →</Text>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>o</Text>
            <View style={styles.divLine} />
          </View>

          <Pressable
            style={styles.registerRow}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>No tienes cuenta?  </Text>
            <Text style={styles.registerLink}>Registrate gratis</Text>
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
    paddingTop: 64,
    paddingBottom: 44,
    alignItems: 'center',
    overflow: 'hidden',
  },
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
  logoBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  logoBadgeText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  scrollBg: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.medium,
  },
  greeting: {
    fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4,
  },
  greetingSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: COLORS.bg,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  inputField: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { paddingLeft: 8 },
  eyeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    gap: 8,
  },
  errorDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent, marginTop: 4,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.accentText, fontWeight: '600' },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  divText: { marginHorizontal: 12, color: COLORS.textMuted, fontSize: 13 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  registerRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  registerText: { fontSize: 14, color: COLORS.textMuted },
  registerLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  resendBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  resendTitle: {
    fontSize: 13, fontWeight: '800', color: COLORS.primary, marginBottom: 4,
  },
  resendHint: {
    fontSize: 12, color: COLORS.textMuted, marginBottom: 10, lineHeight: 17,
  },
  resendEmail: { fontWeight: '700', color: COLORS.primary },
  resendBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  resendBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  resendBtnDisabled: { opacity: 0.5 },
  resendRetryLoginText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, textDecorationLine: 'underline' },
  resendSuccess: {
    backgroundColor: '#D1FAE5', borderRadius: 8, padding: 8, marginBottom: 8,
  },
  resendSuccessText: { fontSize: 12, color: '#065F46', fontWeight: '600' },
  resendError: {
    backgroundColor: '#FFE4E6', borderRadius: 8, padding: 8, marginBottom: 8,
  },
  resendErrorText: { fontSize: 12, color: '#BE123C', fontWeight: '600' },
});
