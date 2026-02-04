import { supabase } from './supabase';
import { AppUser, PermissionLevel } from '../types';

export class SupabaseAuthService {
  // Login with email and password
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Get user profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        return {
          user: profile || data.user,
          session: data.session
        };
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user profile with permissions
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email || '')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Register new user
  static async register(userData: {
    email: string;
    password: string;
    name: string;
    username: string;
    roleLabel?: string;
    permissions?: Array<{ moduleId: string; access: PermissionLevel }>;
  }) {
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        throw error;
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username: userData.username,
            email: userData.email,
            name: userData.name,
            role_label: userData.roleLabel || 'موظف',
            permissions: userData.permissions || [],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          throw profileError;
        }
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Update user permissions
  static async updatePermissions(userId: string, permissions: any[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          permissions: permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
      
      console.log('Permissions updated successfully in Supabase');
    } catch (error) {
      console.error('Error updating permissions in Supabase:', error);
      throw error;
    }
  }

  // Get user permissions
  static async getUserPermissions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('permissions')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      
      return data?.permissions || [];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<AppUser>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          role_label: updates.roleLabel,
          is_active: updates.isActive,
          last_login: updates.lastLogin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Check if user has specific permission
  static hasPermission(user: AppUser | null, moduleId: string, requiredAccess: PermissionLevel): boolean {
    if (!user || !user.isActive) {
      return false;
    }

    // Super admin check
    const isSuperAdmin = user.username === 'admin' && user.roleLabel === 'مدير النظام';
    if (isSuperAdmin) {
      return true;
    }

    const permission = user.permissions.find(p => p.moduleId === moduleId);
    if (!permission) {
      return false;
    }

    const accessLevels = { 'none': 0, 'read': 1, 'write': 2 };
    const userLevel = accessLevels[permission.access] || 0;
    const requiredLevel = accessLevels[requiredAccess] || 0;

    return userLevel >= requiredLevel;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Change password
  static async changePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}
