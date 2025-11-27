import { supabase, hasSupabaseConfig } from './supabase';
import type { ApiResponse } from '../types';

/**
 * Helper function to handle Supabase queries with proper error handling
 */
export async function handleSupabaseQuery<T>(
  query: Promise<{ data: T | null; error: any }>
): Promise<ApiResponse<T>> {
  if (!hasSupabaseConfig) {
    return {
      error: {
        message: 'Supabase configuration is missing',
        code: 'MISSING_CONFIG',
      },
    };
  }

  try {
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return {
        error: {
          message: error.message,
          code: error.code || 'SUPABASE_ERROR',
        },
      };
    }

    return { data };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return {
      error: {
        message: error?.message || 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR',
      },
    };
  }
}

/**
 * Helper to get the current user's profile
 */
export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
