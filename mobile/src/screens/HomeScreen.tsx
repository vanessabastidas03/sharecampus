import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { Item, CATEGORIES, OFFER_TYPES } from '../types';
import { COLORS, CATEGORY_CONFIG, OFFER_CONFIG, STATUS_CFG, SHADOWS } from '../theme';

type Props = { navigation: NavigationProp<MainStackParamList> };

export default function HomeScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [offerType, setOfferType] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* List fade-in + slide-up on load */
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listY = useRef(new Animated.Value(24)).current;

  /* FAB pulse animation to draw attention */
  const fabPulse = useRef(new Animated.Value(1)).current;
  const fabPressScale = useRef(new Animated.Value(1)).current;

  /* Chip scale map for press animation */
  const chipScales = useRef<Record<string, Animated.Value>>({}).current;
  function getChipScale(key: string) {
    if (!chipScales[key]) chipScales[key] = new Animated.Value(1);
    return chipScales[key];
  }
  function animateChipPress(key: string) {
    const s = getChipScale(key);
    Animated.sequence([
      Animated.spring(s, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(s, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  }

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchItems = useCallback(
    async (q: string, cat: string, offer: string, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const params: Record<string, string> = {};
        if (q) params.search = q;
        if (cat) params.category = cat;
        if (offer) params.offer_type = offer;
        const { data } = await api.get<Item[]>('/items', { params });
        setItems(data);
        listOpacity.setValue(0);
        listY.setValue(24);
        Animated.parallel([
          Animated.timing(listOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(listY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        ]).start();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchItems(search, category, offerType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, offerType]);

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchItems(text, category, offerType), 500);
  }

  function clearSearch() {
    setSearch('');
    fetchItems('', category, offerType);
  }

  function toggleCategory(cat: string) {
    setCategory(prev => (prev === cat ? '' : cat));
  }

  function toggleOfferType(type: string) {
    setOfferType(prev => (prev === type ? '' : type));
  }

  function renderItem({ item }: { item: Item }) {
    const photo = item.photos?.[0];
    const displayName =
      item.user?.full_name ?? item.user?.email?.split('@')[0] ?? 'Usuario';
    const catCfg = CATEGORY_CONFIG[item.category] ?? {
      color: COLORS.primary, bg: COLORS.primaryLight, emoji: '📦',
    };
    const offerCfg = OFFER_CONFIG[item.offer_type] ?? {
      color: COLORS.primary, bg: COLORS.primaryLight, emoji: '🤝',
    };
    const statusCfg = STATUS_CFG[item.status] ?? { color: '#6B7280', bg: '#F3F4F6' };

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
      >
        {/* Colored left accent bar by offer type */}
        <View style={[styles.cardAccent, { backgroundColor: offerCfg.color }]} />

        {/* Photo or placeholder */}
        {photo ? (
          <Image source={{ uri: photo }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: catCfg.bg }]}>
            <Text style={styles.placeholderEmoji}>{catCfg.emoji}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: catCfg.bg }]}>
              <Text style={[styles.badgeText, { color: catCfg.color }]}>
                {catCfg.emoji} {item.category}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: offerCfg.bg }]}>
              <Text style={[styles.badgeText, { color: offerCfg.color }]}>
                {offerCfg.emoji} {item.offer_type}
              </Text>
            </View>
          </View>

          <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{item.status}</Text>
          </View>

          <Text style={styles.cardUser} numberOfLines={1}>
            👤 {displayName}{item.campus ? `  ·  ${item.campus}` : ''}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <View style={styles.header}>
        {/* Blob decorativos de fondo */}
        <View style={styles.headerBlob} />
        <View style={styles.headerBlobBottom} />

        {/* Barra superior: marca + acciones */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>ShareCampus</Text>
            <Text style={styles.headerSub}>Intercambio universitario</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Chats')}
              hitSlop={8}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Profile')}
              hitSlop={8}
            >
              <Ionicons name="person-circle" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Eslogan + botón de acción principal */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSlogan}>
            Comparte, intercambia y ayuda a tu comunidad universitaria
          </Text>
          <Pressable
            style={styles.heroBtn}
            onPress={() => navigation.navigate('CreateItem')}
          >
            <Ionicons name="add-circle" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.heroBtnText}>Publicar algo</Text>
          </Pressable>
        </View>

        {/* Buscador translúcido */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Buscar ítems..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search !== '' && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Chips de categoría con Ionicons ─────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {/* "Todos" chip */}
        <Animated.View style={{ transform: [{ scale: getChipScale('todos') }] }}>
        <Pressable
          style={[styles.chip, !category && styles.chipAllActive]}
          onPress={() => { animateChipPress('todos'); setCategory(''); }}
        >
          <Ionicons
            name="apps"
            size={14}
            color={!category ? '#fff' : COLORS.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, !category && styles.chipTextActive]}>Todos</Text>
        </Pressable>
        </Animated.View>

        {CATEGORIES.map(cat => {
          const cfg = CATEGORY_CONFIG[cat] ?? {
            color: COLORS.primary, bg: COLORS.primaryLight, emoji: '📦', icon: 'grid',
          };
          const active = category === cat;
          return (
            <Animated.View key={cat} style={{ transform: [{ scale: getChipScale(cat) }] }}>
              <Pressable
                style={[
                  styles.chip,
                  active && { backgroundColor: cfg.color, borderColor: cfg.color },
                ]}
                onPress={() => { animateChipPress(cat); toggleCategory(cat); }}
              >
                <Ionicons
                  name={cfg.icon as any}
                  size={14}
                  color={active ? '#fff' : cfg.color}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* ── Chips de tipo de oferta con Ionicons ─────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow2}
        contentContainerStyle={styles.filterContent}
      >
        {OFFER_TYPES.map(type => {
          const cfg = OFFER_CONFIG[type] ?? {
            color: COLORS.primary, bg: COLORS.primaryLight, emoji: '🤝', icon: 'swap-horizontal',
          };
          const active = offerType === type;
          return (
            <Animated.View key={type} style={{ transform: [{ scale: getChipScale('offer_' + type) }] }}>
              <Pressable
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : { borderColor: cfg.color + '55' },
                ]}
                onPress={() => { animateChipPress('offer_' + type); toggleOfferType(type); }}
              >
                <Ionicons
                  name={cfg.icon as any}
                  size={14}
                  color={active ? '#fff' : cfg.color}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive, !active && { color: cfg.color }]}>
                  {type}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Items list */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Cargando publicaciones...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: listOpacity, transform: [{ translateY: listY }] }}>
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchItems(search, category, offerType, true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cube-outline" size={56} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySub}>
                Intenta con otros filtros o sé el primero en publicar
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateItem')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyBtnText}>Publicar algo</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Desarrollado por Vanessa Bastidas · ShareCampus © 2025
              </Text>
            </View>
          }
        />
        </Animated.View>
      )}

      {/* FAB with pulse animation */}
      <Animated.View
        style={[styles.fabWrap, { transform: [{ scale: fabPulse }] }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('CreateItem')}
          onPressIn={() =>
            Animated.spring(fabPressScale, {
              toValue: 0.88, useNativeDriver: true, tension: 100, friction: 8,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(fabPressScale, {
              toValue: 1, useNativeDriver: true, tension: 100, friction: 8,
            }).start()
          }
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBlob: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerBlobBottom: {
    position: 'absolute', bottom: -30, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(244,63,94,0.12)',
  },
  heroSection: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
    paddingTop: 2,
  },
  heroSlogan: {
    flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 12,
    lineHeight: 17, fontWeight: '500', marginRight: 10,
  },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    ...SHADOWS.small,
  },
  heroBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  headerBtnIcon: { fontSize: 18 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff' },
  clearIcon: { fontSize: 14, color: 'rgba(255,255,255,0.7)', paddingLeft: 8 },
  filterRow: { backgroundColor: COLORS.card, maxHeight: 52 },
  filterRow2: {
    backgroundColor: COLORS.card,
    maxHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipAllActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  offerChip: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  offerChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  listContent: { padding: 12, paddingBottom: 100 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loaderText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cardAccent: { width: 4 },
  cardImage: { width: 108, height: 118 },
  cardImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 36 },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 19,
  },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: 5, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardUser: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8,
  },
  emptySub: {
    fontSize: 14, color: COLORS.textMuted, textAlign: 'center',
    paddingHorizontal: 32, lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 20, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
    ...SHADOWS.button,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fabWrap: { position: 'absolute', bottom: 28, right: 22 },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.fab,
  },
  fabIcon: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '300' },

  // Footer
  footer: {
    alignItems: 'center', paddingVertical: 20, paddingBottom: 32,
  },
  footerText: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    fontWeight: '400', letterSpacing: 0.2,
  },
});
