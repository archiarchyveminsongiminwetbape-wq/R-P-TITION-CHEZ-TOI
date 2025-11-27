import { supabase } from '../../lib/supabase';
import type { Booking, BookingStatus, Level } from '../../types';

/**
 * Service pour gérer les réservations de cours
 */
export const bookingService = {
  /**
   * Récupère toutes les réservations d'un utilisateur (parent ou enseignant)
   */
  async getUserBookings(userId: string, role: 'parent' | 'teacher') {
    const column = role === 'parent' ? 'parent_id' : 'teacher_id';
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parent:profiles!parent_id(*),
        teacher:profiles!teacher_id(*),
        child:children(*),
        subject:subjects(*),
        neighborhood:neighborhoods(*),
        messages(*, sender:profiles(*)),
        review:reviews!booking_id(*)
      `)
      .eq(column, userId)
      .order('starts_at', { ascending: false });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Récupère une réservation par son ID
   */
  async getBookingById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parent:profiles!parent_id(*),
        teacher:profiles!teacher_id(*),
        child:children(*),
        subject:subjects(*),
        neighborhood:neighborhoods(*),
        messages(*, sender:profiles(*)),
        review:reviews!booking_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Crée une nouvelle réservation
   */
  async createBooking(booking: {
    parentId: string;
    teacherId: string;
    childId: string | null;
    subjectId: number | null;
    neighborhoodId: number | null;
    startsAt: string;
    endsAt: string;
    note?: string;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        parent_id: booking.parentId,
        teacher_id: booking.teacherId,
        child_id: booking.childId,
        subject_id: booking.subjectId,
        neighborhood_id: booking.neighborhoodId,
        starts_at: booking.startsAt,
        ends_at: booking.endsAt,
        note: booking.note || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Met à jour le statut d'une réservation
   */
  async updateBookingStatus(id: string, status: BookingStatus) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Annule une réservation
   */
  async cancelBooking(id: string) {
    return this.updateBookingStatus(id, 'cancelled');
  },

  /**
   * Confirme une réservation
   */
  async confirmBooking(id: string) {
    return this.updateBookingStatus(id, 'confirmed');
  },

  /**
   * Marque une réservation comme terminée
   */
  async completeBooking(id: string) {
    return this.updateBookingStatus(id, 'completed');
  },

  /**
   * Récupère les créneaux disponibles pour un enseignant
   */
  async getTeacherAvailability(teacherId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('get_teacher_availability', {
      p_teacher_id: teacherId,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Vérifie la disponibilité d'un créneau
   */
  async checkAvailability(teacherId: string, startTime: string, endTime: string) {
    const { data, error } = await supabase.rpc('check_booking_availability', {
      p_teacher_id: teacherId,
      p_start_time: startTime,
      p_end_time: endTime
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: data as boolean };
  }
};
