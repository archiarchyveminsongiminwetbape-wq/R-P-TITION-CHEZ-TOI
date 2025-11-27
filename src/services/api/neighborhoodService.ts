import { supabase } from '../../lib/supabase';
import type { Neighborhood } from '../../types';

/**
 * Service pour gérer les opérations liées aux quartiers
 */
export const neighborhoodService = {
  /**
   * Récupère tous les quartiers
   */
  async getAllNeighborhoods() {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère un quartier par son ID
   */
  async getNeighborhoodById(id: number) {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Recherche des quartiers par nom
   */
  async searchNeighborhoods(query: string) {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère les quartiers à proximité d'un point géographique
   */
  async getNearbyNeighborhoods(lat: number, lng: number, radiusKm: number = 5) {
    const { data, error } = await supabase
      .rpc('nearby_neighborhoods', {
        lat,
        lng,
        max_distance_km: radiusKm
      });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée un nouveau quartier (admin uniquement)
   */
  async createNeighborhood(neighborhood: Omit<Neighborhood, 'id'>) {
    const { data, error } = await supabase
      .from('neighborhoods')
      .insert(neighborhood)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour un quartier (admin uniquement)
   */
  async updateNeighborhood(id: number, updates: Partial<Neighborhood>) {
    const { data, error } = await supabase
      .from('neighborhoods')
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
   * Supprime un quartier (admin uniquement)
   */
  async deleteNeighborhood(id: number) {
    const { error } = await supabase
      .from('neighborhoods')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: undefined };
  }
};
