import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type Props = {
  navigation: NavigationProp<MainStackParamList>;
  route: RouteProp<MainStackParamList, 'Confirmation'>;
};

const BLUE = '#1E4D8C';
const GREEN = '#388E3C';

export default function ConfirmationScreen({ navigation, route }: Props) {
  const { chatId, isReceiver, otherUserName, itemTitle } = route.params;

  // Receiver: generate and show the code
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Sender: enter the code
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function handleGenerateCode() {
    setGenerating(true);
    try {
      const { data } = await api.post<{ code: string }>(`/chats/${chatId}/confirmation-code`);
      setGeneratedCode(data.code);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'No se pudo generar el código.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (code.length < 4) {
      Alert.alert('Código incompleto', 'Ingresa los 4 dígitos del código de entrega.');
      return;
    }
    setConfirming(true);
    try {
      const { data } = await api.post<{ message: string }>(`/chats/${chatId}/confirm`, { code });
      Alert.alert('¡Entrega confirmada! 🎉', data.message, [
        { text: 'OK', onPress: () => navigation.navigate('Chats') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Código incorrecto o expirado.');
      setCode('');
    } finally {
      setConfirming(false);
    }
  }

  // ── Receiver view ──────────────────────────────────────────────────────────
  if (isReceiver) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹ Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Código de entrega</Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔑</Text>
          </View>
          <Text style={styles.title}>Generar código</Text>
          <Text style={styles.subtitle}>
            Genera un código único de 4 dígitos y compártelo con{' '}
            <Text style={styles.bold}>{otherUserName}</Text> cuando entregues el ítem{' '}
            <Text style={styles.bold}>"{itemTitle}"</Text>.
          </Text>
          <Text style={styles.hint}>
            El código es válido por 2 horas. Solo el receptor (tú) puede generarlo.
          </Text>

          {generatedCode ? (
            <View style={styles.codeDisplay}>
              <Text style={styles.codeDisplayLabel}>Código de entrega</Text>
              <View style={styles.codeDigitsRow}>
                {generatedCode.split('').map((d, i) => (
                  <View key={i} style={styles.codeDigitBox}>
                    <Text style={styles.codeDigitText}>{d}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.codeShareHint}>
                Muéstrale este código a {otherUserName} para completar la entrega.
              </Text>
              <TouchableOpacity
                style={styles.regenerateBtn}
                onPress={handleGenerateCode}
                disabled={generating}
                activeOpacity={0.7}
              >
                <Text style={styles.regenerateBtnText}>Generar nuevo código</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, generating && styles.primaryBtnDisabled]}
              onPress={handleGenerateCode}
              disabled={generating}
              activeOpacity={0.85}
            >
              {generating
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Generar código</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Sender view ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar entrega</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.iconEmoji}>✅</Text>
        </View>
        <Text style={styles.title}>Ingresa el código</Text>
        <Text style={styles.subtitle}>
          Pídele a <Text style={styles.bold}>{otherUserName}</Text> el código de 4 dígitos que
          generó para confirmar que recibiste el ítem{' '}
          <Text style={styles.bold}>"{itemTitle}"</Text>.
        </Text>

        {/* OTP Input */}
        <TouchableOpacity
          style={styles.otpContainer}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.otpBox,
                code.length === i && styles.otpBoxActive,
                code.length > i && styles.otpBoxFilled,
              ]}
            >
              <Text style={styles.otpDigit}>{code[i] ?? ''}</Text>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            caretHidden
          />
        </TouchableOpacity>

        <Text style={styles.otpHint}>Toca los cuadros para abrir el teclado</Text>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: GREEN },
            (code.length < 4 || confirming) && styles.primaryBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={code.length < 4 || confirming}
          activeOpacity={0.85}
        >
          {confirming
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Confirmar entrega</Text>}
        </TouchableOpacity>
      </ScrollView>
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
  backBtn: {},
  backIcon: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  body: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EFF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 36 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  bold: { fontWeight: '700', color: '#1A1A1A' },
  hint: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 28,
    fontStyle: 'italic',
  },
  // Code display (receiver)
  codeDisplay: { alignItems: 'center', marginTop: 8, width: '100%' },
  codeDisplayLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  codeDigitsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  codeDigitBox: {
    width: 58,
    height: 68,
    borderRadius: 14,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeDigitText: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  codeShareHint: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  regenerateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  regenerateBtnText: { color: BLUE, fontSize: 13, fontWeight: '600' },
  // OTP input (sender)
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
    position: 'relative',
  },
  otpBox: {
    width: 58,
    height: 68,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: { borderColor: BLUE, backgroundColor: '#F0F5FF' },
  otpBoxFilled: { borderColor: '#388E3C', backgroundColor: '#F1F8F2' },
  otpDigit: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpHint: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 28,
    fontStyle: 'italic',
  },
  primaryBtn: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
