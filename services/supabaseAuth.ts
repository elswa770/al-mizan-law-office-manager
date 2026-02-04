import { supabase } from './supabase';
import { AppUser, UserPermission, PermissionLevel } from '../types';

export interface SupabaseUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role_label: string;
  is_active: boolean;
  last_login?: string;
  permissions?: UserPermission[];
}

export class SupabaseAuthService {
  // Login with email and password
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Get user profile with permissions
      const userProfile = await this.getUserProfile(data.user.id);
      
      return {
        user: userProfile,
        session: data.session
      };
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      if (session) {
        const userProfile = await this.getUserProfile(session.user.id);
        return {
          user: userProfile,
          session
        };
      }

      return null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  // Get user profile with permissions
  private static async getUserProfile(userId: string): Promise<AppUser> {
    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Get user permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
      }

      // Convert to AppUser format
      const appUser: AppUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        password: '', // Not returned from database
        roleLabel: userData.role_label,
        isActive: userData.is_active,
        permissions: permissionsData?.map(p => ({
          moduleId: p.module_id,
          access: p.access as PermissionLevel
        })) || [],
        lastLogin: userData.last_login
      };

      return appUser;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Register new user
  static async register(userData: {
    username: string;
    email: string;
    name: string;
    password: string;
    roleLabel?: string;
    permissions?: Array<{ moduleId: string; access: PermissionLevel }>;
  }) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            name: userData.name
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          role_label: userData.roleLabel || 'محامي',
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Add permissions if provided
      if (userData.permissions && userData.permissions.length > 0) {
        const permissionsToInsert = userData.permissions.map(p => ({
          user_id: authData.user.id,
          module_id: p.moduleId,
          access: p.access
        }));

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (permissionsError) {
          console.error('Error adding permissions:', permissionsError);
        }
      }

      return {
        user: await this.getUserProfile(authData.user.id),
        session: authData.session
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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
          last_login: updates.lastLogin
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

  // Update user permissions
  static async updatePermissions(userId: string, permissions: Array<{ moduleId: string; access: PermissionLevel }>) {
    try {
      // Delete existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Insert new permissions
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(p => ({
          user_id: userId,
          module_id: p.moduleId,
          access: p.access
        }));

        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Update permissions error:', error);
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
}
