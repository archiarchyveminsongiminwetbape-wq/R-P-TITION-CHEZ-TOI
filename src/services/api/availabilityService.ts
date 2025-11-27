import { supabase } from '../../lib/supabase';
import type { Availability, Level } from '../../types';

/**
 * Service pour gérer les disponibilités des enseignants
 */
export const availabilityService = {
  /**
   * Récupère toutes les disponibilités d'un enseignant
   */
  async getTeacherAvailabilities(teacherId: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère une disponibilité par son ID
   */
  async getAvailabilityById(id: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée une nouvelle disponibilité
   */
  async createAvailability(availability: Omit<Availability, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('availabilities')
      .insert(availability)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour une disponibilité
   */
  async updateAvailability(id: string, updates: Partial<Availability>) {
    const { data, error } = await supabase
      .from('availabilities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Supprime une disponibilité
   */
  async deleteAvailability(id: string) {
    const { error } = await supabase
      .from('availabilities')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: undefined };
  },

  /**
   * Récupère les enseignants disponibles pour une plage horaire et un niveau donnés
   */
  async findAvailableTeachers(params: {
    weekday: number;
    startTime: string;
    endTime: string;
    level: Level;
    subjectId?: number;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }) {
    const { data, error } = await supabase.rpc('available_teachers_nearby', {
      p_weekday: params.weekday,
      p_start_time: params.startTime,
      p_end_time: params.endTime,
      p_level: params.level,
      p_subject_id: params.subjectId || null,
      p_lat: params.lat || null,
      p_lng: params.lng || null,
      p_radius_km: params.radiusKm || 10
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Vérifie si un enseignant est disponible pour une plage horaire
   */
  async checkTeacherAvailability(teacherId: string, weekday: number, startTime: string, endTime: string) {
    const { data, error } = await supabase.rpc('check_teacher_availability', {
      p_teacher_id: teacherId,
      p_weekday: weekday,
      p_start_time: startTime,
      p_end_time: endTime
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: data as boolean };
  }
};
