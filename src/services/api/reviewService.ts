import { supabase } from '../../lib/supabase';
import type { Review } from '../../types';

/**
 * Service pour gérer les avis et évaluations
 */
export const reviewService = {
  /**
   * Récupère tous les avis d'un enseignant
   */
  async getTeacherReviews(teacherId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        parent:profiles(*),
        booking:bookings(*)
      `)
      .eq('teacher_id', teacherId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère la note moyenne d'un enseignant
   */
  async getTeacherAverageRating(teacherId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('teacher_id', teacherId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    if (!data || data.length === 0) {
      return { data: 0 };
    }

    const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
    return { data: Math.round(average * 10) / 10 };
  },

  /**
   * Récupère un avis spécifique
   */
  async getReview(reviewId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère l'avis pour une réservation (s'il existe)
   */
  async getBookingReview(bookingId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || null };
  },

  /**
   * Crée un nouvel avis
   */
  async createReview(review: Omit<Review, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour un avis
   */
  async updateReview(reviewId: string, updates: Partial<Review>) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Supprime un avis
   */
  async deleteReview(reviewId: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: true };
  },
};
