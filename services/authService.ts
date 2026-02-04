import { AppUser, UserPermission, PermissionLevel } from '../types';

export class AuthService {
  // Check if user has specific permission for a module
  static hasPermission(user: AppUser | null, moduleId: string, requiredAccess: PermissionLevel): boolean {
    if (!user || !user.isActive) {
      return false;
    }

    // Super admin check - has access to everything
    const isSuperAdmin = user.username === 'admin' && user.roleLabel === 'مدير النظام';
    if (isSuperAdmin) {
      return true;
    }

    const permission = user.permissions.find(p => p.moduleId === moduleId);
    if (!permission) {
      return false;
    }

    // Permission hierarchy: none < read < write
    const accessLevels = { 'none': 0, 'read': 1, 'write': 2 };
    const userLevel = accessLevels[permission.access] || 0;
    const requiredLevel = accessLevels[requiredAccess] || 0;

    return userLevel >= requiredLevel;
  }

  // Check if user can read module data
  static canRead(user: AppUser | null, moduleId: string): boolean {
    return this.hasPermission(user, moduleId, 'read');
  }

  // Check if user can write/modify module data
  static canWrite(user: AppUser | null, moduleId: string): boolean {
    return this.hasPermission(user, moduleId, 'write');
  }

  // Check if user is admin
  static isAdmin(user: AppUser | null): boolean {
    if (!user) return false;
    return user.username === 'admin' && user.roleLabel === 'مدير النظام';
  }

  // Check if user is system admin (has system module access)
  static isSystemAdmin(user: AppUser | null): boolean {
    return this.hasPermission(user, 'system', 'write');
  }

  // Get all modules user can access
  static getAccessibleModules(user: AppUser | null): string[] {
    if (!user || !user.isActive) {
      return [];
    }

    // Super admin has access to all modules
    if (this.isAdmin(user)) {
      return [
        'cases', 'clients', 'finance', 'references', 'users', 
        'settings', 'reports', 'documents', 'hearings', 'tasks', 
        'activities', 'system'
      ];
    }

    return user.permissions
      .filter(p => p.access !== 'none')
      .map(p => p.moduleId);
  }

  // Get user's role display name
  static getRoleDisplayName(user: AppUser | null): string {
    if (!user) return 'غير معروف';
    
    if (this.isAdmin(user)) {
      return '🔑 مدير النظام';
    }
    
    return user.roleLabel;
  }

  // Check if user can manage other users
  static canManageUsers(user: AppUser | null): boolean {
    return this.hasPermission(user, 'users', 'write');
  }

  // Check if user can access system settings
  static canAccessSystemSettings(user: AppUser | null): boolean {
    return this.hasPermission(user, 'settings', 'write');
  }

  // Check if user can view financial reports
  static canViewFinancialReports(user: AppUser | null): boolean {
    return this.hasPermission(user, 'finance', 'read');
  }

  // Check if user can modify financial data
  static canModifyFinancialData(user: AppUser | null): boolean {
    return this.hasPermission(user, 'finance', 'write');
  }

  // Get user permissions summary
  static getPermissionsSummary(user: AppUser | null): Record<string, PermissionLevel> {
    if (!user || !user.permissions) {
      return {};
    }

    const summary: Record<string, PermissionLevel> = {};
    user.permissions.forEach(permission => {
      summary[permission.moduleId] = permission.access;
    });

    return summary;
  }

  // Validate user session
  static validateSession(user: AppUser | null): boolean {
    if (!user) return false;
    if (!user.isActive) return false;
    
    // Additional session validation logic can be added here
    // For example: check lastLogin, session timeout, etc.
    
    return true;
  }
}

export default AuthService;
