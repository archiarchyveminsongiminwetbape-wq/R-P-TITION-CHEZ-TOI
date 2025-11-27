import { supabase } from '../../lib/supabase';
import type { TeacherProfile, TeacherSearchParams } from '../../types';

/**
 * Service pour gérer les profils enseignants
 */
export const teacherProfileService = {
  /**
   * Récupère le profil enseignant d'un utilisateur
   */
  async getTeacherProfile(userId: string) {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        subjects:teacher_subjects(
          subject:subjects(*)
        ),
        neighborhoods:teacher_neighborhoods(
          neighborhood:neighborhoods(*)
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée un profil enseignant
   */
  async createTeacherProfile(profile: Omit<TeacherProfile, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour le profil enseignant
   */
  async updateTeacherProfile(userId: string, updates: Partial<TeacherProfile>) {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Recherche des enseignants à proximité avec filtres
   */
  async searchNearbyTeachers(params: TeacherSearchParams) {
    const { data, error } = await supabase
      .rpc('available_teachers_nearby', {
        p_lat: params.lat,
        p_lng: params.lng,
        p_radius_km: params.radius_km || 10,
        p_subject_id: params.subject_id,
        p_level: params.level,
        p_max_price: params.max_price,
      });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Ajoute un sujet à un enseignant
   */
  async addSubjectToTeacher(teacherId: string, subjectId: number) {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .insert({ teacher_id: teacherId, subject_id: subjectId })
      .select();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Supprime un sujet d'un enseignant
   */
  async removeSubjectFromTeacher(teacherId: string, subjectId: number) {
    const { error } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('subject_id', subjectId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: true };
  },

  /**
   * Ajoute un quartier à un enseignant
   */
  async addNeighborhoodToTeacher(teacherId: string, neighborhoodId: number) {
    const { data, error } = await supabase
      .from('teacher_neighborhoods')
      .insert({ teacher_id: teacherId, neighborhood_id: neighborhoodId })
      .select();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Supprime un quartier d'un enseignant
   */
  async removeNeighborhoodFromTeacher(teacherId: string, neighborhoodId: number) {
    const { error } = await supabase
      .from('teacher_neighborhoods')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('neighborhood_id', neighborhoodId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: true };
  },
};
