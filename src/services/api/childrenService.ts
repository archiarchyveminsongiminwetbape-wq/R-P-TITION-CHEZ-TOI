import { supabase } from '../../lib/supabase';
import type { Child } from '../../types';

/**
 * Service pour gérer les enfants (liés aux parents)
 */
export const childrenService = {
  /**
   * Récupère tous les enfants d'un parent
   */
  async getParentChildren(parentId: string) {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère un enfant spécifique
   */
  async getChild(childId: string) {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée un nouvel enfant
   */
  async createChild(child: Omit<Child, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('children')
      .insert(child)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour un enfant
   */
  async updateChild(childId: string, updates: Partial<Child>) {
    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Supprime un enfant
   */
  async deleteChild(childId: string) {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: true };
  },
};
