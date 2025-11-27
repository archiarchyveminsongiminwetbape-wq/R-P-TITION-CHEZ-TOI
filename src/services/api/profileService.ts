import { supabase } from '../../lib/supabase';
import type { Profile, UserRole } from '../../types';

/**
 * Service pour gérer les opérations liées aux profils utilisateurs
 */
export const profileService = {
  /**
   * Récupère le profil d'un utilisateur par son ID
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée un nouveau profil utilisateur
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour l'avatar d'un utilisateur
   */
  async updateAvatar(userId: string, file: File) {
    // Télécharger le fichier vers le stockage Supabase
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { error: { message: uploadError.message, code: 'UPLOAD_ERROR' } };
    }

    // Obtenir l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Mettre à jour le profil avec la nouvelle URL de l'avatar
    return this.updateProfile(userId, { avatar_url: publicUrl });
  },

  /**
   * Met à jour le rôle d'un utilisateur (admin uniquement)
   */
  async updateUserRole(userId: string, role: UserRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Recherche des profils par nom ou email
   */
  async searchProfiles(query: string, role?: UserRole) {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const { data, error } = await queryBuilder;
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  }
};
