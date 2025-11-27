import { supabase } from '../../lib/supabase';

/**
 * Service admin pour accéder à toutes les données de l'application
 * Disponible uniquement pour les utilisateurs avec le rôle 'admin'
 */
export const adminService = {
  /**
   * Récupère toutes les statistiques globales de l'application
   */
  async getApplicationStats() {
    try {
      // Statistiques des utilisateurs
      const { data: profilesCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { data: teachersCount } = await supabase
        .from('teacher_profiles')
        .select('user_id', { count: 'exact', head: true });

      const { data: parentsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'parent');

      // Statistiques des réservations
      const { data: bookingsStats } = await supabase
        .from('bookings')
        .select('id, status', { count: 'exact', head: false });

      const pendingBookings = bookingsStats?.filter(b => b.status === 'pending').length || 0;
      const confirmedBookings = bookingsStats?.filter(b => b.status === 'confirmed').length || 0;
      const completedBookings = bookingsStats?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings = bookingsStats?.filter(b => b.status === 'cancelled').length || 0;

      // Statistiques des messages
      const { data: messagesCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true });

      // Statistiques des avis
      const { data: reviewsStats } = await supabase
        .from('reviews')
        .select('rating');

      const average_rating = reviewsStats && reviewsStats.length > 0
        ? parseFloat((reviewsStats.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsStats.length).toFixed(2))
        : 0;

      return {
        data: {
          profiles: profilesCount?.length || 0,
          teachers: teachersCount?.length || 0,
          parents: parentsCount?.length || 0,
          bookings: {
            total: bookingsStats?.length || 0,
            pending: pendingBookings,
            confirmed: confirmedBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
          },
          messages: messagesCount?.length || 0,
          reviews: reviewsStats?.length || 0,
          average_rating,
        },
      };
    } catch (error: any) {
      return {
        error: { message: error.message, code: 'STATS_ERROR' },
      };
    }
  },

  /**
   * Récupère tous les enseignants avec leurs informations complètes
   */
  async getAllTeachers(limit = 100, offset = 0) {
    const { data, error, count } = await supabase
      .from('teacher_profiles')
      .select(
        `
        *,
        profile:profiles(*),
        subjects:teacher_subjects(
          subject:subjects(*)
        ),
        neighborhoods:teacher_neighborhoods(
          neighborhood:neighborhoods(*)
        )
        `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data, count };
  },

  /**
   * Récupère tous les parents avec leurs enfants
   */
  async getAllParents(limit = 100, offset = 0) {
    const { data, error, count } = await supabase
      .from('profiles')
      .select(
        `
        *,
        children:children(*)
        `,
        { count: 'exact' }
      )
      .eq('role', 'parent')
      .range(offset, offset + limit - 1);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data, count };
  },

  /**
   * Récupère toutes les réservations avec leurs relations
   */
  async getAllBookings(limit = 100, offset = 0, status?: string) {
    let query = supabase
      .from('bookings')
      .select(
        `
        *,
        parent:profiles!parent_id(*),
        teacher:teacher_profiles(*),
        child:children(*),
        subject:subjects(*),
        neighborhood:neighborhoods(*),
        messages:messages(*)
        `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data, count };
  },

  /**
   * Récupère tous les messages
   */
  async getAllMessages(limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:profiles(*),
        booking:bookings(*)
        `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data, count };
  },

  /**
   * Récupère tous les avis
   */
  async getAllReviews(limit = 100, offset = 0) {
    const { data, error, count } = await supabase
      .from('reviews')
      .select(
        `
        *,
        parent:profiles!parent_id(*),
        teacher:teacher_profiles(*)
        `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data, count };
  },

  /**
   * Recherche un utilisateur par nom, email ou téléphone
   */
  async searchUser(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  },

  /**
   * Récupère les détails complets d'une réservation
   */
  async getBookingDetails(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        parent:profiles!parent_id(*),
        teacher:teacher_profiles(*),
        child:children(*),
        subject:subjects(*),
        messages(*)
        `
      )
      .eq('id', bookingId)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  },

  /**
   * Modifie le rôle d'un utilisateur
   */
  async updateUserRole(userId: string, role: string) {
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
   * Récupère l'historique d'activité d'un utilisateur
   */
  async getUserActivity(userId: string, limit = 50) {
    const [bookings, messages, reviews] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .or(`parent_id.eq.${userId},teacher_id.eq.${userId}`)
        .limit(limit),
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .limit(limit),
      supabase
        .from('reviews')
        .select('*')
        .or(`parent_id.eq.${userId},teacher_id.eq.${userId}`)
        .limit(limit),
    ]);

    return {
      data: {
        bookings: bookings.data || [],
        messages: messages.data || [],
        reviews: reviews.data || [],
      },
    };
  },

  /**
   * Exporte les données de l'application
   */
  async exportData(format: 'json' | 'csv' = 'json') {
    try {
      const [profiles, teachers, bookings, messages, reviews] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('teacher_profiles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('messages').select('*'),
        supabase.from('reviews').select('*'),
      ]);

      const data = {
        timestamp: new Date().toISOString(),
        profiles: profiles.data || [],
        teachers: teachers.data || [],
        bookings: bookings.data || [],
        messages: messages.data || [],
        reviews: reviews.data || [],
      };

      if (format === 'json') {
        return {
          data: JSON.stringify(data, null, 2),
          filename: `export_${Date.now()}.json`,
        };
      }

      // Format CSV basique
      const csv = `Timestamp,Type,Count\n${new Date().toISOString()},Profiles,${profiles.data?.length || 0}\n${new Date().toISOString()},Teachers,${teachers.data?.length || 0}\n${new Date().toISOString()},Bookings,${bookings.data?.length || 0}\n${new Date().toISOString()},Messages,${messages.data?.length || 0}\n${new Date().toISOString()},Reviews,${reviews.data?.length || 0}`;

      return {
        data: csv,
        filename: `export_${Date.now()}.csv`,
      };
    } catch (error: any) {
      return {
        error: { message: error.message, code: 'EXPORT_ERROR' },
      };
    }
  },
};
