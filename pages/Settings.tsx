
import React, { useState, useRef, useEffect } from 'react';
import { AppUser, PermissionLevel } from '../types';
import AuthService from '../services/authService';
import { assignRolePermissions, updateUserPermissions } from '../examples/updatePermissionsExample';
import { 
  Settings as SettingsIcon, Users, Lock, Shield, 
  Plus, Edit3, Trash2, Check, X, Eye, 
  Save, AlertCircle, Ban, Pencil, Key,
  Building, Phone, Mail, Globe, Upload, FileText, 
  Bell, Moon, Sun, Database, Download, Cloud, Loader2, Crown,
  UserCheck, ShieldCheck, Settings2
} from 'lucide-react';

interface SettingsProps {
  users?: AppUser[];
  onAddUser?: (user: AppUser) => void;
  onUpdateUser?: (user: AppUser) => void;
  onDeleteUser?: (userId: string) => void;
  currentTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

// Added 'references' as a separate permission module
const MODULES = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'cases', label: 'إدارة القضايا' },
  { id: 'clients', label: 'إدارة الموكلين' },
  { id: 'hearings', label: 'الجلسات والمواعيد' },
  { id: 'documents', label: 'الأرشيف والمستندات' },
  { id: 'fees', label: 'الحسابات (الإيرادات والأتعاب)' },
  { id: 'expenses', label: 'المصروفات الإدارية' },
  { id: 'reports', label: 'التقارير' },
  { id: 'references', label: 'المراجع القانونية' }, // New Module
  { id: 'ai-assistant', label: 'المساعد الذكي' },
  { id: 'settings', label: 'الإعدادات والمستخدمين' },
  { id: 'users', label: 'إدارة المستخدمين' },
  { id: 'system', label: 'صلاحيات النظام' },
];

const Settings: React.FC<SettingsProps> = ({ users = [], onAddUser, onUpdateUser, onDeleteUser, currentTheme = 'light', onThemeChange }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'security'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  // Permissions Modal State
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [tempPermissions, setTempPermissions] = useState<Array<{ moduleId: string; access: PermissionLevel }>>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  // User Form State
  const [formData, setFormData] = useState<Partial<AppUser>>({
    name: '',
    email: '',
    username: '',
    password: '',
    roleLabel: '',
    isActive: true,
    permissions: []
  });

  // --- General Settings State with Persistence ---
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state from LocalStorage or Defaults
  const [generalSettings, setGeneralSettings] = useState(() => {
    const savedSettings = localStorage.getItem('app_general_settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      firmName: 'الميزان للمحاماة والاستشارات القانونية',
      firmSlogan: 'العدالة حق للجميع',
      taxNumber: '123-456-789',
      address: '15 شارع جامعة الدول العربية، المهندسين، الجيزة',
      phone: '01000000000',
      email: 'info@almizan.com',
      website: 'www.almizan-law.com',
      currency: 'EGP',
      language: 'ar',
      theme: currentTheme,
      enableEmailNotifications: true,
      enableSystemNotifications: true,
      autoBackup: 'weekly',
      logoPreview: null as string | null
    };
  });

  // Sync prop change to local state if needed, but respect user choice
  useEffect(() => {
    if (onThemeChange && generalSettings.theme !== currentTheme) {
       // Only sync if strictly necessary, usually user setting overrides prop default
    }
  }, [currentTheme]);

  // --- Handlers: Users ---

  const openAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      roleLabel: 'موظف',
      isActive: true,
      permissions: MODULES.map(m => ({ moduleId: m.id, access: 'none' as PermissionLevel }))
    });
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: AppUser) => {
    setEditingUser(user);
    const mergedPermissions = MODULES.map(m => {
      const existing = user.permissions.find(p => p.moduleId === m.id);
      return existing || { moduleId: m.id, access: 'none' as PermissionLevel };
    });

    setFormData({
      ...user,
      password: '', 
      permissions: mergedPermissions
    });
    setIsUserModalOpen(true);
  };

  // Open Permissions Modal
  const openPermissionsModal = (user: AppUser) => {
    setSelectedUser(user);
    const mergedPermissions = MODULES.map(m => {
      const existing = user.permissions.find(p => p.moduleId === m.id);
      return existing || { moduleId: m.id, access: 'none' as PermissionLevel };
    });
    setTempPermissions(mergedPermissions);
    setIsPermissionsModalOpen(true);
  };

  // Open Role Assign Modal
  const openRoleAssignModal = (user: AppUser) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  // Handle Permission Change
  const handlePermissionChange = (moduleId: string, access: PermissionLevel) => {
    setTempPermissions(prev => 
      prev.map(p => p.moduleId === moduleId ? { ...p, access } : p)
    );
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSaving(true);
      const success = await updateUserPermissions(selectedUser.id, tempPermissions);
      if (success) {
        setIsPermissionsModalOpen(false);
        // Refresh user data
        if (onUpdateUser) {
          const updatedUser = { ...selectedUser, permissions: tempPermissions };
          onUpdateUser(updatedUser);
        }
        alert('تم تحديث الصلاحيات بنجاح!');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('حدث خطأ أثناء تحديث الصلاحيات');
    } finally {
      setIsSaving(false);
    }
  };

  // Assign Role
  const handleAssignRole = async (role: 'lawyer' | 'assistant' | 'admin') => {
    if (!selectedUser) return;
    
    try {
      setIsSaving(true);
      const success = await assignRolePermissions(selectedUser.id, role);
      if (success) {
        setIsRoleModalOpen(false);
        alert(`تم تعيين دور ${role === 'lawyer' ? 'محامي' : role === 'assistant' ? 'مساعد' : 'مدير'} بنجاح!`);
        // Refresh page to see changes
        window.location.reload();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('حدث خطأ أثناء تعيين الدور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (!editingUser && !formData.password) {
      alert('يرجى تعيين كلمة مرور للمستخدم الجديد');
      return;
    }

    if (editingUser && onUpdateUser) {
      const updatedUser = { ...editingUser, ...formData };
      if (!formData.password) {
         updatedUser.password = editingUser.password;
      }
      onUpdateUser(updatedUser as AppUser);
    } else if (onAddUser) {
      const newUser: AppUser = {
        id: Math.random().toString(36).substring(2, 9),
        name: formData.name!,
        email: formData.email!,
        username: formData.username,
        password: formData.password,
        roleLabel: formData.roleLabel || 'موظف',
        isActive: formData.isActive || true,
        permissions: formData.permissions || [],
        avatar: undefined
      };
      onAddUser(newUser);
    }
    setIsUserModalOpen(false);
  };

  // --- Handlers: General Settings ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneralSettings(prev => ({ ...prev, logoPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    // Simulate API call / Processing time
    setTimeout(() => {
      // 1. Save to LocalStorage
      localStorage.setItem('app_general_settings', JSON.stringify(generalSettings));
      
      // 2. Apply Theme Globaly
      if (onThemeChange && generalSettings.theme) {
        onThemeChange(generalSettings.theme as 'light' | 'dark');
      }

      setIsSaving(false);
      // Optional: Show toast or simple alert
      // alert('تم حفظ الإعدادات بنجاح'); 
    }, 800);
  };

  const handleThemeSwitch = (theme: 'light' | 'dark') => {
    setGeneralSettings(prev => ({ ...prev, theme }));
    // Immediate preview
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  // --- Renderers ---

  const renderGeneralTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">الإعدادات العامة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تخصيص بيانات المكتب وتفضيلات النظام</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
             <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
          ) : (
             <><Save className="w-4 h-4" /> حفظ التغييرات</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Identity & Logo */}
        <div className="xl:col-span-2 space-y-6">
          {/* Identity Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Building className="w-5 h-5 text-indigo-600" /> الهوية المؤسسية
            </h4>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo Upload */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all overflow-hidden relative group"
                >
                  {generalSettings.logoPreview ? (
                    <img src={generalSettings.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">تغيير الشعار</span>
                  </div>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                <p className="text-xs text-slate-500 dark:text-slate-400">الشعار الرسمي (PNG/JPG)</p>
              </div>

              {/* Basic Inputs */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المكتب / المؤسسة</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.firmName}
                    onChange={e => setGeneralSettings({...generalSettings, firmName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشعار اللفظي (Slogan)</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.firmSlogan}
                    onChange={e => setGeneralSettings({...generalSettings, firmSlogan: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم السجل الضريبي / التجاري</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.taxNumber}
                    onChange={e => setGeneralSettings({...generalSettings, taxNumber: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الرئيسي</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.address}
                    onChange={e => setGeneralSettings({...generalSettings, address: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Phone className="w-5 h-5 text-indigo-600" /> بيانات التواصل
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Phone className="w-3 h-3"/> الهاتف</label>
                <input 
                  type="text" 
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  dir="ltr"
                  value={generalSettings.phone}
                  onChange={e => setGeneralSettings({...generalSettings, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Mail className="w-3 h-3"/> البريد الإلكتروني</label>
                <input 
                  type="email" 
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  dir="ltr"
                  value={generalSettings.email}
                  onChange={e => setGeneralSettings({...generalSettings, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Globe className="w-3 h-3"/> الموقع الإلكتروني</label>
                <input 
                  type="text" 
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  dir="ltr"
                  value={generalSettings.website}
                  onChange={e => setGeneralSettings({...generalSettings, website: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: System & Notifications */}
        <div className="space-y-6">
          {/* System Preferences */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <SettingsIcon className="w-5 h-5 text-indigo-600" /> تفضيلات النظام
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العملة الافتراضية</label>
                <select 
                  className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={generalSettings.currency}
                  onChange={e => setGeneralSettings({...generalSettings, currency: e.target.value})}
                >
                  <option value="EGP">الجنيه المصري (EGP)</option>
                  <option value="USD">الدولار الأمريكي (USD)</option>
                  <option value="SAR">الريال السعودي (SAR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اللغة</label>
                <select 
                  className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={generalSettings.language}
                  onChange={e => setGeneralSettings({...generalSettings, language: e.target.value})}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المظهر</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleThemeSwitch('light')}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      generalSettings.theme === 'light' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' 
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> فاتح
                  </button>
                  <button 
                    onClick={() => handleThemeSwitch('dark')}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      generalSettings.theme === 'dark' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' 
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> داكن
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Bell className="w-5 h-5 text-amber-500" /> إعدادات التنبيهات
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تنبيهات النظام الداخلية</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={generalSettings.enableSystemNotifications} onChange={e => setGeneralSettings({...generalSettings, enableSystemNotifications: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تنبيهات البريد الإلكتروني</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={generalSettings.enableEmailNotifications} onChange={e => setGeneralSettings({...generalSettings, enableEmailNotifications: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Database className="w-5 h-5 text-green-600" /> إدارة البيانات
            </h4>
            <div className="space-y-3">
               <button className="w-full flex items-center justify-center gap-2 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-bold">
                  <Download className="w-4 h-4" /> تصدير نسخة احتياطية
               </button>
               <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">النسخ الاحتياطي التلقائي</label>
                  <select 
                    className="w-full border p-2 rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                    value={generalSettings.autoBackup}
                    onChange={e => setGeneralSettings({...generalSettings, autoBackup: e.target.value})}
                  >
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                    <option value="off">معطل</option>
                  </select>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => {
    // Find admin user
    const adminUser = users.find(u => AuthService.isAdmin(u));
    const otherUsers = users.filter(u => !AuthService.isAdmin(u));

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Admin Section */}
        {adminUser && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8" />
              <div>
                <h3 className="text-2xl font-bold">مدير النظام</h3>
                <p className="text-indigo-100">صلاحيات كاملة على جميع أجزاء النظام</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  معلومات الحساب
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-indigo-100">الاسم:</span> {adminUser.name}</p>
                  <p><span className="text-indigo-100">اسم المستخدم:</span> {adminUser.username}</p>
                  <p><span className="text-indigo-100">البريد الإلكتروني:</span> {adminUser.email}</p>
                  <p><span className="text-indigo-100">الحالة:</span> {adminUser.isActive ? 'نشط' : 'موقوف'}</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  الصلاحيات
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    'إدارة القضايا',
                    'إدارة الموكلين', 
                    'الجلسات والمواعيد',
                    'الأرشيف والمستندات',
                    'الحسابات والمصروفات',
                    'التقارير',
                    'المراجع القانونية',
                    'المساعد الذكي',
                    'إدارة المستخدمين',
                    'إعدادات النظام',
                    'صلاحيات النظام'
                  ].map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-300" />
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Users Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">المستخدمون الآخرون</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">تحكم في صلاحيات المستخدمين الآخرين</p>
            </div>
            <button 
              onClick={openAddUser}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> مستخدم جديد
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="p-4">المستخدم</th>
                  <th className="p-4">اسم الدخول</th>
                  <th className="p-4">الدور الوظيفي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">آخر دخول</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {otherUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-slate-200">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover"/> : user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                       {user.username || '-'}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-500">
                        {user.roleLabel}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openPermissionsModal(user)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="تحديث الصلاحيات"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openRoleAssignModal(user)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                          title="تعيين دور"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        {onDeleteUser && (
                          <button 
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {otherUsers.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا يوجد مستخدمون آخرون</p>
                <p className="text-sm">قم بإضافة مستخدمين جدد لإدارة النظام</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
      {/* Sidebar */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-indigo-600" /> الإعدادات
            </h2>
          </div>
          <nav className="p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <SettingsIcon className="w-4 h-4" /> إعدادات عامة
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Users className="w-4 h-4" /> المستخدمين والصلاحيات
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Lock className="w-4 h-4" /> الأمان
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">
            <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>إعدادات الأمان قيد التطوير</p>
          </div>
        )}
      </div>

      {/* User Modal (Add/Edit) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
                <p className="text-xs text-slate-500 mt-1">قم بتعبئة البيانات وتحديد الصلاحيات بدقة</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 border-b border-indigo-100 pb-2 mb-4">بيانات الحساب</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      dir="ltr"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  
                  {/* Username & Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم المستخدم (للدخول)</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="اختياري (يمكن استخدام البريد)"
                      value={formData.username || ''}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                       كلمة المرور {editingUser ? <span className="text-xs text-slate-400 font-normal">(اتركها فارغة للإبقاء على الحالية)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                       <input 
                         type="password" 
                         className="w-full border p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder={editingUser ? "••••••••" : "كلمة مرور جديدة"}
                         required={!editingUser}
                         value={formData.password || ''}
                         onChange={e => setFormData({...formData, password: e.target.value})}
                       />
                       <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="مثال: محامي استئناف"
                      value={formData.roleLabel}
                      onChange={e => setFormData({...formData, roleLabel: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={formData.isActive}
                          onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700">حساب نشط</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Permissions Matrix Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 border-b border-indigo-100 pb-2 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> جدول الصلاحيات
                </h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 bg-slate-50 p-3 text-xs font-bold text-slate-600 border-b border-slate-200">
                    <div className="col-span-1">الصفحة / الوحدة</div>
                    <div className="flex justify-center items-center gap-1"><Ban className="w-3 h-3 text-slate-400"/> لا يوجد صلاحية</div>
                    <div className="flex justify-center items-center gap-1"><Eye className="w-3 h-3 text-blue-500"/> قراءة فقط</div>
                    <div className="flex justify-center items-center gap-1"><Pencil className="w-3 h-3 text-green-500"/> تعديل وإدخال</div>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {MODULES.map(module => {
                      const currentAccess = formData.permissions?.find(p => p.moduleId === module.id)?.access || 'none';
                      
                      return (
                        <div key={module.id} className="grid grid-cols-4 p-3 items-center hover:bg-slate-50 transition-colors">
                          <div className="font-medium text-slate-800 text-sm">{module.label}</div>
                          
                          {/* Option: None */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-slate-200 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'none'}
                                onChange={() => handlePermissionChange(module.id, 'none')}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'none' ? 'border-slate-500 bg-slate-500 text-white' : 'border-slate-300'}`}>
                                {currentAccess === 'none' && <X className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>

                          {/* Option: Read */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-blue-50 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'read'}
                                onChange={() => handlePermissionChange(module.id, 'read')}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'read' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                                {currentAccess === 'read' && <Eye className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>

                          {/* Option: Write */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-green-50 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'write'}
                                onChange={() => handlePermissionChange(module.id, 'write')}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'write' ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'}`}>
                                {currentAccess === 'write' && <Check className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </form>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsUserModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveUser}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> حفظ المستخدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Permissions Modal
  const renderPermissionsModal = () => {
    if (!isPermissionsModalOpen || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
            <div>
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-600" />
                تحديث صلاحيات المستخدم
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                المستخدم: <span className="font-bold">{selectedUser.name}</span>
              </p>
            </div>
            <button onClick={() => setIsPermissionsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Permissions Content */}
          <div className="flex-1 p-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 bg-slate-50 p-3 text-xs font-bold text-slate-600 border-b border-slate-200">
                <div className="col-span-1">الصفحة / الوحدة</div>
                <div className="flex justify-center items-center gap-1"><Ban className="w-3 h-3 text-slate-400"/> لا يوجد صلاحية</div>
                <div className="flex justify-center items-center gap-1"><Eye className="w-3 h-3 text-blue-500"/> قراءة فقط</div>
                <div className="flex justify-center items-center gap-1"><Pencil className="w-3 h-3 text-green-500"/> تعديل وإدخال</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {MODULES.map(module => {
                  const currentAccess = tempPermissions.find(p => p.moduleId === module.id)?.access || 'none';
                  
                  return (
                    <div key={module.id} className="grid grid-cols-4 p-3 items-center hover:bg-slate-50 transition-colors">
                      <div className="font-medium text-slate-800 text-sm">{module.label}</div>
                      
                      {/* Option: None */}
                      <div className="flex justify-center">
                        <label className="cursor-pointer p-2 rounded hover:bg-slate-200 transition-colors">
                          <input 
                            type="radio" 
                            name={`temp-perm-${module.id}`} 
                            checked={currentAccess === 'none'}
                            onChange={() => handlePermissionChange(module.id, 'none')}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'none' ? 'border-slate-500 bg-slate-500 text-white' : 'border-slate-300'}`}>
                            {currentAccess === 'none' && <X className="w-3 h-3" />}
                          </div>
                        </label>
                      </div>

                      {/* Option: Read */}
                      <div className="flex justify-center">
                        <label className="cursor-pointer p-2 rounded hover:bg-blue-50 transition-colors">
                          <input 
                            type="radio" 
                            name={`temp-perm-${module.id}`} 
                            checked={currentAccess === 'read'}
                            onChange={() => handlePermissionChange(module.id, 'read')}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'read' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                            {currentAccess === 'read' && <Eye className="w-3 h-3" />}
                          </div>
                        </label>
                      </div>

                      {/* Option: Write */}
                      <div className="flex justify-center">
                        <label className="cursor-pointer p-2 rounded hover:bg-green-50 transition-colors">
                          <input 
                            type="radio" 
                            name={`temp-perm-${module.id}`} 
                            checked={currentAccess === 'write'}
                            onChange={() => handlePermissionChange(module.id, 'write')}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'write' ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'}`}>
                            {currentAccess === 'write' && <Pencil className="w-3 h-3" />}
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="text-sm text-slate-500">
              💡 تلميح: الصلاحيات يتم حفظها محلياً وفي السحابة
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                إلغاء
              </button>
              <button 
                onClick={handleSavePermissions}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isSaving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Role Assign Modal
  const renderRoleModal = () => {
    if (!isRoleModalOpen || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
            <div>
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-purple-600" />
                تعيين دور للمستخدم
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                المستخدم: <span className="font-bold">{selectedUser.name}</span>
              </p>
            </div>
            <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Role Options */}
          <div className="flex-1 p-6 space-y-4">
            <button 
              onClick={() => handleAssignRole('lawyer')}
              className="w-full p-4 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-right group"
              disabled={isSaving}
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 group-hover:text-indigo-700">👨‍⚖️ محامي</h4>
                  <p className="text-sm text-slate-600 mt-1">صلاحيات كاملة على القضايا والجلسات</p>
                </div>
                <Settings2 className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
            </button>

            <button 
              onClick={() => handleAssignRole('assistant')}
              className="w-full p-4 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all text-right group"
              disabled={isSaving}
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-700">👤 مساعد</h4>
                  <p className="text-sm text-slate-600 mt-1">صلاحيات محدودة على المستندات والبيانات</p>
                </div>
                <Settings2 className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
            </button>

            <button 
              onClick={() => handleAssignRole('admin')}
              className="w-full p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-right group"
              disabled={isSaving}
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 group-hover:text-purple-700">👑 مدير</h4>
                  <p className="text-sm text-slate-600 mt-1">صلاحيات كاملة على جميع أجزاء النظام</p>
                </div>
                <Settings2 className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100">
            <button 
              onClick={() => setIsRoleModalOpen(false)}
              className="w-full px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              disabled={isSaving}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-indigo-600" />
            إعدادات النظام
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">إدارة المستخدمين والصلاحيات وإعدادات النظام</p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className={`w-full md:w-64 bg-slate-50 dark:bg-slate-900 p-6 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-700 ${isSidebarCollapsed ? 'md:w-20' : ''}`}>
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('general')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <Settings2 className="w-4 h-4" /> {!isSidebarCollapsed && 'الإعدادات العامة'}
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <Users className="w-4 h-4" /> {!isSidebarCollapsed && 'المستخدمين والصلاحيات'}
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <Lock className="w-4 h-4" /> {!isSidebarCollapsed && 'الأمان والخصوصية'}
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'users' && renderUsersTab()}
              {activeTab === 'security' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">
                  <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>إعدادات الأمان قيد التطوير</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
                <p className="text-xs text-slate-500 mt-1">قم بتعبئة البيانات وتحديد الصلاحيات بدقة</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 border-b border-indigo-100 pb-2 mb-4">بيانات الحساب</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم المستخدم</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور {!editingUser && <span className="text-red-500">*</span>}</label>
                    <input 
                      type="password" 
                      required={!editingUser}
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder={editingUser ? "اتركها فارغة لإبقاء كلمة المرور الحالية" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الدور الوظيفي</label>
                    <select 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.roleLabel}
                      onChange={e => setFormData({...formData, roleLabel: e.target.value})}
                    >
                      <option value="مدير النظام">مدير النظام</option>
                      <option value="محامي">محامي</option>
                      <option value="موظف">موظف</option>
                      <option value="مساعد">مساعد</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <label htmlFor="isActive" className="mr-2 text-sm font-medium text-slate-700">
                      مستخدم نشط
                    </label>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-sm text-slate-500">
                💡 معلومات الحساب آمنة ومشفرة
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" /> حفظ المستخدم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {renderPermissionsModal()}
      {renderRoleModal()}
    </div>
  );
};

export default Settings;
