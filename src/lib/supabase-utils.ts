import { supabase, hasSupabaseConfig } from './supabase';
import type { ApiResponse } from '../types';

type SupabaseError = {
  message: string;
  code?: string;
};

/**
 * Helper function to handle Supabase queries with proper error handling
 */
export async function handleSupabaseQuery<T>(
  query: Promise<{ data: T | null; error: SupabaseError | null }>
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

    return { data: data || undefined };
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return {
      error: {
        message: errorMessage,
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
