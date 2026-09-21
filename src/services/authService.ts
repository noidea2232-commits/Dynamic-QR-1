import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AUTH_USER_KEY = 'cardsync_auth_user';

const DEFAULT_ADMIN: UserProfile = {
  id: 'usr_admin_01',
  name: 'Admin User',
  email: 'admin@cardsync.io',
  role: 'Super Admin',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const authService = {
  async getInitialUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          return {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin',
            email: session.user.email || '',
            role: 'Admin',
            avatar_url: session.user.user_metadata?.avatar_url || DEFAULT_ADMIN.avatar_url,
          };
        }
        return null;
      } catch (err) {
        console.error('Supabase auth getSession error:', err);
      }
    }

    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
    } catch {
      // ignore
    }

    // Default demo user when not configured
    return DEFAULT_ADMIN;
  },

  getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
    } catch {
      // ignore
    }
    return isSupabaseConfigured() ? null : DEFAULT_ADMIN;
  },

  async login(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim();

    if (isSupabaseConfigured() && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data.user) {
          const user: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Admin',
            email: data.user.email || cleanEmail,
            role: 'Admin',
            avatar_url: data.user.user_metadata?.avatar_url || DEFAULT_ADMIN.avatar_url,
          };
          try {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
          } catch {
            // ignore
          }
          return user;
        }
        // Supabase auth failed (user not yet created) — fall through to local mock
      } catch {
        // Supabase unreachable — fall through to local mock
      }
    }

    // Fallback/Local login
    const user: UserProfile = {
      ...DEFAULT_ADMIN,
      email: cleanEmail || DEFAULT_ADMIN.email,
    };
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    return user;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // ignore
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },
};
