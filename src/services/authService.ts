import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

export const authService = {
  async getInitialUser(): Promise<UserProfile | null> {
    if (!supabase) {
      return null;
    }

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Supabase getSession error:', error);
        return null;
      }

      if (session?.user) {
        const u = session.user;
        return {
          id: u.id,
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'Admin',
          email: u.email || '',
          role: 'Admin',
          avatar_url: u.user_metadata?.avatar_url || DEFAULT_AVATAR,
        };
      }
    } catch (err) {
      console.error('Supabase auth getInitialUser exception:', err);
    }

    return null;
  },

  async login(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim();

    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    if (!password) {
      throw new Error('Password is required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.error('Supabase signInWithPassword error:', error);
      throw new Error(error.message || 'Authentication failed. Please check your credentials.');
    }

    if (!data.user) {
      throw new Error('No user returned from Supabase authentication.');
    }

    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Admin',
      email: data.user.email || cleanEmail,
      role: 'Admin',
      avatar_url: data.user.user_metadata?.avatar_url || DEFAULT_AVATAR,
    };
  },

  async logout(): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
    } catch (err) {
      console.error('Supabase signOut exception:', err);
    }
  },

  async getCurrentSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};
