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
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { Item, ITEM_STATUSES, STATUS_COLOR, ItemStatus } from '../types';

type Props = { navigation: NavigationProp<MainStackParamList> };

const BLUE = '#1E4D8C';

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
                <Text style={[modalStyles.optionText, isActive && { color: BLUE, fontWeight: '700' }]}>
                  {status}
                </Text>
                {isActive && <Text style={modalStyles.checkmark}>✓</Text>}
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
  optionActive: { backgroundColor: '#E8EFF9' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, fontSize: 15, color: '#333' },
  checkmark: { color: BLUE, fontSize: 16, fontWeight: '700' },
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
            <Text style={{ fontSize: 26 }}>📦</Text>
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

          {/* Status - tappable */}
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
                <Text style={[styles.statusEditIcon, { color: statusColor }]}>▾</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => confirmDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis publicaciones</Text>
        <View style={{ width: 80 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={BLUE} size="large" />
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
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 52, marginBottom: 12 }}>📭</Text>
              <Text style={styles.emptyTitle}>Sin publicaciones</Text>
              <Text style={styles.emptySubtitle}>
                Aún no has publicado ningún ítem. ¡Sé el primero en compartir!
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateItem')}
                activeOpacity={0.85}
              >
                <Text style={styles.createBtnText}>Publicar ítem</Text>
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
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBack: { width: 80 },
  headerBackText: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listContent: { padding: 14, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImage: { width: 90, height: 100 },
  cardImagePlaceholder: {
    backgroundColor: '#EEF2F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', lineHeight: 19 },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  categoryBadge: {
    backgroundColor: '#E8EFF9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, color: BLUE, fontWeight: '600' },
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
  statusEditIcon: { fontSize: 10 },
  deleteBtn: {
    padding: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  deleteIcon: { fontSize: 18 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  createBtn: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
