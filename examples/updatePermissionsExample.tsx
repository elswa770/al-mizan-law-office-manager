// مثال لتحديث صلاحيات المستخدم في النظام الهجين

import { SupabaseAuthService } from '../services/supabaseAuthNew';
import { HybridDataService } from '../services/hybridService';
import { PermissionLevel } from '../types';

// دالة تحديث الصلاحيات - تعمل على Supabase و IndexedDB
const updateUserPermissions = async (userId: string, permissions: Array<{ moduleId: string; access: PermissionLevel }>) => {
  try {
    // 1. تحديث الصلاحيات في Supabase
    await SupabaseAuthService.updatePermissions(userId, permissions);
    console.log('✅ Permissions updated successfully in Supabase');

    // 2. تحديث الصلاحيات في IndexedDB (محلي)
    const users = await HybridDataService.getAllUsers();
    const userToUpdate = users.find(u => u.id === userId);
    
    if (userToUpdate) {
      const updatedUser = { ...userToUpdate, permissions };
      await HybridDataService.updateUser(userId, updatedUser);
      console.log('✅ Permissions updated successfully in IndexedDB');
    }

    console.log('🎉 Permissions updated successfully in both systems!');
    return true;
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
    return false;
  }
};

// مثال للاستخدام في Settings.tsx
export const handlePermissionUpdate = async (userId: string, moduleId: string, access: PermissionLevel) => {
  // جلب الصلاحيات الحالية للمستخدم
  const currentPermissions = await SupabaseAuthService.getUserPermissions(userId);
  
  // تحديث أو إضافة الصلاحية الجديدة
  const updatedPermissions = currentPermissions.filter(p => p.moduleId !== moduleId);
  updatedPermissions.push({ moduleId, access });
  
  // تطبيق التحديث
  const success = await updateUserPermissions(userId, updatedPermissions);
  
  if (success) {
    alert('تم تحديث الصلاحيات بنجاح!');
  } else {
    alert('حدث خطأ أثناء تحديث الصلاحيات');
  }
};

// مثال لصلاحيات محامي
const lawyerPermissions = [
  { moduleId: 'dashboard', access: 'read' as PermissionLevel },
  { moduleId: 'cases', access: 'write' as PermissionLevel },
  { moduleId: 'clients', access: 'read' as PermissionLevel },
  { moduleId: 'hearings', access: 'write' as PermissionLevel },
  { moduleId: 'documents', access: 'read' as PermissionLevel },
  { moduleId: 'fees', access: 'read' as PermissionLevel },
  { moduleId: 'reports', access: 'read' as PermissionLevel },
  { moduleId: 'ai-assistant', access: 'write' as PermissionLevel },
];

// مثال لصلاحيات مساعد
const assistantPermissions = [
  { moduleId: 'dashboard', access: 'read' as PermissionLevel },
  { moduleId: 'cases', access: 'read' as PermissionLevel },
  { moduleId: 'clients', access: 'read' as PermissionLevel },
  { moduleId: 'hearings', access: 'read' as PermissionLevel },
  { moduleId: 'documents', access: 'write' as PermissionLevel },
];

// دالة لتعيين صلاحيات جاهزة
export const assignRolePermissions = async (userId: string, role: 'lawyer' | 'assistant' | 'admin') => {
  let permissions: Array<{ moduleId: string; access: PermissionLevel }> = [];
  
  switch (role) {
    case 'lawyer':
      permissions = lawyerPermissions;
      break;
    case 'assistant':
      permissions = assistantPermissions;
      break;
    case 'admin':
      // Admin يحصل على كل الصلاحيات
      permissions = [
        { moduleId: 'dashboard', access: 'write' as PermissionLevel },
        { moduleId: 'cases', access: 'write' as PermissionLevel },
        { moduleId: 'clients', access: 'write' as PermissionLevel },
        { moduleId: 'hearings', access: 'write' as PermissionLevel },
        { moduleId: 'documents', access: 'write' as PermissionLevel },
        { moduleId: 'fees', access: 'write' as PermissionLevel },
        { moduleId: 'expenses', access: 'write' as PermissionLevel },
        { moduleId: 'reports', access: 'write' as PermissionLevel },
        { moduleId: 'references', access: 'write' as PermissionLevel },
        { moduleId: 'ai-assistant', access: 'write' as PermissionLevel },
        { moduleId: 'settings', access: 'write' as PermissionLevel },
        { moduleId: 'users', access: 'write' as PermissionLevel },
        { moduleId: 'system', access: 'write' as PermissionLevel },
      ];
      break;
  }
  
  return await updateUserPermissions(userId, permissions);
};

export { updateUserPermissions };
