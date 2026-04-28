import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import api from '../services/api';
import { ReportCategory, ReportTargetType, REPORT_CATEGORIES } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const BLUE = '#1E4D8C';

export default function ReportModal({ visible, onClose, targetType, targetId, targetTitle }: Props) {
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCategory('');
    setDescription('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!category) {
      Alert.alert('Categoría requerida', 'Selecciona el tipo de problema antes de enviar.');
      return;
    }

    Alert.alert(
      'Enviar reporte',
      `¿Deseas reportar este ${targetType === 'item' ? 'ítem' : 'perfil'} como "${
        REPORT_CATEGORIES.find(c => c.value === category)?.label
      }"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/reports', {
                target_type: targetType,
                target_id: targetId,
                category,
                ...(description.trim() ? { description: description.trim() } : {}),
              });
              Alert.alert(
                'Reporte enviado',
                'Nuestro equipo revisará el reporte. Gracias por contribuir a una comunidad segura.',
                [{ text: 'OK', onPress: handleClose }],
              );
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message ?? 'No se pudo enviar el reporte.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  const targetLabel = targetType === 'item' ? 'ítem' : targetType === 'perfil' ? 'perfil' : 'chat';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Reportar {targetLabel}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {targetTitle && (
            <View style={styles.targetBox}>
              <Text style={styles.targetBoxLabel}>Reportando:</Text>
              <Text style={styles.targetBoxTitle} numberOfLines={2}>{targetTitle}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Category selector */}
            <Text style={styles.sectionLabel}>
              Tipo de problema <Text style={styles.req}>*</Text>
            </Text>
            <View style={styles.categoryGrid}>
              {REPORT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryCard, category === cat.value && styles.categoryCardActive]}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, category === cat.value && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                  {category === cat.value && (
                    <View style={styles.categoryCheck}>
                      <Text style={styles.categoryCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.sectionLabel}>Descripción (opcional)</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el problema con más detalle…"
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{description.length}/300</Text>

            <Text style={styles.disclaimer}>
              Los reportes falsos o abusivos pueden resultar en restricciones de tu cuenta.
            </Text>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!category || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!category || submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Enviar reporte</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  closeIcon: { fontSize: 16, color: '#9E9E9E' },
  targetBox: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  targetBoxLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 3 },
  targetBoxTitle: { fontSize: 13, color: '#1A1A1A', fontWeight: '600' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
    marginTop: 4,
  },
  req: { color: '#D32F2F' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    width: '47%',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  categoryCardActive: {
    borderColor: BLUE,
    backgroundColor: '#E8EFF9',
  },
  categoryEmoji: { fontSize: 24, marginBottom: 6 },
  categoryLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoryLabelActive: { color: BLUE, fontWeight: '700' },
  categoryCheck: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCheckText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  descInput: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 80,
  },
  charCount: { fontSize: 11, color: '#AAAAAA', textAlign: 'right', marginTop: 4, marginBottom: 10 },
  disclaimer: {
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  submitBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
