// Types d'énumération
export type UserRole = 'parent' | 'teacher' | 'admin';
export type Level = 'college' | 'lycee';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Types de base
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Neighborhood {
  id: number;
  name: string;
  location?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  center?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface Subject {
  id: number;
  name: string;
}

export interface TeacherProfile {
  user_id: string;
  bio: string | null;
  hourly_rate: number | null;
  levels: Level[];
  address: string | null;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  max_distance: number | null;
  created_at: string;
  updated_at: string;
  // Relations chargées optionnellement
  subjects?: Subject[];
  neighborhoods?: Neighborhood[];
}

export interface TeacherSubject {
  teacher_id: string;
  subject_id: number;
  // Relations chargées optionnellement
  subject?: Subject;
}

export interface TeacherNeighborhood {
  teacher_id: string;
  neighborhood_id: number;
  // Relations chargées optionnellement
  neighborhood?: Neighborhood;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  level: Level;
  created_at: string;
  // Relations chargées optionnellement
  parent?: Profile;
}

export interface Availability {
  id: string;
  teacher_id: string;
  weekday: number; // 0-6 (Dimanche-Samedi)
  start_time: string; // Format 'HH:MM:SS'
  end_time: string;   // Format 'HH:MM:SS'
  created_at: string;
  // Relations chargées optionnellement
  teacher?: TeacherProfile;
}

export interface Booking {
  id: string;
  parent_id: string;
  teacher_id: string;
  child_id: string | null;
  subject_id: number | null;
  neighborhood_id: number | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  // Relations chargées optionnellement
  parent?: Profile;
  teacher?: TeacherProfile;
  child?: Child;
  subject?: Subject;
  neighborhood?: Neighborhood;
  messages?: Message[];
  review?: Review;
}

export interface BookingSubject {
  booking_id: string;
  subject_id: number;
  // Relations chargées optionnellement
  subject?: Subject;
  booking?: Booking;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  // Relations chargées optionnellement
  sender?: Profile;
  booking?: Booking;
}

export interface Review {
  id: string;
  booking_id: string;
  parent_id: string;
  teacher_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  // Relations chargées optionnellement
  parent?: Profile;
  teacher?: TeacherProfile;
  booking?: Booking;
}

// Types pour les requêtes
export interface TeacherSearchParams {
  lat: number;
  lng: number;
  radius_km?: number;
  subject_id?: number | null;
  level?: Level | null;
  max_price?: number | null;
}

// Types pour les réponses d'API
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Types pour les formulaires
export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: UserRole;
  // Champs spécifiques aux enseignants
  bio?: string;
  hourly_rate?: number;
  levels?: Level[];
  address?: string;
  max_distance?: number;
  subject_ids?: number[];
  neighborhood_ids?: number[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface BookingFormData {
  teacher_id: string;
  child_id: string;
  subject_id: number;
  neighborhood_id: number;
  starts_at: string;
  ends_at: string;
  note?: string;
}

export interface ReviewFormData {
  booking_id: string;
  rating: number;
  comment?: string;
}

// Types pour les états globaux
export interface AuthState {
  user: Profile | null;
  session: any | null; // Remplacez 'any' par le type de session de Supabase
  loading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  // Ajoutez d'autres états ici si nécessaire
}
