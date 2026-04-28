import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { Profile } from '../types';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: NavigationProp<MainStackParamList> };

type FieldErrors = {
  fullName?: string;
  semester?: string;
};

function completionPercent(name: string, faculty: string, semester: string): number {
  let score = 0;
  if (name.trim().length >= 2) score += 40;
  if (faculty.trim().length >= 2) score += 35;
  if (semester && Number(semester) >= 1) score += 25;
  return score;
}

export default function EditProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [semester, setSemester] = useState('');
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [newPhotoMime, setNewPhotoMime] = useState('image/jpeg');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const avatarScale = useRef(new Animated.Value(0.5)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const saveScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setLoadingProfile(true);
    api
      .get<Profile>('/profile')
      .then(({ data }) => {
        setProfile(data);
        setFullName(data.full_name ?? '');
        setFaculty(data.faculty ?? '');
        setSemester(data.semester ? String(data.semester) : '');
        Animated.parallel([
          Animated.spring(avatarScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
          Animated.timing(avatarOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(formOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]).start();
      })
      .catch(() =>
        Alert.alert('Error', 'No se pudo cargar el perfil. Intenta de nuevo.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]),
      )
      .finally(() => setLoadingProfile(false));
  }, []);

  // Animate progress bar when fields change
  useEffect(() => {
    const pct = completionPercent(fullName, faculty, semester);
    Animated.timing(progressAnim, { toValue: pct, duration: 500, useNativeDriver: false }).start();
  }, [fullName, faculty, semester]);

  async function pickPhoto() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Ve a Configuración > ShareCampus y activa el acceso a Fotos.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as const,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setNewPhotoUri(result.assets[0].uri);
        setNewPhotoMime(result.assets[0].mimeType ?? 'image/jpeg');
      }
    } catch {
      Alert.alert(
        'Error',
        'No se pudo abrir la galería. Verifica los permisos en Configuración.',
      );
    }
  }

  function validateFields(): boolean {
    const errors: FieldErrors = {};
    if (fullName.trim() && fullName.trim().length < 2) {
      errors.fullName = 'El nombre debe tener al menos 2 caracteres.';
    }
    const sem = Number(semester);
    if (semester && (isNaN(sem) || sem < 1 || sem > 12)) {
      errors.semester = 'Ingresa un número entre 1 y 12.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateFields()) return;

    Animated.sequence([
      Animated.timing(saveScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(saveScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
    ]).start();

    setSaving(true);
    try {
      if (newPhotoUri) {
        const formData = new FormData();
        formData.append('photo', {
          uri: newPhotoUri,
          type: newPhotoMime,
          name: `profile_${Date.now()}.jpg`,
        } as unknown as Blob);
        await api.post('/profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await api.patch('/profile', {
        ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
        ...(faculty.trim() ? { faculty: faculty.trim() } : {}),
        ...(semester ? { semester: Number(semester) } : {}),
      });
      Alert.alert('¡Guardado! ✅', 'Tu perfil fue actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const msg: string = e.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const photoSource = newPhotoUri
    ? { uri: newPhotoUri }
    : profile?.photo_url
    ? { uri: profile.photo_url }
    : null;

  const pct = completionPercent(fullName, faculty, semester);
  const progressColor = pct === 100 ? COLORS.emerald : COLORS.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── HEADER ───────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={styles.blob3} />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Editar perfil</Text>

            {/* Avatar con botón flotante de cámara */}
            <Animated.View
              style={[
                styles.avatarContainer,
                { transform: [{ scale: avatarScale }], opacity: avatarOpacity },
              ]}
            >
              {photoSource ? (
                <Image source={photoSource} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={46} color="#fff" />
                </View>
              )}
              {newPhotoUri && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Nueva</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraBtn} onPress={pickPhoto} activeOpacity={0.85}>
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.tapHint}>Toca la cámara para cambiar foto</Text>
          </View>

          {/* ── BARRA DE COMPLETITUD ─────────────── */}
          <Animated.View style={[styles.progressCard, { opacity: formOpacity }]}>
            <View style={styles.progressRow}>
              <View style={styles.progressLabelRow}>
                <Ionicons name="stats-chart" size={14} color={progressColor} />
                <Text style={[styles.progressLabel, { color: progressColor }]}>
                  Completitud del perfil
                </Text>
              </View>
              <Text style={[styles.progressPct, { color: progressColor }]}>{pct}%</Text>
            </View>
            <View style={styles.progressBg}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {pct === 100
                ? '¡Perfil completo! Los usuarios confían más en ti.'
                : 'Agrega nombre, facultad y semestre para generar más confianza.'}
            </Text>
          </Animated.View>

          {/* ── DATOS PERSONALES ─────────────────── */}
          <Animated.View style={[styles.card, { opacity: formOpacity }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="person-outline" size={17} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Datos personales</Text>
            </View>

            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <View
              style={[
                styles.inputWrap,
                focusedField === 'name' && styles.inputWrapFocused,
                !!fieldErrors.fullName && styles.inputWrapError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={focusedField === 'name' ? COLORS.primary : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={t => {
                  setFullName(t);
                  setFieldErrors(p => ({ ...p, fullName: undefined }));
                }}
                placeholder="Ej: María García López"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                maxLength={80}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {!!fieldErrors.fullName && (
              <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
            )}
          </Animated.View>

          {/* ── INFORMACIÓN ACADÉMICA ────────────── */}
          <Animated.View style={[styles.card, { opacity: formOpacity }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: COLORS.skyLight }]}>
                <Ionicons name="school-outline" size={17} color={COLORS.sky} />
              </View>
              <Text style={styles.cardTitle}>Información académica</Text>
            </View>

            <Text style={styles.fieldLabel}>Facultad / Carrera</Text>
            <View
              style={[
                styles.inputWrap,
                focusedField === 'faculty' && styles.inputWrapFocused,
              ]}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={focusedField === 'faculty' ? COLORS.primary : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={faculty}
                onChangeText={setFaculty}
                placeholder="Ej: Ingeniería de Sistemas"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                maxLength={80}
                onFocus={() => setFocusedField('faculty')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Semestre</Text>
            <View style={styles.semesterGrid}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                const active = semester === String(n);
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.semesterChip, active && styles.semesterChipActive]}
                    onPress={() => {
                      setSemester(String(n));
                      setFieldErrors(p => ({ ...p, semester: undefined }));
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.semesterChipText, active && styles.semesterChipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!fieldErrors.semester && (
              <Text style={styles.fieldError}>{fieldErrors.semester}</Text>
            )}
          </Animated.View>

          {/* ── BOTÓN GUARDAR ─────────────────────── */}
          <Animated.View style={[{ transform: [{ scale: saveScale }] }, styles.saveBtnWrap]}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnLoading]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {/* Gradient simulation */}
              <View style={styles.saveBtnOverlay} />
              {saving ? (
                <View style={styles.saveBtnRow}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.saveBtnText}>Guardando...</Text>
                </View>
              ) : (
                <View style={styles.saveBtnRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.saveBtnText}>Guardar cambios</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.disclaimer}>
            Los cambios pueden tardar unos segundos en verse reflejados en toda la app.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5FF' },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F5FF',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  scrollContent: { paddingBottom: 52 },

  // ── Header
  header: {
    backgroundColor: '#667eea',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 44,
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  blob1: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#764ba2', opacity: 0.55,
  },
  blob2: {
    position: 'absolute', bottom: -40, left: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#4F46E5', opacity: 0.4,
  },
  blob3: {
    position: 'absolute', top: 10, left: '25%',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#9333EA', opacity: 0.2,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 22,
    padding: 8,
    marginBottom: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 26,
    letterSpacing: 0.3,
  },

  // Avatar
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 114, height: 114, borderRadius: 57,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.75)',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  newBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.emerald, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: '#667eea',
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    ...SHADOWS.small,
  },
  tapHint: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  // Progress
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 18,
    borderRadius: 18, padding: 16,
    ...SHADOWS.small,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressLabel: { fontSize: 13, fontWeight: '700' },
  progressPct: { fontSize: 14, fontWeight: '800' },
  progressBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, lineHeight: 17 },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 18, padding: 16,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F5FF',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12,
  },
  inputWrapNarrow: { alignSelf: 'flex-start', minWidth: 140 },
  inputWrapFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  inputWrapError: { borderColor: '#EF4444' },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  fieldError: {
    fontSize: 12, color: '#EF4444',
    marginTop: 5, marginLeft: 4,
  },

  // Save button
  saveBtnWrap: { marginHorizontal: 16, marginTop: 22 },
  saveBtn: {
    backgroundColor: '#667eea',
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', overflow: 'hidden',
    ...SHADOWS.button,
  },
  saveBtnOverlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    left: '45%',
    backgroundColor: '#764ba2',
    opacity: 0.65,
  },
  saveBtnLoading: { opacity: 0.7 },
  saveBtnRow: { flexDirection: 'row', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  disclaimer: {
    fontSize: 11, color: COLORS.textMuted,
    textAlign: 'center', marginTop: 16, marginHorizontal: 28, lineHeight: 17,
  },

  semesterGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2,
  },
  semesterChip: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: '#F7F5FF',
    justifyContent: 'center', alignItems: 'center',
  },
  semesterChipActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  semesterChipText: {
    fontSize: 15, fontWeight: '700', color: COLORS.textMuted,
  },
  semesterChipTextActive: {
    color: '#fff',
  },
});
