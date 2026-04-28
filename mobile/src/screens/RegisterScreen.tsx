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

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Register'> };

function isInstitutionalEmail(e: string): boolean {
  const l = e.trim().toLowerCase();
  return l.endsWith('.edu') || l.endsWith('.edu.co');
}

function getStrength(p: string): { score: number; label: string; color: string } {
  if (p.length === 0) return { score: 0, label: '', color: 'transparent' };
  if (p.length < 6)   return { score: 1, label: 'Debil', color: '#EF4444' };
  if (p.length < 8)   return { score: 2, label: 'Regular', color: COLORS.amber };
  if (/[A-Z]/.test(p) && /[0-9]/.test(p))
    return { score: 4, label: 'Fuerte', color: COLORS.emerald };
  return { score: 3, label: 'Buena', color: COLORS.sky };
}

/** Icono de texto dentro de un rectangulo coloreado */
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

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [confirmFocus, setConfirmFocus] = useState(false);

  const logoScale = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(50)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorX = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (success) {
      Animated.spring(successScale, {
        toValue: 1, useNativeDriver: true, tension: 40, friction: 8,
      }).start();
    }
  }, [success]);

  function shake() {
    Animated.sequence([
      Animated.timing(errorX, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(errorX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  const emailTouched = email.length > 0;
  const emailValid = emailTouched && isInstitutionalEmail(email);
  const emailInvalid = emailTouched && !isInstitutionalEmail(email);
  const mismatch = confirm.length > 0 && password !== confirm;
  const match = confirm.length > 0 && password === confirm;
  const strength = getStrength(password);

  async function handleRegister() {
    if (!email.trim() || !password || !confirm) {
      setError('Por favor completa todos los campos.');
      shake();
      return;
    }
    if (!isInstitutionalEmail(email)) {
      setError('Debes usar un correo institucional (.edu o .edu.co).');
      shake();
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      shake();
      return;
    }
    if (password !== confirm) {
      setError('Las contrasenias no coinciden.');
      shake();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      const raw = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? '';
      const msg: string = Array.isArray(raw) ? (raw as string[]).join('. ') : String(raw);
      const status: number = err.response?.status ?? 0;

      if (!err.response) {
        setError('Sin conexion al servidor. Verifica tu internet.');
      } else if (msg.includes('ya est') || msg.toLowerCase().includes('already')) {
        setError('Este correo ya esta registrado. Intenta iniciar sesion.');
      } else if (msg.includes('institucional')) {
        setError('Solo se permiten correos institucionales (.edu, .edu.co).');
      } else if (msg.toLowerCase().includes('must be an email') || msg.includes('correo electrónico válido')) {
        setError('Formato de correo invalido. Verifica que este bien escrito.');
      } else {
        setError(msg || `Error ${status} al crear la cuenta. Intenta de nuevo.`);
      }
      shake();
    } finally {
      setLoading(false);
    }
  }

  /* ── Pantalla de exito ── */
  if (success) {
    return (
      <View style={styles.successBg}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIconChar}>@</Text>
          </View>
          <Text style={styles.successTitle}>Registro exitoso!</Text>
          <Text style={styles.successMsg}>
            Enviamos un enlace de verificacion a{'\n'}
            <Text style={styles.successEmail}>{email.trim().toLowerCase()}</Text>
          </Text>
          <Text style={styles.successHint}>
            Revisa tu bandeja de entrada (y spam) para activar tu cuenta.
          </Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Ir a iniciar sesion  →</Text>
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
      <View style={styles.header}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: logoScale }] }}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>SC</Text>
          </View>
          <Text style={styles.logoText}>ShareCampus</Text>
          <Text style={styles.logoSub}>Crea tu cuenta institucional</Text>
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
          <Text style={styles.greeting}>Unete gratis</Text>
          <Text style={styles.greetingSub}>Solo necesitas tu correo institucional</Text>

          {/* Email */}
          <View style={[
            styles.inputGroup,
            emailFocus && styles.inputFocused,
            emailInvalid && styles.inputError,
            emailValid && styles.inputValid,
          ]}>
            <InputIcon
              char="@"
              color={emailInvalid ? COLORS.accent : emailValid ? COLORS.emerald : COLORS.primary}
              bg={emailInvalid ? COLORS.accentLight : emailValid ? COLORS.emeraldLight : COLORS.primaryLight}
            />
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
            {emailValid && (
              <View style={styles.validCheck}>
                <Text style={styles.validCheckText}>OK</Text>
              </View>
            )}
          </View>
          {emailInvalid && (
            <Text style={styles.fieldError}>Solo se aceptan correos .edu o .edu.co</Text>
          )}
          {emailValid && (
            <Text style={styles.fieldValid}>Correo institucional valido</Text>
          )}

          {/* Password */}
          <View style={[styles.inputGroup, passFocus && styles.inputFocused]}>
            <InputIcon char="**" color={COLORS.primary} bg={COLORS.primaryLight} />
            <TextInput
              style={styles.inputField}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="Minimo 6 caracteres"
              placeholderTextColor={COLORS.textLight}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
            />
            <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPass ? 'Ocultar' : 'Ver'}</Text>
            </Pressable>
          </View>

          {/* Indicador de fortaleza */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map(i => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    { backgroundColor: i <= strength.score ? strength.color : COLORS.border },
                  ]}
                />
              ))}
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Confirmar password */}
          <View style={[
            styles.inputGroup,
            confirmFocus && styles.inputFocused,
            mismatch && styles.inputError,
            match && styles.inputValid,
          ]}>
            <InputIcon
              char="**"
              color={mismatch ? COLORS.accent : match ? COLORS.emerald : COLORS.primary}
              bg={mismatch ? COLORS.accentLight : match ? COLORS.emeraldLight : COLORS.primaryLight}
            />
            <TextInput
              style={styles.inputField}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPass}
              placeholder="Repite tu contrasena"
              placeholderTextColor={COLORS.textLight}
              onFocus={() => setConfirmFocus(true)}
              onBlur={() => setConfirmFocus(false)}
            />
            {match && (
              <View style={[styles.validCheck, { backgroundColor: COLORS.emeraldLight }]}>
                <Text style={[styles.validCheckText, { color: COLORS.emerald }]}>OK</Text>
              </View>
            )}
          </View>
          {mismatch && <Text style={styles.fieldError}>Las contrasenias no coinciden</Text>}

          {error !== '' && (
            <Animated.View
              style={[styles.errorBox, { transform: [{ translateX: errorX }] }]}
            >
              <View style={styles.errorDot} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleRegister}
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
                <Text style={styles.btnText}>Crear cuenta  →</Text>
              )}
            </Pressable>
          </Animated.View>

          <Pressable
            style={styles.loginRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Ya tienes cuenta?  </Text>
            <Text style={styles.loginLink}>Inicia sesion</Text>
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
  successBg: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  greeting: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    backgroundColor: COLORS.bg,
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  inputError: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  inputValid: { borderColor: COLORS.emerald, backgroundColor: COLORS.emeraldLight },
  inputField: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { paddingLeft: 8 },
  eyeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  validCheck: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  validCheckText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  fieldError: {
    fontSize: 12, color: COLORS.accent, marginBottom: 10, marginLeft: 4, fontWeight: '600',
  },
  fieldValid: {
    fontSize: 12, color: COLORS.emerald, marginBottom: 10, marginLeft: 4, fontWeight: '600',
  },
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10, marginTop: -2,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
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
    marginTop: 8,
    ...SHADOWS.button,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  loginRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20,
  },
  loginText: { fontSize: 14, color: COLORS.textMuted },
  loginLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  /* Success screen */
  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.medium,
  },
  successIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  successIconChar: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  successTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  successMsg: {
    fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 8,
  },
  successEmail: { fontWeight: '700', color: COLORS.primary },
  successHint: {
    fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 20,
  },
});
