import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { CATEGORIES, OFFER_TYPES, Category, OfferType } from '../types';
import { COLORS, CATEGORY_CONFIG, OFFER_CONFIG, SHADOWS } from '../theme';
import { UNIVERSITIES, CITIES, DEPARTMENTS } from '../constants/colombia';

type Props = { navigation: NavigationProp<MainStackParamList> };

interface PickedPhoto {
  uri: string;
  mimeType?: string;
  fileName?: string;
}

const MAX_PHOTOS = 5;
const GRAD_START = '#667eea';
const GRAD_END = '#764ba2';

// Las listas de universidades, ciudades y departamentos vienen de constants/colombia.ts

const RENTAL_UNITS = ['hora', 'día', 'semana', 'mes'];

const ITEM_SUGGESTIONS = [
  'Calculadora científica',
  'Apuntes de clase',
  'Libro de Cálculo',
  'Libro de Programación',
  'Tablet',
  'Portátil / Laptop',
  'Mouse inalámbrico',
  'Teclado',
  'Audífonos',
  'Mochila universitaria',
  'Memory USB',
  'Cable HDMI',
  'Regla de ingeniería',
  'Compás de dibujo técnico',
  'Software / Licencia',
  'Uniforme de laboratorio',
  'Bata de laboratorio',
  'Microscopio',
  'Atlas de anatomía',
  'Diccionario técnico',
  'Calculadora financiera',
  'Libreta de laboratorio',
  'Protractor / Transportador',
  'Lupa de laboratorio',
  'Cámara fotográfica',
];

// Steps for the visual stepper
const STEPS = ['Fotos', 'Detalles', 'Publicar'] as const;

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  onViewItem,
  onHome,
}: {
  onViewItem: () => void;
  onHome: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 6 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      op: new Animated.Value(1),
    })),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    confettiAnims.forEach((a, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      Animated.parallel([
        Animated.timing(a.y, { toValue: -80 - i * 20, duration: 700, useNativeDriver: true }),
        Animated.timing(a.x, { toValue: dir * (30 + i * 15), duration: 700, useNativeDriver: true }),
        Animated.timing(a.op, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const confettiColors = ['#FF6B6B', '#667eea', '#FFD700', '#4ADE80', '#F472B6', '#764ba2'];

  return (
    <SafeAreaView style={successStyles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GRAD_START} />
      <View style={successStyles.container}>
        {/* Confetti particles */}
        {confettiAnims.map((a, i) => (
          <Animated.View
            key={i}
            style={[
              successStyles.confetti,
              {
                backgroundColor: confettiColors[i],
                transform: [{ translateY: a.y }, { translateX: a.x }],
                opacity: a.op,
              },
            ]}
          />
        ))}

        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <View style={successStyles.checkWrap}>
            <View style={successStyles.checkBlobOuter} />
            <Ionicons name="checkmark-circle" size={96} color={COLORS.emerald} />
          </View>
        </Animated.View>

        <Text style={successStyles.title}>¡Publicado con éxito! 🎉</Text>
        <Text style={successStyles.subtitle}>
          Tu ítem ya está visible para toda la comunidad ShareCampus.
        </Text>

        <TouchableOpacity style={successStyles.primaryBtn} onPress={onViewItem} activeOpacity={0.85}>
          <View style={successStyles.primaryBtnOverlay} />
          <Ionicons name="eye-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={successStyles.primaryBtnText}>Ver mi publicación</Text>
        </TouchableOpacity>

        <TouchableOpacity style={successStyles.secondaryBtn} onPress={onHome} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={successStyles.secondaryBtnText}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CreateItemScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [customCategory, setCustomCategory] = useState('');
  const [offerType, setOfferType] = useState<OfferType | ''>('');
  const [campus, setCampus] = useState('');
  const [campusModalVisible, setCampusModalVisible] = useState(false);
  const [campusSearch, setCampusSearch] = useState('');
  const [city, setCity] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [rentalTimeUnit, setRentalTimeUnit] = useState<string>('mes');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [publishedItemId, setPublishedItemId] = useState<string | null>(null);

  const customCatAnim = useRef(new Animated.Value(0)).current;
  const rentalPriceAnim = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-200)).current;
  const photoScales = useRef<Animated.Value[]>([]).current;

  // Shimmer loop when submitting
  useEffect(() => {
    if (submitting) {
      Animated.loop(
        Animated.timing(shimmerX, { toValue: 400, duration: 1100, useNativeDriver: true }),
      ).start();
    } else {
      shimmerX.setValue(-200);
    }
  }, [submitting]);

  function selectCategory(cat: Category) {
    setCategory(cat);
    Animated.spring(customCatAnim, {
      toValue: cat === 'Otros' ? 1 : 0,
      useNativeDriver: false, tension: 80, friction: 10,
    }).start();
    if (cat !== 'Otros') setCustomCategory('');
  }

  function selectOfferType(type: OfferType) {
    setOfferType(type);
    Animated.spring(rentalPriceAnim, {
      toValue: type === 'Alquiler' ? 1 : 0,
      useNativeDriver: false, tension: 80, friction: 10,
    }).start();
    if (type !== 'Alquiler') setRentalPrice('');
  }

  const uniNames = UNIVERSITIES.map(u => u.name);
  const filteredCampus = campusSearch.trim()
    ? uniNames.filter(u => u.toLowerCase().includes(campusSearch.toLowerCase()))
    : uniNames;

  const filteredCities = citySearch.trim()
    ? CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : CITIES;

  const filteredDepartments = departmentSearch.trim()
    ? DEPARTMENTS.filter(d => d.toLowerCase().includes(departmentSearch.toLowerCase()))
    : DEPARTMENTS;

  function handleSelectUniversity(uni: string) {
    setCampus(uni);
    const found = UNIVERSITIES.find(u => u.name === uni);
    if (found?.city) setCity(found.city);
    if (found?.department) setDepartment(found.department);
    setCampusModalVisible(false);
  }

  async function pickPhotos() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Ve a Configuración > ShareCampus y activa el acceso a Fotos.',
        );
        return;
      }
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        Alert.alert('Límite alcanzado', `Puedes subir un máximo de ${MAX_PHOTOS} fotos.`);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as const,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (!result.canceled) {
        const picked: PickedPhoto[] = result.assets.map(a => ({
          uri: a.uri,
          mimeType: a.mimeType ?? 'image/jpeg',
          fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
        }));
        const newPhotos = [...photos, ...picked].slice(0, MAX_PHOTOS);
        setPhotos(newPhotos);
        // Animate each new photo (scale from 0)
        picked.forEach((_, i) => {
          const idx = photos.length + i;
          if (!photoScales[idx]) {
            photoScales[idx] = new Animated.Value(0);
          }
          Animated.spring(photoScales[idx], {
            toValue: 1, tension: 80, friction: 7, useNativeDriver: true,
          }).start();
        });
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería. Verifica los permisos en Configuración.');
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    photoScales.splice(index, 1);
  }

  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.';
    if (title.trim().length < 3) return 'El título debe tener al menos 3 caracteres.';
    if (!category) return 'Selecciona una categoría.';
    if (category === 'Otros' && !customCategory.trim()) {
      return 'Escribe tu categoría personalizada.';
    }
    if (!offerType) return 'Selecciona el tipo de oferta.';
    return null;
  }

  async function handleSubmit() {
    const error = validate();
    if (error) {
      Alert.alert('Datos incompletos', error);
      return;
    }
    setSubmitting(true);
    try {
      let finalDescription = description.trim();
      if (category === 'Otros' && customCategory.trim()) {
        const prefix = `Tipo: ${customCategory.trim()}`;
        finalDescription = finalDescription ? `${prefix}\n\n${finalDescription}` : prefix;
      }

      const parsedPrice = rentalPrice.trim() ? parseFloat(rentalPrice.replace(/[^0-9.]/g, '')) : undefined;
      const { data: item } = await api.post('/items', {
        title: title.trim(),
        description: finalDescription || undefined,
        category,
        offer_type: offerType,
        campus: campus.trim() || undefined,
        ciudad: city.trim() || undefined,
        departamento: department.trim() || undefined,
        rental_price: offerType === 'Alquiler' && parsedPrice ? parsedPrice : undefined,
        rental_time_unit: offerType === 'Alquiler' && parsedPrice ? rentalTimeUnit : undefined,
      });

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo, i) => {
          formData.append('photos', {
            uri: photo.uri,
            type: photo.mimeType ?? 'image/jpeg',
            name: photo.fileName ?? `photo_${i}.jpg`,
          } as unknown as Blob);
        });
        await api.post(`/items/${item.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setPublishedItemId(item.id);
    } catch (err: any) {
      const msg: string = err.response?.data?.message ?? 'Error al publicar. Intenta de nuevo.';
      Alert.alert('Error al publicar', msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Show success screen
  if (publishedItemId) {
    return (
      <SuccessScreen
        onViewItem={() => navigation.navigate('ItemDetail', { itemId: publishedItemId })}
        onHome={() => navigation.navigate('Home')}
      />
    );
  }

  const customCatHeight = customCatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 74] });
  const customCatOpacity = customCatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // Determine current step visually (not blocking, just informational)
  const currentStep = photos.length > 0 ? (title && category && offerType ? 2 : 1) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GRAD_START} />

      {/* ── HEADER ─────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBlob} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva publicación</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.headerPublishBtn, submitting && { opacity: 0.5 }]}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.headerPublishText}>Publicar</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={styles.stepper}>
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <React.Fragment key={step}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      done && styles.stepCircleDone,
                      active && styles.stepCircleActive,
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    ) : (
                      <Text style={[styles.stepNum, active && styles.stepNumActive]}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                    {step}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, done && styles.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── FOTOS ──────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.skyLight }]}>
                <Ionicons name="camera" size={16} color={COLORS.sky} />
              </View>
              <Text style={styles.sectionLabel}>Fotos</Text>
              <Text style={styles.sectionCount}>{photos.length}/{MAX_PHOTOS}</Text>
            </View>

            {/* Photo grid */}
            <View style={styles.photoGrid}>
              {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
                const photo = photos[i];
                if (!photoScales[i]) {
                  photoScales[i] = new Animated.Value(photo ? 1 : 0);
                }
                if (photo) {
                  return (
                    <Animated.View
                      key={i}
                      style={[styles.photoCell, { transform: [{ scale: photoScales[i] ?? 1 }] }]}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoImg} resizeMode="cover" />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(i)}>
                        <Ionicons name="close" size={11} color="#fff" />
                      </TouchableOpacity>
                      {i === 0 && (
                        <View style={styles.mainBadge}>
                          <Text style={styles.mainBadgeText}>Principal</Text>
                        </View>
                      )}
                    </Animated.View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.photoEmpty}
                    onPress={pickPhotos}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={i === 0 ? 'add-circle-outline' : 'add'}
                      size={i === 0 ? 30 : 22}
                      color={i === 0 ? COLORS.primary : COLORS.textMuted}
                    />
                    {i === 0 && (
                      <Text style={styles.photoEmptyText}>Agregar{'\n'}foto</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SUGERENCIAS DE ÍTEMS ───────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="bulb" size={16} color="#9333EA" />
              </View>
              <Text style={styles.sectionLabel}>Sugerencias rápidas</Text>
              <Text style={styles.optionalTag}>Toca para completar</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.suggestionsRow}>
                {ITEM_SUGGESTIONS.map(sug => (
                  <TouchableOpacity
                    key={sug}
                    style={styles.suggestionChip}
                    onPress={() => setTitle(sug)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionChipText}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── TÍTULO ─────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="pricetag" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionLabel}>
                Título <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Cálculo diferencial – Stewart 8va ed."
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* ── DESCRIPCIÓN ────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.emeraldLight }]}>
                <Ionicons name="document-text" size={16} color={COLORS.emerald} />
              </View>
              <Text style={styles.sectionLabel}>Descripción</Text>
              <Text style={styles.optionalTag}>Opcional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Estado, edición, detalles relevantes..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* ── CATEGORÍA ──────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="grid" size={16} color="#9333EA" />
              </View>
              <Text style={styles.sectionLabel}>
                Categoría <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <View style={styles.chipsGrid}>
              {CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat] ?? {
                  color: COLORS.primary, bg: COLORS.primaryLight, emoji: '📦',
                };
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      active && { backgroundColor: cfg.color, borderColor: cfg.color },
                    ]}
                    onPress={() => selectCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                    {active && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Campo extra para categoría "Otros" */}
            <Animated.View
              style={{
                height: customCatHeight,
                opacity: customCatOpacity,
                overflow: 'hidden',
              }}
            >
              <View style={styles.customCatWrap}>
                <Ionicons name="pencil" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.customCatInput}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Escribe tu categoría... (obligatorio)"
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={50}
                />
              </View>
            </Animated.View>
          </View>

          {/* ── TIPO DE OFERTA ─────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.amberLight }]}>
                <Ionicons name="swap-horizontal" size={16} color={COLORS.amber} />
              </View>
              <Text style={styles.sectionLabel}>
                Tipo de oferta <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <View style={styles.offerChipsRow}>
              {OFFER_TYPES.map(type => {
                const cfg = OFFER_CONFIG[type] ?? {
                  color: COLORS.primary, bg: COLORS.primaryLight, emoji: '🤝', icon: 'swap-horizontal',
                };
                const active = offerType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.offerChip,
                      active && { backgroundColor: cfg.color, borderColor: cfg.color },
                    ]}
                    onPress={() => selectOfferType(type)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cfg.icon as any}
                      size={16}
                      color={active ? '#fff' : cfg.color}
                    />
                    <Text style={[styles.offerChipText, active && styles.offerChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── PRECIO DE ALQUILER (visible solo cuando offerType=Alquiler) ── */}
          <Animated.View
            style={{
              height: rentalPriceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 160] }),
              opacity: rentalPriceAnim,
              overflow: 'hidden',
            }}
          >
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="cash" size={16} color="#D97706" />
                </View>
                <Text style={styles.sectionLabel}>
                  Precio por período <Text style={styles.required}>*</Text>
                </Text>
              </View>
              {/* Input con prefijo COP $ */}
              <View style={styles.priceInputWrap}>
                <Text style={styles.pricePrefixText}>COP $</Text>
                <TextInput
                  style={styles.priceInput}
                  value={rentalPrice}
                  onChangeText={setRentalPrice}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={12}
                />
              </View>
              {/* Selector de unidad de tiempo */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
              >
                {RENTAL_UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.campusTag, rentalTimeUnit === unit && styles.campusTagActive]}
                    onPress={() => setRentalTimeUnit(unit)}
                  >
                    <Text style={[styles.campusTagText, rentalTimeUnit === unit && styles.campusTagTextActive]}>
                      por {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {/* ── CAMPUS / SEDE (selector modal de universidades) ─── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="location" size={16} color="#059669" />
              </View>
              <Text style={styles.sectionLabel}>Universidad / Sede</Text>
              <Text style={styles.optionalTag}>Opcional</Text>
            </View>
            <TouchableOpacity
              style={styles.campusInputWrap}
              onPress={() => { setCampusSearch(''); setCampusModalVisible(true); }}
              activeOpacity={0.8}
            >
              <Ionicons name="school-outline" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.campusInput, { flex: 1, paddingVertical: 0, color: campus ? COLORS.textPrimary : COLORS.textMuted }]}>
                {campus || 'Selecciona tu universidad...'}
              </Text>
              {campus ? (
                <TouchableOpacity onPress={() => setCampus('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={17} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Modal selector de universidades ────────────────── */}
          <Modal
            visible={campusModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setCampusModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona tu universidad</Text>
                  <TouchableOpacity onPress={() => setCampusModalVisible(false)}>
                    <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                {/* Búsqueda dentro del modal */}
                <View style={styles.modalSearch}>
                  <Ionicons name="search" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.modalSearchInput}
                    value={campusSearch}
                    onChangeText={setCampusSearch}
                    placeholder="Buscar universidad..."
                    placeholderTextColor={COLORS.textMuted}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={filteredCampus}
                  keyExtractor={item => item}
                  renderItem={({ item: uni }) => (
                    <TouchableOpacity
                      style={[styles.uniRow, campus === uni && styles.uniRowActive]}
                      onPress={() => handleSelectUniversity(uni)}
                    >
                      <Ionicons
                        name="school"
                        size={16}
                        color={campus === uni ? COLORS.primary : COLORS.textMuted}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.uniRowText, campus === uni && { color: COLORS.primary, fontWeight: '700' }]}>
                        {uni}
                      </Text>
                      {campus === uni && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </View>
          </Modal>

          {/* ── CIUDAD ───────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="business-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionLabel}>Ciudad</Text>
              <Text style={styles.optionalTag}>Opcional</Text>
            </View>
            <TouchableOpacity
              style={styles.campusInputWrap}
              onPress={() => { setCitySearch(''); setCityModalVisible(true); }}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.campusInput, { flex: 1, paddingVertical: 0, color: city ? COLORS.textPrimary : COLORS.textMuted }]}>
                {city || 'Selecciona tu ciudad...'}
              </Text>
              {city ? (
                <TouchableOpacity onPress={() => setCity('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={17} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <Modal visible={cityModalVisible} animationType="slide" transparent onRequestClose={() => setCityModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona tu ciudad</Text>
                  <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                    <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalSearch}>
                  <Ionicons name="search" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.modalSearchInput}
                    value={citySearch}
                    onChangeText={setCitySearch}
                    placeholder="Buscar ciudad..."
                    placeholderTextColor={COLORS.textMuted}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={filteredCities}
                  keyExtractor={item => item}
                  renderItem={({ item: c }) => (
                    <TouchableOpacity
                      style={[styles.uniRow, city === c && styles.uniRowActive]}
                      onPress={() => { setCity(c); setCityModalVisible(false); }}
                    >
                      <Ionicons name="location" size={16} color={city === c ? '#2563EB' : COLORS.textMuted} style={{ marginRight: 10 }} />
                      <Text style={[styles.uniRowText, city === c && { color: '#2563EB', fontWeight: '700' }]}>{c}</Text>
                      {city === c && <Ionicons name="checkmark" size={16} color="#2563EB" />}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </View>
          </Modal>

          {/* ── DEPARTAMENTO ─────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="map-outline" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionLabel}>Departamento</Text>
              <Text style={styles.optionalTag}>Opcional</Text>
            </View>
            <TouchableOpacity
              style={styles.campusInputWrap}
              onPress={() => { setDepartmentSearch(''); setDepartmentModalVisible(true); }}
              activeOpacity={0.8}
            >
              <Ionicons name="flag-outline" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.campusInput, { flex: 1, paddingVertical: 0, color: department ? COLORS.textPrimary : COLORS.textMuted }]}>
                {department || 'Selecciona tu departamento...'}
              </Text>
              {department ? (
                <TouchableOpacity onPress={() => setDepartment('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={17} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <Modal visible={departmentModalVisible} animationType="slide" transparent onRequestClose={() => setDepartmentModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona tu departamento</Text>
                  <TouchableOpacity onPress={() => setDepartmentModalVisible(false)}>
                    <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalSearch}>
                  <Ionicons name="search" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.modalSearchInput}
                    value={departmentSearch}
                    onChangeText={setDepartmentSearch}
                    placeholder="Buscar departamento..."
                    placeholderTextColor={COLORS.textMuted}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={filteredDepartments}
                  keyExtractor={item => item}
                  renderItem={({ item: dep }) => (
                    <TouchableOpacity
                      style={[styles.uniRow, department === dep && styles.uniRowActive]}
                      onPress={() => { setDepartment(dep); setDepartmentModalVisible(false); }}
                    >
                      <Ionicons name="map" size={16} color={department === dep ? COLORS.primary : COLORS.textMuted} style={{ marginRight: 10 }} />
                      <Text style={[styles.uniRowText, department === dep && { color: COLORS.primary, fontWeight: '700' }]}>{dep}</Text>
                      {department === dep && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </View>
          </Modal>

          {/* ── BOTÓN PUBLICAR ─────────────────────── */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnLoading]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {/* Gradient simulation */}
            <View style={styles.submitBtnOverlay} />
            {/* Shimmer effect when loading */}
            {submitting && (
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerX }] },
                ]}
              />
            )}
            {submitting ? (
              <View style={styles.submitRow}>
                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.submitBtnText}>Publicando...</Text>
              </View>
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.rocketIcon}>🚀</Text>
                <Text style={styles.submitBtnText}>Publicar ítem</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Al publicar aceptas que el ítem cumple las normas de la comunidad ShareCampus.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },

  // Header
  header: {
    backgroundColor: GRAD_START,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBlob: {
    position: 'absolute', top: -30, right: -30,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: GRAD_END, opacity: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerBackBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: 7,
    width: 38, alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerPublishBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7,
    minWidth: 70, alignItems: 'center',
  },
  headerPublishText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  stepCircleActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  stepCircleDone: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  stepNum: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  stepNumActive: { color: GRAD_START },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  stepLabelActive: { color: '#fff', fontWeight: '800' },
  stepLine: {
    flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 6, marginBottom: 14,
  },
  stepLineDone: { backgroundColor: COLORS.emerald },

  // Form
  form: { padding: 14, paddingBottom: 44 },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: 18, padding: 14, marginBottom: 12,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8,
  },
  sectionIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sectionCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  optionalTag: {
    fontSize: 11, color: COLORS.textMuted,
    backgroundColor: COLORS.bg, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, fontWeight: '600',
  },
  required: { color: COLORS.accent },

  // Photo grid (3 columns × 2 rows)
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCell: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'visible',
  },
  photoImg: {
    width: '100%', height: '100%', borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#D32F2F', borderRadius: 10,
    width: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1,
  },
  mainBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
  },
  mainBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  photoEmpty: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.primaryLight + '44',
    justifyContent: 'center', alignItems: 'center',
  },
  photoEmptyText: {
    fontSize: 11, color: COLORS.primary,
    textAlign: 'center', marginTop: 4, fontWeight: '600',
  },

  // Inputs
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: COLORS.textPrimary,
  },
  textArea: { minHeight: 96, paddingTop: 11 },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },

  // Category chips
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  chipEmoji: { fontSize: 15 },
  chipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  customCatWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1.5, borderColor: COLORS.primary + '55',
    borderRadius: 12, borderStyle: 'dashed',
    paddingHorizontal: 12, paddingVertical: 8,
    marginTop: 10,
  },
  customCatInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },

  // Offer chips
  offerChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  offerEmoji: { fontSize: 16 },
  offerChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  offerChipTextActive: { color: '#fff', fontWeight: '700' },

  // Campus
  campusInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  campusInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  campusTags: { marginTop: 2 },
  campusTag: {
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: COLORS.bg, marginRight: 8,
  },
  campusTagActive: { backgroundColor: '#059669', borderColor: '#059669' },
  campusTagText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  campusTagTextActive: { color: '#fff', fontWeight: '700' },

  // Submit button
  submitBtn: {
    backgroundColor: GRAD_START,
    borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', marginTop: 8,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  submitBtnOverlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    left: '45%',
    backgroundColor: GRAD_END,
    opacity: 0.65,
  },
  submitBtnLoading: { opacity: 0.8 },
  shimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ skewX: '-20deg' }],
  },
  submitRow: { flexDirection: 'row', alignItems: 'center' },
  rocketIcon: { fontSize: 20, marginRight: 10 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  disclaimer: {
    fontSize: 11, color: COLORS.textMuted,
    textAlign: 'center', marginTop: 14, lineHeight: 16,
  },

  // Sugerencias rápidas
  suggestionsRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, paddingBottom: 4 },
  suggestionChip: {
    borderWidth: 1.5, borderColor: '#C4B5FD',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#F5F3FF', marginRight: 0,
  },
  suggestionChipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  // Precio de alquiler
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1.5, borderColor: '#D97706',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  pricePrefixText: {
    fontSize: 15, fontWeight: '700', color: '#D97706', marginRight: 8,
  },
  priceInput: {
    flex: 1, fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
  },

  // Modal de universidades
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 16, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.bg, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  uniRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  uniRowActive: { backgroundColor: COLORS.primaryLight },
  uniRowText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
});

// ── Success screen styles ─────────────────────────────────────────────────────
const successStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5FF' },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  confetti: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
    top: '45%',
  },
  checkWrap: {
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  checkBlobOuter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 60,
    backgroundColor: COLORS.emeraldLight,
    margin: -16,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    fontSize: 15, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 22, marginBottom: 36,
  },
  primaryBtn: {
    backgroundColor: GRAD_START,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', width: '100%', justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.button,
  },
  primaryBtnOverlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    left: '45%',
    backgroundColor: GRAD_END,
    opacity: 0.65,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    borderWidth: 2, borderColor: COLORS.primaryLight,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center',
    width: '100%', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
});
