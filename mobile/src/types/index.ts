export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  photo_url: string | null;
  rating: number;
  rating_count: number;
  exchanges_count: number;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: 'Disponible' | 'Reservado' | 'Entregado';
  offer_type: 'Préstamo' | 'Intercambio' | 'Donación' | 'Alquiler';
  photos: string[];
  campus: string | null;
  rental_price: number | null;
  rental_time_unit: string | null;
  user: UserProfile;
  user_id: string;
  created_at: string;
}

export const CATEGORIES = [
  'Libros',
  'Calculadoras',
  'Apuntes',
  'Lab',
  'Tecnología',
  'Otros',
] as const;

export const OFFER_TYPES = ['Préstamo', 'Intercambio', 'Donación', 'Alquiler'] as const;

export type Category = (typeof CATEGORIES)[number];
export type OfferType = (typeof OFFER_TYPES)[number];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  photo_url: string | null;
  faculty: string | null;
  semester: number | null;
  rating: number;
  rating_count: number;
  exchanges_count: number;
  is_profile_complete: boolean;
  is_verified: boolean;
  is_verified_badge: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatStatus = 'activo' | 'aceptado' | 'rechazado' | 'completado' | 'bloqueado';

export interface ChatParticipant {
  id: string;
  email: string;
  full_name: string | null;
  photo_url: string | null;
}

export interface ChatItemRef {
  id: string;
  title: string;
  photos: string[];
}

export interface ChatRecord {
  id: string;
  item_id: string;
  item: ChatItemRef;
  sender_id: string;
  sender: ChatParticipant;
  receiver_id: string;
  receiver: ChatParticipant;
  status: ChatStatus;
  confirmation_code: string | null;
  confirmation_expires: string | null;
  is_confirmed: boolean;
  firebase_chat_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FirebaseMessage {
  key: string;
  sender_id: string;
  message: string;
  timestamp: string;
  type: 'text';
}

export const CHAT_STATUS_LABEL: Record<ChatStatus, string> = {
  activo: 'Solicitud enviada',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  completado: 'Completado',
  bloqueado: 'Bloqueado',
};

export const CHAT_STATUS_COLOR: Record<ChatStatus, string> = {
  activo: '#1E4D8C',
  aceptado: '#388E3C',
  rechazado: '#D32F2F',
  completado: '#7B1FA2',
  bloqueado: '#757575',
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  user_id: string;
  search_query: string;
  category: string | null;
  campus: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportCategory = 'fraudulento' | 'inapropiado' | 'spam' | 'otro';
export type ReportTargetType = 'item' | 'perfil' | 'chat';

export const REPORT_CATEGORIES: { value: ReportCategory; label: string; emoji: string }[] = [
  { value: 'fraudulento', label: 'Fraudulento', emoji: '🚨' },
  { value: 'inapropiado', label: 'Inapropiado', emoji: '🚫' },
  { value: 'spam', label: 'Spam', emoji: '📢' },
  { value: 'otro', label: 'Otro', emoji: '❓' },
];

// ─── Items ────────────────────────────────────────────────────────────────────

export const ITEM_STATUSES = ['Disponible', 'Reservado', 'Entregado'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const STATUS_COLOR: Record<string, string> = {
  Disponible: '#388E3C',
  Reservado: '#F57C00',
  Entregado: '#757575',
};
