import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { Item, ITEM_STATUSES, STATUS_COLOR, ItemStatus } from '../types';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: NavigationProp<MainStackParamList> };

const PRIMARY = COLORS.primary;

interface StatusModalProps {
  visible: boolean;
  current: ItemStatus;
  onSelect: (s: ItemStatus) => void;
  onClose: () => void;
}

function StatusModal({ visible, current, onSelect, onClose }: StatusModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Cambiar estado del ítem</Text>
          {ITEM_STATUSES.map(status => {
            const color = STATUS_COLOR[status] ?? '#757575';
            const isActive = status === current;
            return (
              <TouchableOpacity
                key={status}
                style={[modalStyles.option, isActive && modalStyles.optionActive]}
                onPress={() => onSelect(status)}
                activeOpacity={0.7}
              >
                <View style={[modalStyles.dot, { backgroundColor: color }]} />
                <Text style={[modalStyles.optionText, isActive && { color: PRIMARY, fontWeight: '700' }]}>
                  {status}
                </Text>
                {isActive && <Ionicons name="checkmark" size={16} color={PRIMARY} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 14, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: COLORS.primaryLight },
  dot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, fontSize: 15, color: '#333' },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  cancelText: { color: '#666', fontSize: 15 },
});

export default function MyItemsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get<Item[]>('/items/my-items');
      setItems(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  async function handleStatusChange(item: Item, newStatus: ItemStatus) {
    setModalItem(null);
    if (newStatus === item.status) return;
    setUpdatingId(item.id);
    try {
      await api.patch(`/items/${item.id}`, { status: newStatus });
      setItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, status: newStatus } : i)),
      );
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  }

  function confirmDelete(item: Item) {
    Alert.alert(
      'Eliminar publicación',
      `¿Deseas eliminar "${item.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/items/${item.id}`);
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message ?? 'No se pudo eliminar el ítem.');
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: Item }) {
    const photo = item.photos?.[0];
    const statusColor = STATUS_COLOR[item.status] ?? '#757575';
    const isUpdating = updatingId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.85}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="cube-outline" size={28} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>{item.offer_type}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.statusBtn, { backgroundColor: statusColor + '18' }]}
            onPress={() => setModalItem(item)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={statusColor} />
            ) : (
              <>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                <Ionicons name="chevron-down" size={12} color={statusColor} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => confirmDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis publicaciones</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={PRIMARY} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchItems(true)}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cube-outline" size={56} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>Sin publicaciones</Text>
              <Text style={styles.emptySubtitle}>
                Comparte algo con tu comunidad universitaria
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateItem')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.createBtnText}>Publicar mi primer ítem</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {modalItem && (
        <StatusModal
          visible
          current={modalItem.status as ItemStatus}
          onSelect={s => handleStatusChange(modalItem, s)}
          onClose={() => setModalItem(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBack: {
    width: 44, height: 36,
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listContent: { padding: 14, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardImage: { width: 90, height: 100 },
  cardImagePlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', lineHeight: 19 },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
  offerBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  offerBadgeText: { fontSize: 11, color: '#E65100', fontWeight: '600' },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    gap: 5,
    minWidth: 100,
    minHeight: 26,
    justifyContent: 'center',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: {
    padding: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  createBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.button,
  },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
