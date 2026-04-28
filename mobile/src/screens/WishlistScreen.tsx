import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { WishlistItem, CATEGORIES } from '../types';
import { COLORS, SHADOWS } from '../theme';

type Props = { navigation: NavigationProp<MainStackParamList> };

const PRIMARY = COLORS.primary;

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdded: (item: WishlistItem) => void;
}

function AddModal({ visible, onClose, onAdded }: AddModalProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [campus, setCampus] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setQuery('');
    setCategory('');
    setCampus('');
  }

  async function handleAdd() {
    if (!query.trim()) {
      Alert.alert('Campo requerido', 'Escribe qué quieres buscar.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<WishlistItem>('/wishlist', {
        search_query: query.trim(),
        ...(category ? { category } : {}),
        ...(campus.trim() ? { campus: campus.trim() } : {}),
      });
      onAdded(data);
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'No se pudo agregar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Agregar a lista de deseos</Text>

          <Text style={modalStyles.label}>
            Que estas buscando? <Text style={modalStyles.req}>*</Text>
          </Text>
          <TextInput
            style={modalStyles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Ej: Calculo diferencial, calculadora graficadora…"
            placeholderTextColor="#9E9E9E"
            autoFocus
            maxLength={100}
          />

          <Text style={modalStyles.label}>Categoria (opcional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={modalStyles.chipsRow}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[modalStyles.chip, category === cat && modalStyles.chipActive]}
                onPress={() => setCategory(prev => (prev === cat ? '' : cat))}
              >
                <Text style={[modalStyles.chipText, category === cat && modalStyles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={modalStyles.label}>Campus (opcional)</Text>
          <TextInput
            style={modalStyles.input}
            value={campus}
            onChangeText={setCampus}
            placeholder="Ej: Sede Norte"
            placeholderTextColor="#9E9E9E"
            maxLength={60}
          />

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.addBtn, saving && modalStyles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={modalStyles.addBtnText}>Agregar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  req: { color: '#D32F2F' },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  chipsRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 14 },
  addBtn: {
    flex: 2,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default function WishlistScreen({ navigation }: Props) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get<WishlistItem[]>('/wishlist');
      setItems(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  function handleAdded(item: WishlistItem) {
    setItems(prev => [item, ...prev]);
  }

  function confirmDelete(item: WishlistItem) {
    Alert.alert(
      'Eliminar busqueda',
      `¿Eliminar "${item.search_query}" de tu lista de deseos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            try {
              await api.delete(`/wishlist/${item.id}`);
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message ?? 'No se pudo eliminar.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: WishlistItem }) {
    const isDeleting = deletingId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Ionicons name="search" size={17} color={PRIMARY} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardQuery}>{item.search_query}</Text>
          <View style={styles.cardMeta}>
            {item.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{item.category}</Text>
              </View>
            )}
            {item.campus && (
              <View style={styles.campusBadge}>
                <Ionicons name="location-outline" size={10} color={PRIMARY} />
                <Text style={styles.campusText}> {item.campus}</Text>
              </View>
            )}
          </View>
          {!item.category && !item.campus && (
            <Text style={styles.anyText}>Cualquier categoria y campus</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => confirmDelete(item)}
          disabled={isDeleting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <Ionicons name="trash-outline" size={20} color="#D32F2F" />}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista de deseos</Text>
        <TouchableOpacity style={styles.addIconBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <Ionicons name="notifications-outline" size={14} color={PRIMARY} style={{ marginRight: 6 }} />
        <Text style={styles.infoText}>
          Te notificaremos cuando aparezca algo que coincida con tus busquedas
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={PRIMARY} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
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
                <Ionicons name="bookmark-outline" size={56} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>Sin busquedas guardadas</Text>
              <Text style={styles.emptySubtitle}>
                Agrega busquedas y te avisaremos cuando alguien publique algo que coincida.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>Agregar busqueda</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <AddModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleAdded}
      />
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
  headerBack: { width: 44, height: 36, justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addIconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBar: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: { flex: 1, fontSize: 12, color: PRIMARY, lineHeight: 17 },
  listContent: { padding: 14, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.small,
  },
  cardLeft: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardQuery: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 5 },
  cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  catBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catBadgeText: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
  campusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  campusText: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
  anyText: { fontSize: 11, color: '#AAAAAA', fontStyle: 'italic' },
  deleteBtn: { padding: 4 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyAddBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.button,
  },
  emptyAddBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
