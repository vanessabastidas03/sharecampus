export const COLORS = {
  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  primaryLight: '#EDE9FE',
  primaryMid: '#8B5CF6',
  accent: '#F43F5E',
  accentLight: '#FFE4E6',
  accentText: '#BE123C',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  emerald: '#10B981',
  emeraldLight: '#D1FAE5',
  emeraldText: '#065F46',
  sky: '#0EA5E9',
  skyLight: '#E0F2FE',
  bg: '#F7F5FF',
  card: '#FFFFFF',
  textPrimary: '#1E1B4B',
  textMuted: '#9CA3AF',
  textLight: '#C4B5FD',
  border: '#EDE9FE',
  divider: '#F3F4F6',
  white: '#FFFFFF',
};

export const CATEGORY_CONFIG: Record<string, { color: string; bg: string; emoji: string; icon: string }> = {
  'Libros':       { color: '#7C3AED', bg: '#EDE9FE', emoji: '📚', icon: 'book' },
  'Calculadoras': { color: '#2563EB', bg: '#DBEAFE', emoji: '🧮', icon: 'calculator' },
  'Apuntes':      { color: '#059669', bg: '#D1FAE5', emoji: '📝', icon: 'document-text' },
  'Lab':          { color: '#D97706', bg: '#FEF3C7', emoji: '🔬', icon: 'flask' },
  'Tecnología':   { color: '#0891B2', bg: '#CFFAFE', emoji: '💻', icon: 'laptop' },
  'Otros':        { color: '#DC2626', bg: '#FEE2E2', emoji: '📦', icon: 'grid' },
};

export const OFFER_CONFIG: Record<string, { color: string; bg: string; emoji: string; icon: string }> = {
  'Préstamo':    { color: '#2196F3', bg: '#E3F2FD', emoji: '🤝', icon: 'swap-horizontal' },
  'Intercambio': { color: '#FF9800', bg: '#FFF3E0', emoji: '🔄', icon: 'repeat' },
  'Donación':    { color: '#E91E63', bg: '#FCE4EC', emoji: '🎁', icon: 'heart' },
  'Alquiler':    { color: '#4CAF50', bg: '#E8F5E9', emoji: '🔑', icon: 'key' },
};

export const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  'Disponible': { color: '#059669', bg: '#D1FAE5' },
  'Reservado':  { color: '#D97706', bg: '#FEF3C7' },
  'Entregado':  { color: '#6B7280', bg: '#F3F4F6' },
};

export const SHADOWS = {
  small: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  medium: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  button: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fab: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
};
