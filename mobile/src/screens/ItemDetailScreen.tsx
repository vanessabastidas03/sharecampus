import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { Item } from '../types';
import ReportModal from '../components/ReportModal';
import { useAuth } from '../context/AuthContext';
import { COLORS, CATEGORY_CONFIG, OFFER_CONFIG, STATUS_CFG, SHADOWS } from '../theme';

type Props = {
  navigation: StackNavigationProp<MainStackParamList, 'ItemDetail'>;
  route: RouteProp<MainStackParamList, 'ItemDetail'>;
};

const { width: SCREEN_W } = Dimensions.get('window');

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text
          key={i}
          style={[starStyles.star, { color: i <= filled ? '#FBBF24' : COLORS.border }]}
        >
          ★
        </Text>
      ))}
      <Text style={starStyles.value}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  star: { fontSize: 16 },
  value: { fontSize: 13, color: COLORS.textMuted, marginLeft: 4 },
});

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const { userId } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    api
      .get<Item>(`/items/${itemId}`)
      .then(({ data }) => setItem(data))
      .finally(() => setLoading(false));
  }, [itemId]);

  async function handleContact() {
    if (!item) return;
    setContacting(true);
    try {
      const { data: chat } = await api.post<{
        id: string;
        firebase_chat_id: string | null;
        status: string;
      }>('/chats', {
        item_id: item.id,
        receiver_id: item.user_id,
      });
      navigation.navigate('ChatDetail', {
        chatId: chat.id,
        firebaseChatId: chat.firebase_chat_id ?? '',
        chatStatus: (chat.status ?? 'activo') as import('../types').ChatStatus,
        otherUserId: item.user_id,
        otherUserName: displayName,
        otherUserPhoto: item.user?.photo_url ?? null,
        itemTitle: item.title,
        itemId: item.id,
        isReceiver: false,
      });
    } catch (err: any) {
      const msg: string = err.response?.data?.message ?? 'Error al iniciar el chat';
      Alert.alert('Error', msg);
    } finally {
      setContacting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el ítem.</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const photos = item.photos?.length ? item.photos : [];
  const catCfg = CATEGORY_CONFIG[item.category] ?? {
    color: COLORS.primary, bg: COLORS.primaryLight, emoji: '📦',
  };
  const offerCfg = OFFER_CONFIG[item.offer_type] ?? {
    color: COLORS.primary, bg: COLORS.primaryLight, emoji: '🤝',
  };
  const statusCfg = STATUS_CFG[item.status] ?? { color: '#6B7280', bg: '#F3F4F6' };
  const displayName = item.user?.full_name ?? item.user?.email?.split('@')[0] ?? 'Usuario';
  const isOwner = item.user_id === userId;
  const initial = (displayName[0] ?? '?').toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Back button over photos */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <View>
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={photos}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item: uri }) => (
                <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
              )}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                setPhotoIndex(idx);
              }}
            />
            {photos.length > 1 && (
              <View style={styles.dotsRow}>
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === photoIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: catCfg.bg }]}>
            <Text style={styles.photoPlaceholderEmoji}>{catCfg.emoji}</Text>
            <Text style={[styles.photoPlaceholderText, { color: catCfg.color }]}>Sin fotos</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Badges row */}
          <View style={styles.badgesRow}>
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
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{item.status}</Text>
            </View>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          {item.campus && <Text style={styles.campus}>🎓 {item.campus}</Text>}
          {(item.ciudad || item.departamento) && (
            <Text style={styles.locationLine}>
              📍 {[item.ciudad, item.departamento].filter(Boolean).join(', ')}
            </Text>
          )}

          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Descripción</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {/* Seller card */}
          <View style={styles.sellerCard}>
            <Text style={styles.sectionLabel}>Publicado por</Text>
            <View style={styles.sellerRow}>
              {item.user?.photo_url ? (
                <Image source={{ uri: item.user.photo_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={22} color="#fff" />
                </View>
              )}
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{displayName}</Text>
                <Stars rating={item.user?.rating ?? 0} />
                <Text style={styles.sellerMeta}>
                  {item.user?.rating_count ?? 0} calificaciones
                  {item.user?.exchanges_count
                    ? `  ·  ${item.user.exchanges_count} intercambios`
                    : ''}
                </Text>
              </View>
            </View>
          </View>

          {!isOwner && (
            <Pressable style={styles.reportLink} onPress={() => setShowReport(true)}>
              <Text style={styles.reportLinkText}>🚩 Reportar este ítem</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {item && (
        <ReportModal
          visible={showReport}
          onClose={() => setShowReport(false)}
          targetType="item"
          targetId={item.id}
          targetTitle={item.title}
        />
      )}

      {/* Contact CTA */}
      {!isOwner && item.status === 'Disponible' && (
        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={[styles.contactBtn, contacting && styles.contactBtnDisabled]}
              onPress={handleContact}
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
              disabled={contacting}
            >
              {contacting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.contactBtnText}>💬  Contactar</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: COLORS.textMuted, marginBottom: 12 },
  backLink: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  backButton: {
    position: 'absolute',
    top: 52, left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(124,58,237,0.7)',
    borderRadius: 20,
    width: 38, height: 38,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { color: '#fff', fontSize: 24, lineHeight: 28, marginLeft: -2 },
  photo: { width: SCREEN_W, height: 300 },
  photoPlaceholder: {
    width: SCREEN_W, height: 220,
    justifyContent: 'center', alignItems: 'center',
  },
  photoPlaceholderEmoji: { fontSize: 64 },
  photoPlaceholderText: { fontSize: 14, marginTop: 8, fontWeight: '600' },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    paddingVertical: 10, backgroundColor: '#fff',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },
  content: { padding: 20 },
  badgesRow: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12,
  },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 28 },
  campus: { fontSize: 13, color: COLORS.textMuted, marginTop: 6 },
  locationLine: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase',
  },
  description: { fontSize: 15, color: '#444', lineHeight: 22 },
  sellerCard: {
    marginTop: 24, padding: 16,
    backgroundColor: COLORS.bg, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  sellerMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  reportLink: { alignItems: 'center', paddingVertical: 16 },
  reportLinkText: { fontSize: 13, color: COLORS.textMuted },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  contactBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  contactBtnDisabled: { opacity: 0.65 },
  contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
