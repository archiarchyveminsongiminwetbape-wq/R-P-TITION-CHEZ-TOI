import { supabase } from '../../lib/supabase';
import type { Message } from '../../types';

/**
 * Service pour gérer les messages entre utilisateurs
 */
export const messageService = {
  /**
   * Récupère les messages d'une réservation
   */
  async getMessages(bookingId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data };
  },

  /**
   * Envoie un message
   */
  async sendMessage(params: {
    bookingId: string;
    senderId: string;
    body: string;
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: params.bookingId,
        sender_id: params.senderId,
        body: params.body
      })
      .select()
      .single();
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    
    // Mettre à jour la date de dernière activité de la réservation
    await supabase
      .from('bookings')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.bookingId);
    
    return { data };
  },

  /**
   * Marque les messages comme lus
   */
  async markAsRead(messageIds: string[], userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .neq('sender_id', userId); // Ne pas marquer comme lus les messages de l'utilisateur
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: true };
  },

  /**
   * Récupère le nombre de messages non lus pour un utilisateur
   */
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('read_at', null)
      .neq('sender_id', userId)
      .in('booking_id', 
        supabase
          .from('bookings')
          .select('id')
          .or(`parent_id.eq.${userId},teacher_id.eq.${userId}`)
      );
    
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { data: count || 0 };
  },

  /**
   * S'abonne aux nouveaux messages en temps réel
   */
  subscribeToNewMessages(bookingId: string, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`booking_${bookingId}_messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    // Retourne une fonction pour se désabonner
    return () => {
      subscription.unsubscribe();
    };
  }
};
