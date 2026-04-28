import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import database from '@react-native-firebase/database';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FirebaseMessage,
  ChatStatus,
  CHAT_STATUS_COLOR,
  CHAT_STATUS_LABEL,
} from '../types';
import { formatChatTime } from '../utils/time';
import { COLORS, SHADOWS } from '../theme';

type Props = {
  navigation: NavigationProp<MainStackParamList>;
  route: RouteProp<MainStackParamList, 'ChatDetail'>;
};

const GRAD_START = '#667eea';
const GRAD_END = '#764ba2';

// Animated message bubble that slides up on first render
function MessageBubble({
  msg,
  isMine,
  otherUserPhoto,
  otherUserName,
  isLatest,
}: {
  msg: FirebaseMessage;
  isMine: boolean;
  otherUserPhoto: string | null;
  otherUserName: string;
  isLatest: boolean;
}) {
  const slideY = useRef(new Animated.Value(isLatest ? 16 : 0)).current;
  const opacity = useRef(new Animated.Value(isLatest ? 0 : 1)).current;

  useEffect(() => {
    if (isLatest) {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [isLatest]);

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isMine ? styles.msgRowRight : styles.msgRowLeft,
        { transform: [{ translateY: slideY }], opacity },
      ]}
    >
      {!isMine && (
        otherUserPhoto ? (
          <Image source={{ uri: otherUserPhoto }} style={styles.msgAvatar} />
        ) : (
          <View style={[styles.msgAvatar, styles.msgAvatarFallback]}>
            <Text style={styles.msgAvatarInitial}>
              {(otherUserName[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        )
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {isMine && <View style={styles.bubbleGradOverlay} />}
        <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
          {msg.message}
        </Text>
        <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
          {formatChatTime(msg.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatDetailScreen({ navigation, route }: Props) {
  const {
    chatId,
    firebaseChatId,
    chatStatus: initialStatus,
    otherUserName,
    otherUserPhoto,
    itemTitle,
    itemId,
    isReceiver,
  } = route.params;

  const { userId } = useAuth();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>(initialStatus);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animated values
  const onlinePulse = useRef(new Animated.Value(1)).current;
  const sendRotation = useRef(new Animated.Value(0)).current;

  // Online dot pulse animation (loops forever)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(onlinePulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(onlinePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
    return () => onlinePulse.stopAnimation();
  }, []);

  // Firebase: listen to messages
  useEffect(() => {
    if (!firebaseChatId) return;
    const ref = database().ref(`chats/${firebaseChatId}/messages`);
    ref.on('value', snapshot => {
      const val = snapshot.val();
      if (val) {
        const msgs: FirebaseMessage[] = Object.entries(val).map(([key, data]) => ({
          key,
          ...(data as Omit<FirebaseMessage, 'key'>),
        }));
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
    return () => ref.off('value');
  }, [firebaseChatId]);

  // Firebase: listen to status changes
  useEffect(() => {
    if (!firebaseChatId) return;
    const ref = database().ref(`chats/${firebaseChatId}/metadata/status`);
    ref.on('value', snapshot => {
      const val: ChatStatus | null = snapshot.val();
      if (val) setStatus(val);
    });
    return () => ref.off('value');
  }, [firebaseChatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText('');

    // Rotate send button animation
    sendRotation.setValue(0);
    Animated.timing(sendRotation, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start(() => sendRotation.setValue(0));

    try {
      await api.post(`/chats/${chatId}/messages`, { message: msg });
    } catch (e: any) {
      setText(msg);
      Alert.alert('Error', e.response?.data?.message ?? 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  async function handleRespond(action: 'accept' | 'reject') {
    const verb = action === 'accept' ? 'Aceptar' : 'Rechazar';
    Alert.alert(
      `¿${verb} solicitud?`,
      `¿Deseas ${verb.toLowerCase()} la solicitud de ${otherUserName} para "${itemTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: verb,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.post(`/chats/${chatId}/respond`, { action });
              setStatus(action === 'accept' ? 'aceptado' : 'rechazado');
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message ?? 'No se pudo procesar la acción.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }

  function goToConfirmation() {
    navigation.navigate('Confirmation', {
      chatId,
      isReceiver,
      otherUserName,
      itemTitle,
    });
  }

  const statusColor = CHAT_STATUS_COLOR[status] ?? '#757575';
  const statusLabel = CHAT_STATUS_LABEL[status] ?? status;
  const isClosed =
    status === 'rechazado' || status === 'completado' || status === 'bloqueado';

  const sendSpin = sendRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const canSend = text.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GRAD_START} />

      {/* ── HEADER ─────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBlob1} />
        <View style={styles.headerBlob2} />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Avatar + online dot */}
        <View style={styles.headerAvatarWrap}>
          {otherUserPhoto ? (
            <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
              <Text style={styles.headerAvatarInitial}>
                {(otherUserName[0] ?? '?').toUpperCase()}
              </Text>
            </View>
          )}
          <Animated.View
            style={[styles.onlineDot, { transform: [{ scale: onlinePulse }] }]}
          />
        </View>

        {/* Name + item */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUserName}
          </Text>
          <Text style={styles.headerItem} numberOfLines={1}>
            📦 {itemTitle}
          </Text>
        </View>

        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: statusColor + '30' }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── MESSAGES ───────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.key}
          renderItem={({ item: msg, index }) => (
            <MessageBubble
              msg={msg}
              isMine={msg.sender_id === userId}
              otherUserPhoto={otherUserPhoto}
              otherUserName={otherUserName}
              isLatest={index === messages.length - 1}
            />
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyMessagesText}>
                Aún no hay mensajes.{'\n'}¡Empieza la conversación!
              </Text>
            </View>
          }
        />

        {/* ── ACTION BAR ─────────────────────────── */}
        {!isClosed && status === 'activo' && isReceiver && (
          <View style={styles.actionBar}>
            <Text style={styles.actionBarLabel}>
              <Text style={styles.actionBarBold}>{otherUserName}</Text> quiere este ítem
            </Text>
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleRespond('reject')}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#D32F2F" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color="#D32F2F" />
                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleRespond('accept')}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={styles.acceptBtnText}>Aceptar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isClosed && status === 'aceptado' && isReceiver && (
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.codeBtn} onPress={goToConfirmation} activeOpacity={0.85}>
              <Ionicons name="key-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.codeBtnText}>Generar código de entrega</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isClosed && status === 'aceptado' && !isReceiver && (
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.confirmBtn} onPress={goToConfirmation} activeOpacity={0.85}>
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Confirmar entrega</Text>
            </TouchableOpacity>
          </View>
        )}

        {isClosed && (
          <View style={[styles.closedBar, { borderTopColor: statusColor + '40' }]}>
            <Ionicons
              name={
                status === 'completado'
                  ? 'trophy-outline'
                  : status === 'rechazado'
                  ? 'close-circle-outline'
                  : 'ban-outline'
              }
              size={18}
              color={statusColor}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.closedBarText, { color: statusColor }]}>
              {status === 'completado' && 'Intercambio completado exitosamente'}
              {status === 'rechazado' && 'Este intercambio fue rechazado'}
              {status === 'bloqueado' && 'Este chat fue bloqueado'}
            </Text>
          </View>
        )}

        {/* ── INPUT ──────────────────────────────── */}
        {!isClosed && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#9E9E9E"
              multiline
              maxLength={500}
            />
            <Animated.View style={{ transform: [{ rotate: sendSpin }] }}>
              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={17} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5FF' },
  flex: { flex: 1 },

  // Header
  header: {
    backgroundColor: GRAD_START,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    overflow: 'hidden',
  },
  headerBlob1: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: GRAD_END, opacity: 0.5,
  },
  headerBlob2: {
    position: 'absolute', bottom: -20, left: 80,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#4F46E5', opacity: 0.3,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: 6,
    width: 38, alignItems: 'center',
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  headerAvatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarInitial: { color: '#fff', fontSize: 16, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4ADE80',
    borderWidth: 1.5, borderColor: GRAD_START,
  },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerItem: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  statusPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  // Messages
  messagesList: { padding: 14, paddingBottom: 8, flexGrow: 1 },
  emptyMessages: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  emptyMessagesText: {
    fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22,
  },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 6 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15 },
  msgAvatarFallback: {
    backgroundColor: COLORS.primaryMid, justifyContent: 'center', alignItems: 'center',
  },
  msgAvatarInitial: { color: '#fff', fontSize: 12, fontWeight: '800' },

  bubble: {
    maxWidth: '72%', borderRadius: 18,
    paddingHorizontal: 13, paddingVertical: 9,
    overflow: 'hidden',
  },
  bubbleMine: {
    backgroundColor: GRAD_START,
    borderBottomRightRadius: 4,
    ...SHADOWS.small,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  bubbleGradOverlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    left: '40%',
    backgroundColor: GRAD_END,
    opacity: 0.55,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#fff', fontWeight: '500' },
  bubbleTextOther: { color: COLORS.textPrimary },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  bubbleTimeOther: { color: COLORS.textMuted },

  // Action bars
  actionBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    ...SHADOWS.small,
  },
  actionBarLabel: { fontSize: 13, color: '#555', marginBottom: 10, textAlign: 'center' },
  actionBarBold: { fontWeight: '700', color: COLORS.textPrimary },
  actionBtns: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#D32F2F',
    borderRadius: 12, paddingVertical: 12,
  },
  rejectBtnText: { color: '#D32F2F', fontSize: 14, fontWeight: '700' },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#388E3C',
    borderRadius: 12, paddingVertical: 12,
  },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  codeBtn: {
    backgroundColor: GRAD_START, borderRadius: 12,
    paddingVertical: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  codeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  confirmBtn: {
    backgroundColor: '#388E3C', borderRadius: 12,
    paddingVertical: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: 14,
    borderTopWidth: 2,
  },
  closedBarText: { fontSize: 13, fontWeight: '600' },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: GRAD_START,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  sendBtnDisabled: { backgroundColor: '#B0BEC5', ...SHADOWS.small },
});
