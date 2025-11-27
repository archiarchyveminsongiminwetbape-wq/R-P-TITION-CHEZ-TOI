import { supabase } from '../../lib/supabase';
import type { Subject } from '../../types';

/**
 * Service pour gérer les opérations liées aux matières scolaires
 */
export const subjectService = {
  /**
   * Récupère toutes les matières
   */
  async getAllSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère une matière par son ID
   */
  async getSubjectById(id: number) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Recherche des matières par nom
   */
  async searchSubjects(query: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée une nouvelle matière (admin uniquement)
   */
  async createSubject(name: string) {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour une matière (admin uniquement)
   */
  async updateSubject(id: number, updates: Partial<Subject>) {
    const { data, error } = await supabase
      .from('subjects')
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
   * Supprime une matière (admin uniquement)
   */
  async deleteSubject(id: number) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: undefined };
  },

  /**
   * Récupère les matières enseignées par un professeur
   */
  async getTeacherSubjects(teacherId: string) {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .select(`
        subject:subjects(*)
      `)
      .eq('teacher_id', teacherId);
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: data?.map(item => item.subject) };
  },

  /**
   * Ajoute une matière à un professeur
   */
  async addTeacherSubject(teacherId: string, subjectId: number) {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .insert({ teacher_id: teacherId, subject_id: subjectId })
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Supprime une matière d'un professeur
   */
  async removeTeacherSubject(teacherId: string, subjectId: number) {
    const { error } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('subject_id', subjectId);
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: undefined };
  }
};
