import React, { useState, useRef } from 'react';
import { 
  User, Lock, Bell, Moon, Sun, Database, Download, Cloud, Loader2, FileJson, History, HardDrive, RotateCcw,
  Smartphone, LogOut, MailCheck, ShieldCheck, UserX, RefreshCw,
  Printer, BarChart3, Activity, FileSearch, Settings2, Clock, TrendingUp, Users2, FileCheck, Filter, Calendar, DollarSign, AlertTriangle, Briefcase,
  MessageSquare, Send, Wifi, Mail, Lock as ShieldLock, KeyRound, ShieldCheck as ShieldCheckIcon, Calendar as CalendarIcon, Clock as ClockIcon, FileText as FileTextIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Download as DownloadIcon, Upload as UploadIcon, Link2, CreditCard as CreditCardIcon, Zap, Zap as ZapIcon, Users as UsersIcon, Fingerprint as FingerprintIcon,
  Plus, Edit3, Trash2, Check, X, Eye, 
  Save, AlertCircle, Ban, Pencil, Key,
  Building, Phone, Globe, Upload as UploadIcon2, FileText as FileTextIcon2, Bell as BellIcon, Moon as MoonIcon, Sun as SunIcon, Database as DatabaseIcon, Download as DownloadIcon2, Cloud as CloudIcon, Loader2 as Loader2Icon, FileJson as FileJsonIcon, History as HistoryIcon, HardDrive as HardDriveIcon, RotateCcw as RotateCcwIcon,
  Smartphone as SmartphoneIcon, LogOut as LogOutIcon, MailCheck as MailCheckIcon, ShieldCheck as ShieldCheckIcon2, UserX as UserXIcon, RefreshCw as RefreshCwIcon,
  Printer as PrinterIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileSearch as FileSearchIcon, Settings2 as Settings2Icon, Clock as ClockIcon2, TrendingUp as TrendingUpIcon, Users2 as Users2Icon, FileCheck as FileCheckIcon, Filter as FilterIcon, Calendar as CalendarIcon2, DollarSign as DollarSignIcon, AlertTriangle as AlertTriangleIcon, Briefcase as BriefcaseIcon,
  MessageSquare as MessageSquareIcon, Send as SendIcon, Wifi as WifiIcon, Mail as MailIcon, Lock as ShieldLockIcon, KeyRound as KeyRoundIcon, ShieldCheck as ShieldCheckIcon3, Calendar as CalendarIcon3, Clock as ClockIcon3, FileText as FileTextIcon3, BarChart as BarChartIcon2, PieChart as PieChartIcon2, Download as DownloadIcon3, Upload as UploadIcon3, Link2 as Link2Icon, CreditCard as CreditCardIcon2, Zap as ZapIcon2, Users as UsersIcon2, Fingerprint as FingerprintIcon2,
  Archive, Upload as UploadIcon4, Download as DownloadIcon4, Database as DatabaseIcon2, Trash2 as Trash2Icon, Clock as ClockIcon4, Shield as ShieldIcon4, Settings as SettingsIcon4, FileText as FileTextIcon4, AlertTriangle as AlertTriangleIcon4, CheckCircle as CheckCircleIcon, XCircle as XCircleIcon
} from 'lucide-react';
import { 
  updatePassword as updateFirebasePassword,
  getAuth,
  signOut as firebaseSignOut
} from 'firebase/auth';
import DataManagementClean from './DataManagementClean';
import { auth } from '../services/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface SettingsProps {
  users?: any[];
  onAddUser?: (user: any) => void;
  onUpdateUser?: (user: any) => void;
  onDeleteUser?: (userId: string) => void;
  currentTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  cases?: any[];
  clients?: any[];
  hearings?: any[];
  tasks?: any[];
  references?: any[];
  activities?: any[];
  onRestoreData?: (data: any) => void;
  readOnly?: boolean;
}

const SettingsClean: React.FC<SettingsProps> = ({ 
  users = [], onAddUser, onUpdateUser, onDeleteUser, currentTheme = 'light', onThemeChange,
  cases = [], clients = [], hearings = [], tasks = [], references = [], activities = [], onRestoreData, readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'security' | 'printing' | 'analytics' | 'advanced' | 'audit' | 'notifications' | 'reports' | 'advancedSecurity' | 'integrations' | 'dataManagement'>('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem('app_last_backup_date'));
  const restoreFileRef = useRef<HTMLInputElement>(null);
  
  // Security State
  const [securityData, setSecurityData] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    requireSpecialChars: true,
    enableTwoFactor: false,
    sessionTimeoutEnabled: true,
    autoLogout: false
  });

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    firmName: 'المكتب القانوني',
    firmSlogan: 'العدل والإنصاف',
    taxNumber: '123456789',
    address: 'شارع الملك فهد، الرياض',
    phone: '+966 50 123 4567',
    email: 'info@almizan.com',
    website: 'www.almizan.com',
    currency: 'ريال سعودي',
    language: 'العربية',
    theme: 'light',
    enableEmailNotifications: true,
    enableSystemNotifications: true,
    autoBackup: 'daily',
    logoPreview: ''
  });

  const renderDataManagementTab = () => (
    <DataManagementClean
      cases={cases}
      clients={clients}
      hearings={hearings}
      tasks={tasks}
      users={users}
      activities={activities}
      readOnly={readOnly}
    />
  );

  const renderGeneralTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">الإعدادات العامة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">إعدادات النظام الأساسية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firm Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" /> معلومات المؤسسة
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المؤسسة</label>
              <input
                type="text"
                value={generalSettings.firmName}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, firmName: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشعار</label>
              <input
                type="text"
                value={generalSettings.firmSlogan}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, firmSlogan: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الرقم الضريبي</label>
              <input
                type="text"
                value={generalSettings.taxNumber}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, taxNumber: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان</label>
              <input
                type="text"
                value={generalSettings.address}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={generalSettings.phone}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={generalSettings.email}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الموقع الإلكتروني</label>
              <input
                type="text"
                value={generalSettings.website}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, website: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600" /> تفضيلات النظام
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العملة</label>
              <select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              >
                <option value="ريال سعودي">ريال سعودي</option>
                <option value="درهم إماراتي">درهم إماراتي</option>
                <option value="دينار أردني">دينار أردني</option>
                <option value="جنيه مصري">جنيه مصري</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اللغة</label>
              <select
                value={generalSettings.language}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={readOnly}
              >
                <option value="العربية">العربية</option>
                <option value="English">English</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الوضع الليلي</label>
              <button
                onClick={() => onThemeChange?.(generalSettings.theme === 'light' ? 'dark' : 'light')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={readOnly}
              >
                <span className="sr-only">Toggle theme</span>
                <span className="inline-block h-4 w-4 rounded-full bg-white dark:bg-slate-800 transition-transform translate-x-0.5 group-hover:translate-x-0"></span>
                <span className="inline-block h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-600 transition-transform translate-x-[-1rem] group-hover:translate-x-[-0.5rem]"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">الإعدادات</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة النظام والتفضيلات</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('general')}
              className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'general' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700')}
            >
              <Settings2 className="w-4 h-4" /> الإعدادات العامة
            </button>
            <button 
              onClick={() => setActiveTab('dataManagement')}
              className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'dataManagement' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700')}
            >
              <Database className="w-4 h-4" /> إدارة البيانات المتقدمة
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'dataManagement' && renderDataManagementTab()}
      </div>
    </div>
  );
};

export default SettingsClean;
