import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: NavigationProp<MainStackParamList> };

function SkeletonBox({ w, h, r = 8, style }: { w: number | string; h: number; r?: number; style?: object }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  return (
    <Animated.View
      style={[
        { width: w as any, height: h, borderRadius: r, backgroundColor: '#DDD6FE', opacity },
        style,
      ]}
    />
  );
}

function ProfileSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header skeleton */}
      <View style={[styles.headerBg, { alignItems: 'center', paddingTop: 32, paddingBottom: 36 }]}>
        <SkeletonBox w={100} h={100} r={50} style={{ marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <SkeletonBox w={160} h={18} r={9} style={{ marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <SkeletonBox w={120} h={13} r={6} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </View>
      {/* Stats skeleton */}
      <View style={{ flexDirection: 'row', gap: 12, margin: 16 }}>
        <SkeletonBox w="47%" h={90} r={18} />
        <SkeletonBox w="47%" h={90} r={18} />
      </View>
      {/* Actions skeleton */}
      <View style={{ backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 16, gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonBox key={i} w="80%" h={14} r={7} />
        ))}
      </View>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : 'star-outline'}
          size={20}
          color={i <= filled ? '#FBBF24' : COLORS.border}
        />
      ))}
    </View>
  );
}

const ACTIONS = (nav: NavigationProp<MainStackParamList>) => [
  {
    icon: 'person' as const, label: 'Editar perfil',
    bg: COLORS.primaryLight, color: COLORS.primary,
    onPress: () => nav.navigate('EditProfile'),
  },
  {
    icon: 'cube' as const, label: 'Mis publicaciones',
    bg: COLORS.amberLight, color: COLORS.amber,
    onPress: () => nav.navigate('MyItems'),
  },
  {
    icon: 'heart' as const, label: 'Lista de deseos',
    bg: '#F3E8FF', color: '#9333EA',
    onPress: () => nav.navigate('Wishlist'),
  },
  {
    icon: 'chatbubbles' as const, label: 'Mis chats',
    bg: COLORS.skyLight, color: COLORS.sky,
    onPress: () => nav.navigate('Chats'),
  },
];

export default function ProfileScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(30)).current;

  const loadProfile = useCallback(() => {
    setLoading(true);
    setErrorMsg(null);
    contentOpacity.setValue(0);
    contentY.setValue(30);
    api
      .get<Profile>('/profile')
      .then(({ data }) => {
        if (!data) {
          // Backend devolvió 200 con body null — tratar como 404
          setErrorMsg('No se encontró tu perfil. Intenta cerrar sesión y volver a entrar.');
          return;
        }
        setProfile(data);
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1, duration: 400, useNativeDriver: true,
          }),
          Animated.spring(contentY, {
            toValue: 0, tension: 60, friction: 12, useNativeDriver: true,
          }),
        ]).start();
      })
      .catch((err) => {
        const status = err?.response?.status;
        const isTimeout = err?.code === 'ECONNABORTED';
        console.error('[Profile] Error cargando perfil:', {
          status,
          code: err?.code,
          message: err?.message,
          data: err?.response?.data,
        });
        if (isTimeout) {
          setErrorMsg('El servidor tardó demasiado. Espera un momento y reintenta.');
        } else if (status === 401) {
          setErrorMsg('Sesión expirada. Cierra sesión e inicia de nuevo.');
        } else if (status === 404) {
          setErrorMsg('Perfil no encontrado. Intenta cerrar sesión y volver a entrar.');
        } else if (!err?.response) {
          setErrorMsg('Sin conexión. Verifica tu red e intenta de nuevo.');
        } else {
          setErrorMsg(`Error ${status ?? 'desconocido'}. Intenta de nuevo.`);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadProfile);

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{errorMsg ?? 'No se pudo cargar el perfil.'}</Text>
        <Pressable style={styles.retryBtn} onPress={loadProfile}>
          <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = profile.full_name ?? profile.email.split('@')[0];
  const initial = (displayName[0] ?? '?').toUpperCase();
  const actions = ACTIONS(navigation);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerBg}>
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{profile.email}</Text>

          {(profile.faculty || profile.semester) && (
            <Text style={styles.meta}>
              {[
                profile.faculty,
                profile.semester ? `Semestre ${profile.semester}` : null,
              ]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
          )}

          <View style={styles.badgesRow}>
            {profile.is_verified_badge && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Perfil Verificado</Text>
              </View>
            )}
          </View>
        </View>

        <Animated.View
          style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}
        >
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
              <Stars rating={profile.rating} />
              <Text style={[styles.statValue, { color: COLORS.primary }]}>
                {profile.rating.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>{profile.rating_count} reseñas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.amberLight }]}>
              <Text style={styles.statEmoji}>📦</Text>
              <Text style={[styles.statValue, { color: COLORS.amber }]}>
                {profile.exchanges_count}
              </Text>
              <Text style={styles.statLabel}>intercambios</Text>
            </View>
          </View>

          {/* Incomplete profile banner */}
          {!profile.is_profile_complete && (
            <Pressable
              style={styles.incompleteBanner}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={styles.incompleteBannerIconWrap}>
                <Text style={styles.incompleteBannerIconChar}>Ed</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incompleteBannerTitle}>Completa tu perfil</Text>
                <Text style={styles.incompleteBannerText}>
                  Agrega tu nombre, facultad y semestre para generar más confianza.
                </Text>
              </View>
              <Text style={styles.incompleteBannerArrow}>›</Text>
            </Pressable>
          )}

          {/* Action menu */}
          <View style={styles.actionsCard}>
            {actions.map((action, i) => (
              <React.Fragment key={action.label}>
                <Pressable
                  style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
                  onPress={action.onPress}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon} size={18} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={action.color} />
                </Pressable>
                {i < actions.length - 1 && <View style={styles.sep} />}
              </React.Fragment>
            ))}
          </View>

          {/* Logout */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={20} color="#BE123C" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  errorText: {
    fontSize: 14, color: COLORS.textMuted, textAlign: 'center',
    marginTop: 16, marginBottom: 20, lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
    ...SHADOWS.button,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerBg: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blob2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(244,63,94,0.15)',
  },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 14,
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '800', color: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  verifiedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, margin: 16, marginBottom: 0 },
  statCard: {
    flex: 1, borderRadius: 18, padding: 16,
    alignItems: 'center', gap: 6,
    ...SHADOWS.small,
  },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  incompleteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, marginBottom: 0,
    backgroundColor: COLORS.amberLight, borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.amber,
    ...SHADOWS.small,
  },
  incompleteBannerIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FDE68A',
    justifyContent: 'center', alignItems: 'center',
  },
  incompleteBannerIconChar: { fontSize: 11, fontWeight: '800', color: '#92400E' },
  incompleteBannerTitle: { fontSize: 13, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  incompleteBannerText: { fontSize: 12, color: '#B45309', lineHeight: 17 },
  incompleteBannerArrow: { fontSize: 22, color: COLORS.amber },
  actionsCard: {
    backgroundColor: COLORS.card,
    margin: 16, borderRadius: 18,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, gap: 14,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  actionChar: { fontSize: 11, fontWeight: '800' },
  actionLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  actionChevron: { fontSize: 22, fontWeight: '700' },
  sep: { height: 1, backgroundColor: COLORS.divider, marginLeft: 70 },
  logoutBtn: {
    marginHorizontal: 16, marginBottom: 32,
    backgroundColor: '#FFE4E6', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FECDD3',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#BE123C' },
});
