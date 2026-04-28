import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ChatRecord,
  ChatParticipant,
  CHAT_STATUS_LABEL,
  CHAT_STATUS_COLOR,
  ChatStatus,
} from '../types';
import { formatChatTime } from '../utils/time';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: NavigationProp<MainStackParamList> };

const GRAD_START = '#667eea';
const GRAD_END = '#764ba2';

// Map each status to a valid Ionicons icon name
const STATUS_ICON: Record<ChatStatus, keyof typeof Ionicons.glyphMap> = {
  activo: 'time-outline',
  aceptado: 'checkmark-circle',
  rechazado: 'close-circle',
  completado: 'trophy',
  bloqueado: 'ban',
};

function Avatar({ user }: { user: ChatParticipant }) {
  const initial = ((user.full_name ?? user.email)?.[0] ?? '?').toUpperCase();
  if (user.photo_url) {
    return <Image source={{ uri: user.photo_url }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

// Badge that pulses when there are unread chats
function CountBadge({ count }: { count: number }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
    return () => pulse.stopAnimation();
  }, []);

  return (
    <Animated.View style={[styles.countBadge, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.countText}>{count}</Text>
    </Animated.View>
  );
}

interface ChatCardProps {
  chat: ChatRecord;
  onPress: () => void;
  userId: string | null;
}

function ChatCard({ chat, onPress, userId }: ChatCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const isReceiver = chat.receiver_id === userId;
  const otherUser: ChatParticipant = isReceiver ? chat.sender : chat.receiver;
  const otherName =
    otherUser?.full_name ?? otherUser?.email?.split('@')[0] ?? 'Usuario';
  const itemTitle = chat.item?.title ?? 'Ítem eliminado';
  const chatStatus = (chat.status as ChatStatus) in CHAT_STATUS_COLOR
    ? (chat.status as ChatStatus)
    : 'activo';
  const statusColor = CHAT_STATUS_COLOR[chatStatus];
  const statusLabel = CHAT_STATUS_LABEL[chatStatus];
  const statusIcon: keyof typeof Ionicons.glyphMap =
    STATUS_ICON[chatStatus] ?? 'ellipse-outline';

  const fallbackParticipant: ChatParticipant = { id: '', email: '?', full_name: null, photo_url: null };

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.chatCard}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Left accent bar colored by status */}
        <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

        <View style={styles.avatarWrap}>
          <Avatar user={otherUser ?? fallbackParticipant} />
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatName} numberOfLines={1}>{otherName}</Text>
            <Text style={styles.chatTime}>{formatChatTime(chat.updated_at)}</Text>
          </View>
          <Text style={styles.chatItem} numberOfLines={1}>📦 {itemTitle}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <Ionicons name={statusIcon} size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ChatsScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchChats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const { data } = await api.get<ChatRecord[]>('/chats');
      setChats(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchChats(); }, [fetchChats]));

  function goToChat(chat: ChatRecord) {
    const isReceiver = chat.receiver_id === userId;
    const otherUser: ChatParticipant = isReceiver ? chat.sender : chat.receiver;
    navigation.navigate('ChatDetail', {
      chatId: chat.id,
      firebaseChatId: chat.firebase_chat_id ?? '',
      chatStatus: chat.status,
      otherUserId: otherUser.id,
      otherUserName: otherUser.full_name ?? otherUser.email.split('@')[0],
      otherUserPhoto: otherUser.photo_url,
      itemTitle: chat.item?.title ?? 'Ítem',
      itemId: chat.item_id,
      isReceiver,
    });
  }

  const activeCount = chats.filter(c => c.status === 'activo').length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GRAD_START} />

      {/* ── HEADER ─────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBlob1} />
        <View style={styles.headerBlob2} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Ionicons name="chatbubbles" size={22} color="rgba(255,255,255,0.85)" />
            <Text style={styles.headerTitle}>Mensajes</Text>
            {activeCount > 0 && <CountBadge count={activeCount} />}
          </View>

          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.headerSub}>
          {chats.length === 0
            ? 'Sin conversaciones aún'
            : `${chats.length} conversaci${chats.length === 1 ? 'ón' : 'ones'}`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="wifi-outline" size={52} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Sin conexión</Text>
          <Text style={styles.errorText}>No se pudieron cargar los mensajes.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchChats()}>
            <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={c => c.id}
          renderItem={({ item: chat }) => (
            <ChatCard chat={chat} onPress={() => goToChat(chat)} userId={userId} />
          )}
          contentContainerStyle={
            chats.length === 0 ? styles.listContentEmpty : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchChats(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={56} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin conversaciones</Text>
              <Text style={styles.emptySubtitle}>
                Cuando contactes a alguien sobre un ítem, el chat aparecerá aquí.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Home')}
              >
                <Ionicons name="search" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyBtnText}>Explorar publicaciones</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    backgroundColor: GRAD_START,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerBlob1: {
    position: 'absolute', top: -30, right: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: GRAD_END, opacity: 0.5,
  },
  headerBlob2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#4F46E5', opacity: 0.35,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: 8,
    width: 40, alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginLeft: 48 },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // States
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 14, marginBottom: 6 },
  errorText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 22, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // List
  listContent: { padding: 14, paddingBottom: 32 },
  listContentEmpty: { flexGrow: 1, padding: 14 },

  // Chat card
  cardWrap: { marginBottom: 10 },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 12,
    ...SHADOWS.small,
  },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  avatarWrap: { marginHorizontal: 12, position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: COLORS.primaryMid,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statusDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    borderWidth: 2, borderColor: COLORS.card,
  },
  chatInfo: { flex: 1 },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  chatTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 8 },
  chatItem: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 40,
  },
  emptyIconWrap: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, ...SHADOWS.small,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 21, marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center',
    ...SHADOWS.button,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
