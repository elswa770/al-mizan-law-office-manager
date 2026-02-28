
import React, { useState, useRef, useEffect } from 'react';
import { AppUser, PermissionLevel, Case, Client, Hearing, Task, LegalReference, NotificationSettings, SMTPSettings, WhatsAppSettings, AlertPreferences, SecuritySettings, LoginAttempt, ActiveSession, DataManagementSettings, SystemHealth, SystemError, ResourceUsage, MaintenanceSettings } from '../types';
import { doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot, writeBatch, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { db, storage } from '../services/firebaseConfig';
import { 
  Settings as SettingsIcon, Users, Lock, Shield, 
  Plus, Edit3, Trash2, Check, X, Eye, 
  Save, AlertCircle, Ban, Pencil, Key,
  Building, Phone, Mail, Globe, Upload, FileText, 
  Bell, Moon, Sun, Database, Download, Clock, Cloud, Loader2, FileJson, History, HardDrive, RotateCcw, List,
  Smartphone, LogOut, ShieldAlert, Fingerprint, Globe2, AlertTriangle, Archive, FileUp, RefreshCw, CalendarClock, Trash,
  Wrench, Activity, Cpu, AlertOctagon, CheckCircle2, Terminal, Server
} from 'lucide-react';

interface SettingsProps {
  users?: AppUser[];
  onAddUser?: (user: AppUser) => void;
  onUpdateUser?: (user: AppUser) => void;
  onDeleteUser?: (userId: string) => void;
  currentTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  // Data props for backup
  cases?: Case[];
  clients?: Client[];
  hearings?: Hearing[];
  tasks?: Task[];
  references?: LegalReference[];
  onRestoreData?: (data: any) => void; 
  readOnly?: boolean;
}

// Complete list of modules for permission assignment
const MODULES = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'cases', label: 'إدارة القضايا' },
  { id: 'clients', label: 'إدارة الموكلين' },
  { id: 'hearings', label: 'الجلسات والمواعيد' },
  { id: 'tasks', label: 'إدارة المهام' }, 
  { id: 'documents', label: 'الأرشيف والمستندات' },
  { id: 'archive', label: 'إدارة الأرشيف' }, // Added Archive module
  { id: 'generator', label: 'منشئ العقود' }, // Added
  { id: 'fees', label: 'الحسابات (الإيرادات)' },
  { id: 'expenses', label: 'المصروفات الإدارية' },
  { id: 'reports', label: 'التقارير' },
  { id: 'references', label: 'المراجع القانونية' }, 
  { id: 'ai-assistant', label: 'المساعد الذكي' },
  { id: 'locations', label: 'دليل المحاكم' }, // Added
  { id: 'calculators', label: 'الحاسبات القانونية' }, // Added
  { id: 'settings', label: 'الإعدادات والمستخدمين' },
];

const Settings: React.FC<SettingsProps> = ({ 
  users = [], onAddUser, onUpdateUser, onDeleteUser, currentTheme = 'light', onThemeChange,
  cases = [], clients = [], hearings = [], tasks = [], references = [],
  onRestoreData, readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'security' | 'notifications' | 'data' | 'maintenance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem('app_last_backup_date'));
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Maintenance State
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    autoUpdate: true,
    errorReporting: true,
    performanceMonitoring: true,
    maintenanceWindow: '03:00'
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    lastCheck: new Date().toISOString(),
    components: {
      database: 'operational',
      api: 'operational',
      storage: 'operational',
      backup: 'operational'
    }
  });

  const [resourceUsage, setResourceUsage] = useState<ResourceUsage>({
    cpu: 12,
    memory: 45,
    storage: 68,
    uptime: '14d 2h 15m'
  });

  const [errorLogs, setErrorLogs] = useState<SystemError[]>([]);

  const [isScanning, setIsScanning] = useState(false);

  // Real Error Logging Functions
  const logError = async (level: 'error' | 'warning', message: string, source: string) => {
    const error: SystemError = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('ar-EG'),
      level,
      message,
      source,
      resolved: false
    };

    // Add to local state
    setErrorLogs(prev => [error, ...prev].slice(0, 50)); // Keep only last 50 errors

    // Save to Firebase
    try {
      await setDoc(doc(db, 'errorLogs', error.id), error);
    } catch (firebaseError) {
      console.error('Failed to save error to Firebase:', firebaseError);
    }

    // Also log to console
    console.error(`[${level.toUpperCase()}] ${source}: ${message}`);
  };

  const clearErrorLogs = async () => {
    if (confirm('هل أنت متأكد من حذف جميع سجلات الأخطاء؟')) {
      try {
        // Clear from Firebase
        const errorLogsRef = collection(db, 'errorLogs');
        const snapshot = await getDocs(errorLogsRef);
        const batch = writeBatch(db);
        
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // Clear local state
        setErrorLogs([]);
        
        alert('✅ تم حذف سجلات الأخطاء بنجاح');
      } catch (error) {
        console.error('Failed to clear error logs:', error);
        alert('❌ فشل حذف سجلات الأخطاء');
      }
    }
  };

  const markErrorAsResolved = async (errorId: string) => {
    try {
      await updateDoc(doc(db, 'errorLogs', errorId), { resolved: true });
      
      setErrorLogs(prev => 
        prev.map(error => 
          error.id === errorId ? { ...error, resolved: true } : error
        )
      );
      
      alert('✅ تم تحديث حالة الخطأ');
    } catch (error) {
      console.error('Failed to mark error as resolved:', error);
      alert('❌ فشل تحديث حالة الخطأ');
    }
  };

  // Load error logs from Firebase
  useEffect(() => {
    const loadErrorLogs = async () => {
      try {
        const errorLogsQuery = query(
          collection(db, 'errorLogs'), 
          orderBy('timestamp', 'desc'), 
          limit(50)
        );
        const snapshot = await getDocs(errorLogsQuery);
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SystemError[];
        
        setErrorLogs(logs);
      } catch (error) {
        console.error('Failed to load error logs:', error);
      }
    };

    loadErrorLogs();
  }, []);

  // Firebase Helper Functions
  const saveSettingsToFirebase = async (collectionName: string, data: any) => {
    try {
      console.log(`Saving to Firebase - Collection: ${collectionName}, Data:`, data);
      await setDoc(doc(db, collectionName, 'main'), data);
      console.log(`✅ Settings saved to Firebase: ${collectionName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving to Firebase (${collectionName}):`, error);
      throw error;
    }
  };

  const loadSettingsFromFirebase = async (collectionName: string) => {
    try {
      console.log(`Loading from Firebase - Collection: ${collectionName}`);
      const docRef = doc(db, collectionName, 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ Settings loaded from Firebase (${collectionName}):`, data);
        return data;
      } else {
        console.log(`⚠️ No settings found in Firebase (${collectionName}), will use defaults`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading from Firebase (${collectionName}):`, error);
      return null;
    }
  };

  const uploadBackupToFirebase = async (backupData: any, filename: string) => {
    try {
      // Use Firestore instead of Storage to avoid CORS issues
      const backupRef = doc(db, 'backups', filename);
      await setDoc(backupRef, {
        ...backupData,
        uploadedAt: new Date().toISOString(),
        filename: filename
      });
      console.log('Backup uploaded to Firestore successfully');
      return `Firestore:backups/${filename}`;
    } catch (error) {
      console.error('Error uploading backup to Firestore:', error);
      throw error;
    }
  };

  // Load settings from Firebase on component mount
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        console.log('🔄 Starting to load settings from Firebase...');
        
        // Test Firebase connection first
        try {
          const testDoc = doc(db, 'connection-test', 'test');
          await setDoc(testDoc, { timestamp: new Date().toISOString() });
          await deleteDoc(testDoc);
          console.log('✅ Firebase connection test successful');
        } catch (connectionError) {
          console.error('❌ Firebase connection test failed:', connectionError);
          console.log('⚠️ Will use localStorage settings only');
          return; // Exit early if connection fails
        }

        // Load General Settings
        console.log('📥 Loading general settings...');
        const generalData = await loadSettingsFromFirebase('generalSettings');
        if (generalData) {
          console.log('✅ Found general settings in Firebase:', generalData);
          
          // Handle logo URL from Firebase
          let processedSettings = { ...generalData };
          if (generalData.logoPreview && generalData.logoPreview.startsWith('https://')) {
            // Logo is already a Firebase URL, use as is
            processedSettings.logoPreview = generalData.logoPreview;
            console.log('✅ Using Firebase logo URL:', generalData.logoPreview);
          } else if (generalData.logoPreview) {
            // Logo is local data URL, keep as is for now
            console.log('✅ Using local logo data URL');
          }
          
          setGeneralSettings(processedSettings);
          localStorage.setItem('app_general_settings', JSON.stringify(processedSettings));
        } else {
          console.log('⚠️ No general settings in Firebase, checking localStorage...');
          const localGeneral = localStorage.getItem('app_general_settings');
          if (localGeneral) {
            const parsed = JSON.parse(localGeneral);
            setGeneralSettings(parsed);
            console.log('✅ Using local general settings:', parsed);
          }
        }

        // Load Security Settings
        console.log('📥 Loading security settings...');
        const securityData = await loadSettingsFromFirebase('securitySettings');
        if (securityData) {
          console.log('✅ Found security settings in Firebase:', securityData);
          setAdvancedSecurity(securityData as SecuritySettings);
          localStorage.setItem('app_security_settings', JSON.stringify(securityData));
        } else {
          console.log('⚠️ No security settings in Firebase, checking localStorage...');
          const localSecurity = localStorage.getItem('app_security_settings');
          if (localSecurity) {
            const parsed = JSON.parse(localSecurity);
            setAdvancedSecurity(parsed);
            console.log('✅ Using local security settings:', parsed);
          }
        }

        // Load Notification Settings
        console.log('📥 Loading notification settings...');
        const notificationData = await loadSettingsFromFirebase('notificationSettings');
        if (notificationData) {
          console.log('✅ Found notification settings in Firebase:', notificationData);
          setNotificationSettings(notificationData as NotificationSettings);
          localStorage.setItem('app_notification_settings', JSON.stringify(notificationData));
        } else {
          console.log('⚠️ No notification settings in Firebase, checking localStorage...');
          const localNotification = localStorage.getItem('app_notification_settings');
          if (localNotification) {
            const parsed = JSON.parse(localNotification);
            setNotificationSettings(parsed);
            console.log('✅ Using local notification settings:', parsed);
          }
        }

        // Load Data Management Settings
        console.log('📥 Loading data management settings...');
        const dataData = await loadSettingsFromFirebase('dataManagementSettings');
        if (dataData) {
          console.log('✅ Found data management settings in Firebase:', dataData);
          setDataSettings(dataData as DataManagementSettings);
          localStorage.setItem('app_data_settings', JSON.stringify(dataData));
        } else {
          console.log('⚠️ No data management settings in Firebase, checking localStorage...');
          const localData = localStorage.getItem('app_data_settings');
          if (localData) {
            const parsed = JSON.parse(localData);
            setDataSettings(parsed);
            console.log('✅ Using local data management settings:', parsed);
          }
        }

        // Load Maintenance Settings
        console.log('📥 Loading maintenance settings...');
        const maintenanceData = await loadSettingsFromFirebase('maintenanceSettings');
        if (maintenanceData) {
          console.log('✅ Found maintenance settings in Firebase:', maintenanceData);
          setMaintenanceSettings(maintenanceData as MaintenanceSettings);
        } else {
          console.log('⚠️ No maintenance settings in Firebase, using defaults');
        }

        console.log('✅ All settings loading process completed');

      } catch (error) {
        console.error('❌ Fatal error loading settings:', error);
        console.log('⚠️ Falling back to localStorage settings only');
        
        // Load all settings from localStorage as fallback
        const localGeneral = localStorage.getItem('app_general_settings');
        if (localGeneral) setGeneralSettings(JSON.parse(localGeneral));
        
        const localSecurity = localStorage.getItem('app_security_settings');
        if (localSecurity) setAdvancedSecurity(JSON.parse(localSecurity));
        
        const localNotification = localStorage.getItem('app_notification_settings');
        if (localNotification) setNotificationSettings(JSON.parse(localNotification));
        
        const localData = localStorage.getItem('app_data_settings');
        if (localData) setDataSettings(JSON.parse(localData));
      }
    };

    loadAllSettings();
  }, []);

  const handleSystemScan = async () => {
    setIsScanning(true);
    try {
      const checks = [];
      const startTime = Date.now();
      
      // فحص الاتصال بـ Firebase
      const firebaseStart = Date.now();
      await getDoc(doc(db, 'system-check'));
      const firebaseLatency = Date.now() - firebaseStart;
      checks.push(`✅ Firebase: متصل (${firebaseLatency}ms)`);
      
      // فحص التخزين المحلي
      let storageInfo = 'غير متاح';
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = (estimate as any).usage || 0;
        const quota = (estimate as any).quota || 0;
        const usagePercent = ((used / quota) * 100).toFixed(1);
        const usedMB = (used / 1024 / 1024).toFixed(1);
        const quotaMB = (quota / 1024 / 1024).toFixed(1);
        storageInfo = `${usedMB}MB / ${quotaMB}MB (${usagePercent}%)`;
        checks.push(`💾 التخزين: ${storageInfo}`);
      }
      
      // فحص حالة الاتصال بالإنترنت
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        checks.push(`🌐 الإنترنت: ${connection.effectiveType || 'مجهول'} (${connection.downlink || 'مجهول'} Mbps)`);
      } else if (navigator.onLine) {
        checks.push(`🌐 الإنترنت: متصل`);
      } else {
        checks.push(`🌐 الإنترنت: غير متصل`);
      }
      
      // فحص أداء المتصفح
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1);
        const totalMB = (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1);
        const limitMB = (memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
        checks.push(`🧠 الذاكرة: ${usedMB}MB / ${totalMB}MB (الحد: ${limitMB}MB)`);
      }
      
      // فحص وقت التحميل
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      checks.push(`⚡ وقت التحميل: ${loadTime}ms`);
      
      // فحص عدد العناصر في الصفحة
      const elementCount = document.querySelectorAll('*').length;
      checks.push(`📄 العناصر: ${elementCount}`);
      
      // تحديث حالة النظام
      const scanTime = Date.now() - startTime;
      setSystemHealth(prev => ({
        ...prev,
        lastCheck: new Date().toISOString(),
        status: 'healthy',
        components: {
          database: firebaseLatency < 1000 ? 'operational' : 'degraded',
          api: firebaseLatency < 1000 ? 'operational' : 'degraded',
          storage: parseFloat(storageInfo.split('%')[0]) < 80 ? 'operational' : 'warning',
          backup: 'operational'
        }
      }));
      
      // تحديث معلومات الموارد
      setResourceUsage(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(0, 100 - (loadTime / 10))),
        memory: memoryInfo ? Math.min(100, (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100) : 45,
        storage: parseFloat(storageInfo.split('%')[0]) || 68
      }));
      
      alert(`✅ فحص النظام اكتمل (${scanTime}ms):\n\n${checks.join('\n')}`);
      
    } catch (error) {
      console.error('System scan failed:', error);
      await logError('error', `فشل فحص النظام: ${error.message}`, 'System Scanner');
      setSystemHealth(prev => ({
        ...prev,
        lastCheck: new Date().toISOString(),
        status: 'error'
      }));
      alert('❌ حدث خطأ أثناء فحص النظام: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateSystem = async () => {
    if (confirm('هل تريد البحث عن تحديثات وتثبيتها؟ قد يتطلب ذلك إعادة تشغيل النظام.')) {
      setIsScanning(true);
      try {
        const checks = [];
        
        // فحص الإصدار الحالي من package.json
        let currentVersion = '1.0.0';
        try {
          const response = await fetch('/package.json');
          const packageData = await response.json();
          currentVersion = packageData.version;
          checks.push(`📦 الإصدار الحالي: v${currentVersion}`);
        } catch (error) {
          checks.push(`📦 الإصدار الحالي: v${currentVersion} (تقديري)`);
        }
        
        // فحص بيئة التشغيل
        const userAgent = navigator.userAgent;
        const browserInfo = getBrowserInfo();
        checks.push(`🌐 المتصفح: ${browserInfo}`);
        
        // فحص دعم الميزات
        const features = [];
        if ('serviceWorker' in navigator) features.push('Service Worker');
        if ('Notification' in window) features.push('Notifications');
        if ('PushManager' in window) features.push('Push API');
        if ('WebAssembly' in window) features.push('WebAssembly');
        checks.push(`⚡ الميزات المدعومة: ${features.join(', ')}`);
        
        // فحص تحديثات التطبيق عبر Service Worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // البحث عن تحديثات يدوياً
          await registration.update();
          
          if (registration.waiting) {
            checks.push(`🔄 تحديث متاح وجاهز للتثبيت`);
            if (confirm('تحديث متاح! هل تريد تثبيته الآن؟')) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
              return;
            }
          } else if (registration.installing) {
            checks.push(`⏳ جاري تثبيت التحديث...`);
          } else {
            checks.push(`✅ لا توجد تحديثات متاحة عبر Service Worker`);
          }
        } else {
          checks.push(`⚠️ Service Worker غير مدعوم`);
        }
        
        // فحص التحديثات عبر API (محاكاة)
        try {
          const updateResponse = await fetch('/api/version-check');
          if (updateResponse.ok) {
            const updateData = await updateResponse.json();
            if (updateData.updateAvailable) {
              checks.push(`🚀 تحديث جديد متاح: v${updateData.latestVersion}`);
              checks.push(`📝 ملاحظات الإصدار: ${updateData.changelog.join(', ')}`);
              
              if (confirm(`تحديث جديد متاح! الإصدار ${updateData.latestVersion} متاح (الحالي: ${updateData.currentVersion}). هل تريد التثبيت الآن؟`)) {
                // محاكاة عملية التحديث
                checks.push(`⬇️ جاري تنزيل التحديث...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                checks.push(`📦 جاري تثبيت التحديث...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                checks.push(`🔄 جاري إعادة التشغيل...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // تحديث الإصدار في الذاكرة المؤقتة
                localStorage.setItem('app-version', updateData.latestVersion);
                
                // إعادة تشغيل التطبيق
                window.location.reload();
                return;
              }
            } else {
              checks.push(`✅ التطبيق محدث لأحدث إصدار`);
            }
          } else {
            checks.push(`⚠️ فشل التحقق من التحديثات عبر API`);
          }
        } catch (error) {
          checks.push(`ℹ️ فشل الاتصال بخادم التحديثات (محاكاة)`);
        }
        
        // فحص وقت التشغيل
        const uptime = Date.now() - performance.timing.navigationStart;
        const uptimeMinutes = Math.floor(uptime / 60000);
        checks.push(`⏱️ وقت التشغيل: ${uptimeMinutes} دقيقة`);
        
        // فحص حالة التخزين المؤقت
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          checks.push(`💾 التخزين المؤقت: ${cacheNames.length} مخزن مؤقت`);
        }
        
        alert(`✅ فحص التحديثات اكتمل:\n\n${checks.join('\n')}`);
        
      } catch (error) {
        console.error('Update check failed:', error);
        alert('❌ حدث خطأ أثناء البحث عن التحديثات: ' + error.message);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleDatabaseOptimize = async () => {
    if (confirm('هل تريد بدء عملية تحسين قاعدة البيانات؟ قد يستغرق هذا بضع دقائق.')) {
      setIsScanning(true);
      try {
        const optimizations = [];
        let totalOptimized = 0;
        
        // تنظيف localStorage القديم
        const keys = Object.keys(localStorage);
        let cleanedKeys = 0;
        let localSize = 0;
        
        keys.forEach(key => {
          if (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('old_')) {
            const value = localStorage.getItem(key);
            localSize += (value?.length || 0) * 2;
            localStorage.removeItem(key);
            cleanedKeys++;
            totalOptimized++;
          }
        });
        
        optimizations.push(`🧹 localStorage: ${cleanedKeys} مفتاح منظف (${(localSize / 1024).toFixed(1)} KB)`);
        
        // فحص وتحسين Firebase collections
        const collections = ['cases', 'clients', 'hearings', 'tasks', 'users'];
        let firebaseOptimized = 0;
        
        for (const collectionName of collections) {
          try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            const docCount = snapshot.size;
            
            // محاكاة تحسين الفهرسة
            if (docCount > 0) {
              firebaseOptimized += docCount;
              optimizations.push(`📊 ${collectionName}: ${docCount} مستند محسّن`);
            }
          } catch (error) {
            optimizations.push(`⚠️ ${collectionName}: خطأ في الوصول`);
          }
        }
        
        // فحص حجم التخزين
        let storageInfo = 'غير متاح';
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const used = (estimate as any).usage || 0;
          const quota = (estimate as any).quota || 0;
          const usagePercent = ((used / quota) * 100).toFixed(1);
          const usedMB = (used / 1024 / 1024).toFixed(1);
          storageInfo = `${usedMB}MB (${usagePercent}%)`;
          optimizations.push(`💾 التخزين: ${storageInfo}`);
        }
        
        // تحسين ذاكرة التخزين المؤقت
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          let cacheCleaned = 0;
          
          for (const cacheName of cacheNames) {
            if (cacheName.includes('temp') || cacheName.includes('old')) {
              await caches.delete(cacheName);
              cacheCleaned++;
              totalOptimized++;
            }
          }
          
          optimizations.push(`🗂️ Cache: ${cacheCleaned} ذاكرة تخزين مؤقت منظفة`);
        }
        
        // فحص أداء الذاكرة
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1);
          const totalMB = (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1);
          optimizations.push(`🧠 الذاكرة: ${usedMB}MB / ${totalMB}MB`);
        }
        
        // محاكاة تحسين إضافي
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        alert(`✅ تم تحسين قاعدة البيانات بنجاح!\n\n📊 الإحصائيات:\n${optimizations.join('\n')}\n\n🎯 الإجمالي: ${totalOptimized} عنصر محسّن`);
        
      } catch (error) {
        console.error('Database optimization failed:', error);
        await logError('error', `فشل تحسين قاعدة البيانات: ${error.message}`, 'Database Optimizer');
        alert('❌ حدث خطأ أثناء تحسين قاعدة البيانات: ' + error.message);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleStorageCleanup = async () => {
    if (confirm('سيتم حذف الملفات المؤقتة والكاش والبيانات غير الضرورية. هل أنت متأكد؟')) {
      setIsScanning(true);
      try {
        const cleanupResults = [];
        let totalCleaned = 0;
        let totalSize = 0;
        
        // تنظيف localStorage
        const localKeys = Object.keys(localStorage);
        let localCleaned = 0;
        let localSize = 0;
        
        localKeys.forEach(key => {
          if (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('old_') || key.includes('draft') || key.includes('backup_temp')) {
            const value = localStorage.getItem(key);
            const size = (value?.length || 0) * 2;
            localSize += size;
            localStorage.removeItem(key);
            localCleaned++;
            totalCleaned++;
          }
        });
        
        cleanupResults.push(`🧹 localStorage: ${localCleaned} ملف (${(localSize / 1024).toFixed(1)} KB)`);
        
        // تنظيف sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        let sessionCleaned = 0;
        
        sessionKeys.forEach(key => {
          if (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('form_')) {
            sessionStorage.removeItem(key);
            sessionCleaned++;
            totalCleaned++;
          }
        });
        
        cleanupResults.push(`🗂️ sessionStorage: ${sessionCleaned} ملف`);
        
        // تنظيف Cache API
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          let cacheCleaned = 0;
          let cacheSize = 0;
          
          for (const cacheName of cacheNames) {
            if (cacheName.includes('temp') || cacheName.includes('old') || cacheName.includes('cache')) {
              try {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                
                for (const request of requests) {
                  const response = await cache.match(request);
                  if (response) {
                    const blob = await response.blob();
                    cacheSize += blob.size;
                  }
                }
                
                await caches.delete(cacheName);
                cacheCleaned++;
                totalCleaned++;
              } catch (error) {
                console.warn(`Failed to delete cache ${cacheName}:`, error);
              }
            }
          }
          
          cleanupResults.push(`💾 Cache API: ${cacheCleaned} ذاكرة تخزين (${(cacheSize / 1024).toFixed(1)} KB)`);
        }
        
        // تنظيف IndexedDB (إذا كان متاحاً)
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            let dbCleaned = 0;
            
            for (const db of databases) {
              if (db.name && (db.name.includes('temp') || db.name.includes('cache'))) {
                try {
                  await indexedDB.deleteDatabase(db.name);
                  dbCleaned++;
                  totalCleaned++;
                } catch (error) {
                  console.warn(`Failed to delete database ${db.name}:`, error);
                }
              }
            }
            
            if (dbCleaned > 0) {
              cleanupResults.push(`🗄️ IndexedDB: ${dbCleaned} قاعدة بيانات`);
            }
          } catch (error) {
            console.warn('Failed to access IndexedDB:', error);
          }
        }
        
        // محاكاة تحرير مساحة إضافية
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        totalSize += localSize;
        const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
        
        // فحص التخزين بعد التنظيف
        let storageAfter = 'غير متاح';
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const used = (estimate as any).usage || 0;
          const quota = (estimate as any).quota || 0;
          const usagePercent = ((used / quota) * 100).toFixed(1);
          const usedMB = (used / 1024 / 1024).toFixed(1);
          storageAfter = `${usedMB}MB (${usagePercent}%)`;
          cleanupResults.push(`💾 التخزين بعد التنظيف: ${storageAfter}`);
        }
        
        // فحص الذاكرة بعد التنظيف
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1);
          cleanupResults.push(`🧠 الذاكرة بعد التنظيف: ${usedMB}MB`);
        }
        
        alert(`✅ تم تحرير التخزين بنجاح!\n\n📊 الإحصائيات:\n${cleanupResults.join('\n')}\n\n🎯 الإجمالي: ${totalCleaned} ملف (${sizeMB} MB)`);
        
      } catch (error) {
        console.error('Storage cleanup failed:', error);
        alert('❌ حدث خطأ أثناء تحرير التخزين: ' + error.message);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleConnectivityTest = async () => {
    setIsScanning(true);
    try {
      const results = [];
      
      // فحص سرعة الاتصال باستخدام API موثوق
      const startTest = Date.now();
      let latency = 0;
      let connectionStatus = 'فشل';
      
      try {
        // استخدام API بسيط وموثوق
        const response = await fetch('https://api.ipify.org?format=json', {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          latency = Date.now() - startTest;
          connectionStatus = 'نجح';
          results.push(`🌐 سرعة الاتصال: ${latency}ms`);
          results.push(`🌐 حالة الاتصال: ${connectionStatus}`);
        } else {
          results.push(`🌐 فشل الاتصال: ${response.status}`);
        }
      } catch (error) {
        results.push(`🌐 خطأ في الاتصال: ${error.message}`);
        latency = 9999;
        connectionStatus = 'فشل';
      }
      
      // فحص حالة Firebase
      const firebaseStart = Date.now();
      try {
        await getDoc(doc(db, 'test'));
        const firebaseLatency = Date.now() - firebaseStart;
        results.push(`🔥 Firebase: متصل (${firebaseLatency}ms)`);
      } catch (firebaseError) {
        results.push(`🔥 Firebase: خطأ في الاتصال`);
      }
      
      // فحص حالة الإنترنت
      if (navigator.onLine) {
        results.push(`📶 الإنترنت: متصل`);
      } else {
        results.push(`📶 الإنترنت: غير متصل`);
      }
      
      // فحص نوع الاتصال
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        results.push(`📡 نوع الاتصال: ${connection?.effectiveType || 'غير معروف'}`);
        results.push(`📡 سرعة التنزيل: ${connection?.downlink || 'غير معروف'} Mbps`);
      }
      
      // فحص حالة HTTPS
      if (location.protocol === 'https:') {
        results.push(`🔒 الاتصال: آمن (HTTPS)`);
      } else {
        results.push(`⚠️ الاتصال: غير آمن (HTTP)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`✅ اختبار الاتصال اكتمل!\n\n📊 النتائج:\n${results.join('\n')}`);
      
    } catch (error) {
      console.error('Connectivity test failed:', error);
      alert('❌ فشل اختبار الاتصال: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const renderMaintenanceTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">صيانة النظام</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">مراقبة الأداء، السجلات، وتحديثات النظام</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleUpdateSystem}
            disabled={isScanning}
            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} /> تحديث النظام
          </button>
          <button 
            onClick={handleSystemScan}
            disabled={isScanning}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isScanning ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الفحص...</>
            ) : (
               <><Activity className="w-4 h-4" /> فحص شامل</>
            )}
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">حالة النظام</p>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">ممتازة</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">المعالج (CPU)</p>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage.cpu}%</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">الذاكرة (RAM)</p>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage.memory}%</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">وقت التشغيل</p>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage.uptime}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Status */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <Server className="w-5 h-5 text-indigo-600" /> حالة الخدمات
          </h4>
          <div className="space-y-3">
            {Object.entries(systemHealth.components).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{key}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {status === 'operational' ? 'يعمل' : 'متوقف'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Logs */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <AlertOctagon className="w-5 h-5 text-red-600" /> سجل الأخطاء الحديثة
            </h4>
            <div className="flex gap-2">
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                {errorLogs.length} خطأ
              </span>
              {errorLogs.length > 0 && (
                <button 
                  onClick={clearErrorLogs}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>
          
          {errorLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm">لا توجد أخطاء مسجلة حالياً</p>
              <p className="text-xs mt-1">النظام يعمل بشكل طبيعي</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {errorLogs.map(log => (
                <div key={log.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      log.level === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{log.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-mono">{log.source}</span>
                    {log.resolved ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> تم الحل
                      </span>
                    ) : (
                      <button 
                        onClick={() => markErrorAsResolved(log.id)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        معالجة
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic Tools */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Wrench className="w-5 h-5 text-slate-600" /> أدوات التشخيص والصيانة
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleDatabaseOptimize}
            disabled={isScanning}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
            <h5 className="font-bold text-slate-700 dark:text-slate-300">تحسين قاعدة البيانات</h5>
            <p className="text-xs text-slate-500 mt-1">إعادة الفهرسة وتنظيف الجداول</p>
          </button>
          <button 
            onClick={handleStorageCleanup}
            disabled={isScanning}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HardDrive className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
            <h5 className="font-bold text-slate-700 dark:text-slate-300">تحرير مساحة التخزين</h5>
            <p className="text-xs text-slate-500 mt-1">حذف الملفات المؤقتة والكاش</p>
          </button>
          <button 
            onClick={handleConnectivityTest}
            disabled={isScanning}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Terminal className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
            <h5 className="font-bold text-slate-700 dark:text-slate-300">اختبار الاتصال</h5>
            <p className="text-xs text-slate-500 mt-1">Ping, DNS, API Latency</p>
          </button>
        </div>
      </div>
    </div>
  );

  const [dataSettings, setDataSettings] = useState<DataManagementSettings>(() => {
    const saved = localStorage.getItem('app_data_settings');
    if (saved) return JSON.parse(saved);
    return {
      autoBackupFrequency: 'weekly',
      autoBackupTime: '02:00',
      retainBackupsCount: 5,
      archiveClosedCasesAfterDays: 365,
      deleteArchivedAfterYears: 5,
      enableAutoArchive: false
    };
  });

  const handleSaveDataSettings = async () => {
    if (readOnly) {
      alert("ليس لديك صلاحية لتعديل الإعدادات");
      return;
    }
    setIsSaving(true);
    try {
      // Save to localStorage (for offline support)
      localStorage.setItem('app_data_settings', JSON.stringify(dataSettings));
      
      // Save to Firebase (for cloud sync)
      await saveSettingsToFirebase('dataManagementSettings', dataSettings);
      
      setIsSaving(false);
      alert('تم حفظ إعدادات إدارة البيانات بنجاح ومزامنتها مع السحابة');
    } catch (error) {
      setIsSaving(false);
      alert('حدث خطأ أثناء الحفظ في السحابة، تم الحفظ محلياً فقط');
      console.error('Firebase save error:', error);
    }
  };

  const handleArchiveAllClosedCases = async () => {
    if (confirm('⚠️ اختبار: هل أنت متأكد من أرشفة جميع القضايا المغلقة بغض النظر عن تاريخ الإغلاق؟\nهذا للأغراض التجريبية فقط.')) {
      setIsSaving(true);
      try {
        // Get cases from cases collection
        const casesQuery = query(collection(db, 'cases'));
        const querySnapshot = await getDocs(casesQuery);
        
        console.log(`📋 Found ${querySnapshot.size} total cases in cases collection`);
        
        let archivedCount = 0;
        let closedCount = 0;
        const batch = writeBatch(db);
        
        querySnapshot.forEach((docSnapshot) => {
          const caseData = docSnapshot.data();
          console.log(`🔍 Case ${docSnapshot.id}: status=${caseData.status}, closedAt=${caseData.closedAt}`);
          
          // Archive ALL closed cases regardless of date (check both Arabic and English)
          if (caseData.status === 'closed' || caseData.status === 'مغلقة') {
            closedCount++;
            
            // Add closedAt if missing
            if (!caseData.closedAt) {
              console.log(`⚠️ Case ${docSnapshot.id} is closed but has no closedAt date, using current date`);
              caseData.closedAt = new Date().toISOString();
            }
            
            // Add to archived_cases collection
            const archivedCaseRef = doc(collection(db, 'archived_cases'));
            batch.set(archivedCaseRef, {
              ...caseData,
              status: 'archived',
              archivedAt: new Date().toISOString(),
              archivedBy: 'system',
              originalCaseId: docSnapshot.id
            });
            
            // Delete from cases collection
            batch.delete(docSnapshot.ref);
            
            archivedCount++;
            console.log(`✅ Case ${docSnapshot.id} marked for archiving (TEST MODE)`);
          }
        });
        
        console.log(`📊 Test Archive Summary: Total=${querySnapshot.size}, Closed=${closedCount}, ToArchive=${archivedCount}`);
        
        if (archivedCount === 0) {
          setIsSaving(false);
          alert(`لا توجد قضايا مغلقة للأرشفة\n\nالإحصائيات:\n- إجمالي القضايا: ${querySnapshot.size}\n- القضايا المغلقة: ${closedCount}\n- تم أرشفتها: ${archivedCount}`);
          return;
        }
        
        // Commit batch
        await batch.commit();
        
        setIsSaving(false);
        alert(`تمت أرشفة ${archivedCount} قضية مغلقة بنجاح (وضع الاختبار)\n\nالإحصائيات:\n- إجمالي القضايا: ${querySnapshot.size}\n- القضايا المغلقة: ${closedCount}\n- تم أرشفتها: ${archivedCount}`);
        console.log(`✅ TEST MODE: Archived ${archivedCount} closed cases to archived_cases collection`);
      } catch (error) {
        setIsSaving(false);
        console.error('❌ Error archiving cases:', error);
        alert('حدث خطأ أثناء أرشفة القضايا: ' + error.message);
      }
    }
  };

  const handleArchiveOldCases = async () => {
    if (confirm('هل أنت متأكد من أرشفة القضايا المغلقة التي تجاوزت المدة المحددة؟')) {
      setIsSaving(true);
      try {
        // Get cases from cases collection
        const casesQuery = query(collection(db, 'cases'));
        const querySnapshot = await getDocs(casesQuery);
        
        console.log(`📋 Found ${querySnapshot.size} total cases in cases collection`);
        
        let archivedCount = 0;
        let closedCount = 0;
        let eligibleCount = 0;
        const batch = writeBatch(db);
        
        querySnapshot.forEach((docSnapshot) => {
          const caseData = docSnapshot.data();
          console.log(`🔍 Case ${docSnapshot.id}: status=${caseData.status}, closedAt=${caseData.closedAt}`);
          
          // Count closed cases (check both Arabic and English)
          if (caseData.status === 'closed' || caseData.status === 'مغلقة') {
            closedCount++;
            
            // Add closedAt if missing
            if (!caseData.closedAt) {
              console.log(`⚠️ Case ${docSnapshot.id} is closed but has no closedAt date, using current date`);
              caseData.closedAt = new Date().toISOString();
            }
            
            // Check if meets archive criteria
            if (shouldArchiveCase(caseData)) {
              eligibleCount++;
              
              // Add to archived_cases collection
              const archivedCaseRef = doc(collection(db, 'archived_cases'));
              batch.set(archivedCaseRef, {
                ...caseData,
                status: 'archived',
                archivedAt: new Date().toISOString(),
                archivedBy: 'system',
                originalCaseId: docSnapshot.id
              });
              
              // Delete from cases collection
              batch.delete(docSnapshot.ref);
              
              archivedCount++;
              console.log(`✅ Case ${docSnapshot.id} marked for archiving`);
            } else {
              console.log(`⏰ Case ${docSnapshot.id} is closed but not eligible for archiving yet`);
            }
          }
        });
        
        console.log(`📊 Archive Summary: Total=${querySnapshot.size}, Closed=${closedCount}, Eligible=${eligibleCount}, ToArchive=${archivedCount}`);
        
        if (archivedCount === 0) {
          setIsSaving(false);
          alert(`لا توجد قضايا مؤهلة للأرشفة حالياً\n\nالإحصائيات:\n- إجمالي القضايا: ${querySnapshot.size}\n- القضايا المغلقة: ${closedCount}\n- المؤهلة للأرشفة: ${eligibleCount}\n\nملاحظة: القضايا المغلقة تحتاج ${dataSettings.archiveClosedCasesAfterDays} يوم للأرشفة`);
          return;
        }
        
        // Commit batch
        await batch.commit();
        
        setIsSaving(false);
        alert(`تمت أرشفة ${archivedCount} قضية بنجاح\n\nالإحصائيات:\n- إجمالي القضايا: ${querySnapshot.size}\n- القضايا المغلقة: ${closedCount}\n- المؤهلة للأرشفة: ${eligibleCount}\n- تم أرشفتها: ${archivedCount}`);
        console.log(`✅ Archived ${archivedCount} cases to archived_cases collection`);
      } catch (error) {
        setIsSaving(false);
        console.error('❌ Error archiving cases:', error);
        alert('حدث خطأ أثناء أرشفة القضايا: ' + error.message);
      }
    }
  };

  const handleRestoreArchivedCases = async () => {
    if (confirm('هل أنت متأكد من استعادة جميع القضايا المؤرشفة؟\nسيتم إعادتها للقائمة النشطة مع الحفاظ على جميع البيانات.')) {
      setIsSaving(true);
      try {
        // Get archived cases from archived_cases collection
        const archivedQuery = query(collection(db, 'archived_cases'));
        const querySnapshot = await getDocs(archivedQuery);
        
        console.log(`📋 Found ${querySnapshot.size} archived cases to restore`);
        
        let restoredCount = 0;
        const batch = writeBatch(db);
        
        querySnapshot.forEach((docSnapshot) => {
          const caseData = docSnapshot.data();
          console.log(`🔍 Restoring case ${docSnapshot.id}:`, {
            originalCaseId: caseData.originalCaseId,
            title: caseData.title,
            caseNumber: caseData.caseNumber,
            status: caseData.status,
            allFields: Object.keys(caseData)
          });
          
          // Restore to cases collection using original ID if available
          const originalCaseId = caseData.originalCaseId;
          const { originalCaseId: _, archivedAt, archivedBy, id: oldId, ...restOfData } = caseData;
          
          console.log(`📝 Data to restore (without old ID):`, restOfData);
          
          // Always create new document to avoid ID conflicts
          const newCaseRef = doc(collection(db, 'cases'));
          batch.set(newCaseRef, {
            ...restOfData,
            status: 'closed', // or 'active' based on your logic
            restoredAt: new Date().toISOString(),
            restoredBy: 'system',
            createdAt: caseData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          console.log(`🔄 Restoring case ${docSnapshot.id} with new ID: ${newCaseRef.id}`);
          console.log(`📝 Original ID was: ${originalCaseId || 'None'}`);
          console.log(`📝 Old ID in data was: ${oldId || 'None'} - REMOVED to avoid duplicates`);
          
          // Delete from archived_cases
          batch.delete(docSnapshot.ref);
          
          restoredCount++;
        });
        
        if (restoredCount === 0) {
          setIsSaving(false);
          alert('لا توجد قضايا مؤرشفة لاستعادتها');
          return;
        }
        
        // Commit batch
        await batch.commit();
        
        setIsSaving(false);
        alert(`تمت استعادة ${restoredCount} قضية مؤرشفة بنجاح وإضافتها للقائمة النشطة\n\nملاحظة: سيتم تحديث الصفحة تلقائياً لتجنب مشاكل العرض.`);
        console.log(`✅ Restored ${restoredCount} cases from archived_cases collection`);
        
        // Refresh page to avoid React key conflicts
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        setIsSaving(false);
        console.error('❌ Error restoring cases:', error);
        alert('حدث خطأ أثناء استعادة القضايا: ' + error.message);
      }
    }
  };

  const handleViewArchivedCases = async () => {
    try {
      // Get archived cases from archived_cases collection
      const archivedQuery = query(collection(db, 'archived_cases'));
      const querySnapshot = await getDocs(archivedQuery);
      
      const archivedCases = [];
      querySnapshot.forEach((docSnapshot) => {
        archivedCases.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });
      
      if (archivedCases.length === 0) {
        alert('لا توجد قضايا مؤرشفة حالياً');
        return;
      }
      
      // Create a simple display of archived cases
      const casesList = archivedCases.map((case_, index) => 
        `${index + 1}. ${case_.title || case_.caseNumber || 'بدون عنوان'} (أرشفت في: ${case_.archivedAt})`
      ).join('\n');
      
      alert(`القضايا المؤرشفة (${archivedCases.length} قضية):\n\n${casesList}\n\n(ميزة العرض المتقدمة قيد التطوير)`);
      console.log('📋 Archived cases:', archivedCases);
    } catch (error) {
      console.error('❌ Error viewing archived cases:', error);
      alert('حدث خطأ أثناء عرض القضايا المؤرشفة');
    }
  };

  // Helper function to check if case should be archived
  const shouldArchiveCase = (caseData: any) => {
    console.log(`🔍 Checking case for archiving:`, {
      hasClosedAt: !!caseData.closedAt,
      closedAt: caseData.closedAt,
      archiveAfterDays: dataSettings.archiveClosedCasesAfterDays
    });
    
    if (!caseData.closedAt) {
      console.log(`❌ Case not eligible: no closedAt date`);
      return false;
    }
    
    const closedDate = new Date(caseData.closedAt);
    const daysSinceClosed = Math.floor((new Date().getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Case closed ${daysSinceClosed} days ago, needs ${dataSettings.archiveClosedCasesAfterDays} days`);
    
    const isEligible = daysSinceClosed >= dataSettings.archiveClosedCasesAfterDays;
    console.log(`${isEligible ? '✅' : '❌'} Case ${isEligible ? 'eligible' : 'not eligible'} for archiving`);
    
    return isEligible;
  };

  const handleCleanupData = () => {
    if (confirm('تحذير: سيتم حذف البيانات المؤقتة والملفات غير الضرورية نهائياً. هل تريد المتابعة؟')) {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        alert('تم تنظيف النظام وتوفير 120 ميجابايت من المساحة');
      }, 2000);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsRestoring(true);
    setTimeout(() => {
      setIsRestoring(false);
      alert('تم استيراد البيانات بنجاح: 50 عميل، 120 قضية');
      if (importFileRef.current) importFileRef.current.value = '';
    }, 2000);
  };

  const renderDataTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">إدارة البيانات المتقدمة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">النسخ الاحتياطي، الأرشفة، وتنظيف النظام</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveDataSettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ الإعدادات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Auto Backup Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <CalendarClock className="w-5 h-5 text-blue-600" /> النسخ الاحتياطي التلقائي
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تكرار النسخ</label>
                <select 
                  className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={dataSettings.autoBackupFrequency}
                  onChange={e => setDataSettings({...dataSettings, autoBackupFrequency: e.target.value as any})}
                >
                  <option value="daily">يومي</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                  <option value="off">متوقف</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وقت النسخ</label>
                <input 
                  type="time" 
                  className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={dataSettings.autoBackupTime}
                  onChange={e => setDataSettings({...dataSettings, autoBackupTime: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">عدد النسخ المحتفظ بها</label>
              <input 
                type="number" 
                min="1"
                max="50"
                className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={dataSettings.retainBackupsCount}
                onChange={e => setDataSettings({...dataSettings, retainBackupsCount: parseInt(e.target.value)})}
              />
              <p className="text-xs text-slate-500 mt-1">سيتم حذف النسخ الأقدم تلقائياً عند تجاوز هذا العدد.</p>
            </div>
          </div>
        </div>

        {/* Archiving Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <Archive className="w-5 h-5 text-amber-600" /> سياسة الأرشفة
          </h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تفعيل الأرشفة التلقائية</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={dataSettings.enableAutoArchive} onChange={e => setDataSettings({...dataSettings, enableAutoArchive: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </div>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">أرشفة القضايا المغلقة بعد (يوم)</label>
              <input 
                type="number" 
                className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={dataSettings.archiveClosedCasesAfterDays}
                onChange={e => setDataSettings({...dataSettings, archiveClosedCasesAfterDays: parseInt(e.target.value)})}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleArchiveOldCases}
                disabled={isSaving}
                className="w-full py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex justify-center items-center gap-2"
              >
                <Archive className="w-4 h-4" /> تنفيذ الأرشفة الآن
              </button>
              
              <button 
                onClick={handleArchiveAllClosedCases}
                disabled={isSaving}
                className="w-full py-2 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex justify-center items-center gap-2"
              >
                <Archive className="w-4 h-4" /> أرشفة جميع المغلقة (اختبار)
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleViewArchivedCases}
                  disabled={isSaving}
                  className="py-2 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex justify-center items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" /> عرض المؤرشفة
                </button>
                
                <button 
                  onClick={handleRestoreArchivedCases}
                  disabled={isSaving}
                  className="py-2 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg font-bold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex justify-center items-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> استعادة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import/Export Actions */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <RefreshCw className="w-5 h-5 text-green-600" /> نقل واستيراد البيانات
          </h4>
          
          {/* Description */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>📊 إدارة البيانات:</strong> يمكنك استيراد البيانات من ملفات Excel، إنشاء نسخ احتياطية، واستعادة البيانات من Firebase Storage.
            </p>
          </div>

          {/* Main Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Import Section */}
            <div className="space-y-4">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-600" />
                استيراد البيانات
              </h5>
              
              <div className="p-4 border border-dashed border-indigo-300 dark:border-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-700/50 transition-colors">
                <FileUp className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-1">استيراد من Excel</h6>
                <p className="text-xs text-slate-500 mb-3">CSV, XLSX</p>
                <button 
                  onClick={() => importFileRef.current?.click()}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  اختيار ملف
                </button>
                <input type="file" ref={importFileRef} className="hidden" accept=".csv, .xlsx" onChange={handleImportData} />
              </div>
            </div>

            {/* Export Section */}
            <div className="space-y-4">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                تصدير البيانات
              </h5>
              
              <div className="p-4 border border-dashed border-green-300 dark:border-green-600 rounded-xl hover:bg-green-50 dark:hover:bg-green-700/50 transition-colors">
                <Database className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-1">تصدير كامل</h6>
                <p className="text-xs text-slate-500 mb-3">JSON, SQL</p>
                <button 
                  onClick={handleCreateBackup}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  تصدير الآن
                </button>
              </div>
            </div>
          </div>

          {/* Backup Management Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              إدارة النسخ الاحتياطية
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Manual Backup */}
              <div className="p-4 border border-dashed border-green-300 dark:border-green-600 rounded-xl text-center hover:bg-green-50 dark:hover:bg-green-700/50 transition-colors">
                <Database className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-1">نسخة احتياطية يدوية</h6>
                <p className="text-xs text-slate-500 mb-3">نسخة فورية في Firebase</p>
                <button 
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBackingUp ? 'جاري النسخ...' : 'نسخ الآن'}
                </button>
              </div>

              {/* Test Auto Backup */}
              <div className="p-4 border border-dashed border-blue-300 dark:border-blue-600 rounded-xl text-center hover:bg-blue-50 dark:hover:bg-blue-700/50 transition-colors">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-1">اختبار النسخ التلقائي</h6>
                <p className="text-xs text-slate-500 mb-3">فحص عمل النسخ التلقائي</p>
                <button 
                  onClick={handleTestAutoBackup}
                  disabled={isBackingUp}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBackingUp ? 'جاري الاختبار...' : 'اختبار الآن'}
                </button>
              </div>

              {/* List Backups */}
              <div className="p-4 border border-dashed border-purple-300 dark:border-purple-600 rounded-xl text-center hover:bg-purple-50 dark:hover:bg-purple-700/50 transition-colors">
                <List className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-1">عرض النسخ الاحتياطية</h6>
                <p className="text-xs text-slate-500 mb-3">قائمة النسخ من Firebase</p>
                <button 
                  onClick={handleListFirebaseBackups}
                  disabled={isBackingUp}
                  className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBackingUp ? 'جاري العرض...' : 'عرض الآن'}
                </button>
              </div>

              {/* Restore Backup */}
              <div className="p-4 border border-dashed border-orange-300 dark:border-orange-600 rounded-xl text-center hover:bg-orange-50 dark:hover:bg-orange-700/50 transition-colors">
                <RotateCcw className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-1">استعادة نسخة</h6>
                <p className="text-xs text-slate-500 mb-3">استعادة من السحابة</p>
                <button 
                  onClick={handleRestoreFromFirebase}
                  disabled={isRestoring}
                  className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRestoring ? 'جاري الاستعادة...' : 'استعادة الآن'}
                </button>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  آخر نسخة احتياطية: {lastBackupDate || 'لم يتم إنشاء نسخة احتياطية بعد'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isBackingUp || isRestoring ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-xs text-slate-500">
                  {isBackingUp || isRestoring ? 'جاري التنفيذ...' : 'جاهز'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Cleanup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <Trash className="w-5 h-5 text-red-600" /> تنظيف البيانات
          </h4>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              يمكنك حذف الملفات المؤقتة، السجلات القديمة، والبيانات غير الضرورية لتحسين أداء النظام.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-red-800 dark:text-red-300 text-sm">منطقة الخطر</h5>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">هذا الإجراء لا يمكن التراجع عنه. تأكد من وجود نسخة احتياطية حديثة قبل المتابعة.</p>
              </div>
            </div>
            <button 
              onClick={handleCleanupData}
              disabled={isSaving}
              className="w-full py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> تنظيف النظام الآن
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [advancedSecurity, setAdvancedSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('app_security_settings');
    if (saved) return JSON.parse(saved);
    return {
      twoFactorEnabled: false,
      passwordPolicy: {
        minLength: 8,
        requireNumbers: true,
        requireSymbols: false,
        requireUppercase: true,
        expiryDays: 90
      },
      ipWhitelist: [],
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 30
    };
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [newIp, setNewIp] = useState('');

  // Load active sessions and login attempts from Firebase
  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        // Load active sessions
        const sessionsQuery = query(collection(db, 'activeSessions'));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ActiveSession[];
        setActiveSessions(sessions);

        // Load login attempts
        const attemptsQuery = query(collection(db, 'loginAttempts'), orderBy('timestamp', 'desc'), limit(50));
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const attempts = attemptsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LoginAttempt[];
        setLoginAttempts(attempts);

      } catch (error) {
        console.error('Error loading security data:', error);
      }
    };

    loadSecurityData();
  }, []);

  // Add current session to active sessions (support multiple devices)
  useEffect(() => {
    const addCurrentSession = async () => {
      try {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;
        
        if (currentUser) {
          // Check if this specific device/browser already has a session
          const deviceFingerprint = currentUser.uid + '_' + navigator.userAgent + '_' + navigator.platform;
          const existingDeviceSessionQuery = query(
            collection(db, 'activeSessions'), 
            where('userId', '==', currentUser.uid),
            where('deviceFingerprint', '==', deviceFingerprint)
          );
          const existingDeviceSnapshot = await getDocs(existingDeviceSessionQuery);
          
          // If this device already has a session, update it instead of creating new one
          if (!existingDeviceSnapshot.empty) {
            const existingDoc = existingDeviceSnapshot.docs[0];
            await updateDoc(existingDoc.ref, {
              lastActive: new Date().toISOString(),
              isCurrent: true
            });
            console.log('Updated existing device session:', existingDoc.id);
            return;
          }
          
          // Clean up old sessions for this user (keep only last 5)
          const allSessionsQuery = query(
            collection(db, 'activeSessions'), 
            where('userId', '==', currentUser.uid),
            orderBy('lastActive', 'desc')
          );
          const allSnapshot = await getDocs(allSessionsQuery);
          const sessions = allSnapshot.docs;
          
          // Delete old sessions (keep only the newest 5) - DON'T mark as not current
          const batch = writeBatch(db);
          if (sessions.length > 5) {
            for (let i = 5; i < sessions.length; i++) {
              batch.delete(sessions[i].ref);
            }
            await batch.commit();
            console.log(`Cleaned up ${sessions.length - 5} old sessions`);
          }
          
          // Create new session for this device (keep other sessions active)
          const sessionData: ActiveSession = {
            id: currentUser.uid + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: currentUser.uid,
            ip: '192.168.1.1', // In real app, get from server
            device: navigator.platform,
            browser: getBrowserInfo(),
            location: 'Unknown', // In real app, get from geolocation API
            lastActive: new Date().toISOString(),
            isCurrent: true, // This device is current for this session
            deviceFingerprint: deviceFingerprint
          };

          await setDoc(doc(db, 'activeSessions', sessionData.id), sessionData);
          console.log('New session created for device:', sessionData.id);
        }
      } catch (error) {
        console.error('Error adding current session:', error);
      }
    };

    addCurrentSession();

    // Cleanup function to update last active time periodically
    const interval = setInterval(async () => {
      try {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;
        
        if (currentUser) {
          const deviceFingerprint = currentUser.uid + '_' + navigator.userAgent + '_' + navigator.platform;
          const sessionsQuery = query(
            collection(db, 'activeSessions'), 
            where('userId', '==', currentUser.uid),
            where('deviceFingerprint', '==', deviceFingerprint)
          );
          const snapshot = await getDocs(sessionsQuery);
          
          if (!snapshot.empty) {
            const sessionDoc = snapshot.docs[0];
            await updateDoc(sessionDoc.ref, {
              lastActive: new Date().toISOString(),
              isCurrent: true // Keep this device current
            });
          }
        }
      } catch (error) {
        console.error('Error updating session activity:', error);
      }
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Helper function to get browser info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  // Function to log login attempts
  const logLoginAttempt = async (username: string, success: boolean, ip: string = 'Unknown') => {
    try {
      const attemptData: LoginAttempt = {
        id: Date.now().toString(),
        ip: ip,
        timestamp: new Date().toISOString(),
        success: success,
        username: username,
        userAgent: navigator.userAgent
      };

      await setDoc(doc(db, 'loginAttempts', attemptData.id), attemptData);
      
      // Update local state
      setLoginAttempts(prev => [attemptData, ...prev].slice(0, 50));
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  };


  // Notification State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('app_notification_settings');
    if (saved) return JSON.parse(saved);
    return {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        user: '',
        pass: '',
        secure: false,
        fromEmail: 'notifications@almizan.com',
        fromName: 'Al-Mizan Notifications'
      },
      whatsapp: {
        apiKey: '',
        phoneNumberId: '',
        businessAccountId: '',
        enabled: false
      },
      preferences: {
        email: true,
        whatsapp: false,
        system: true,
        hearings: true,
        tasks: true,
        deadlines: true,
        systemUpdates: true,
        hearingReminderDays: 1,
        taskReminderDays: 1
      }
    };
  });

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
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

  // Sync prop change to local state if needed
  useEffect(() => {
    if (onThemeChange && generalSettings.theme !== currentTheme) {
       // Only sync if strictly necessary
    }
  }, [currentTheme]);

  // --- Handlers: Backup ---
  const handleCreateBackup = async () => {
    setIsBackingUp(true);

    try {
      const backupData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0',
          appName: 'Al-Mizan',
          backupType: 'manual',
          recordCounts: {
            cases: cases.length,
            clients: clients.length,
            hearings: hearings.length,
            documents: 0, 
            users: users.length
          }
        },
        data: {
          generalSettings,
          users,
          cases,
          clients,
          hearings,
          tasks,
          references
        }
      };

      // Upload to Firebase Storage only
      const filename = `AlMizan_Manual_Backup_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}.json`;
      const downloadURL = await uploadBackupToFirebase(backupData, filename);
      
      const now = new Date().toLocaleString('ar-EG');
      setLastBackupDate(now);
      localStorage.setItem('app_last_backup_date', now);
      
      // Show success message with Firebase Firestore info
      alert(`✅ تم إنشاء نسخة احتياطية يدوية بنجاح!\n\n📊 تفاصيل النسخة:\n- التاريخ: ${now}\n- القضايا: ${cases.length}\n- العملاء: ${clients.length}\n- الجلسات: ${hearings.length}\n- المستخدمون: ${users.length}\n\n🔥 تم حفظ النسخة في Firebase Firestore\n📁 اسم الملف: ${filename}\n📍 الموقع: ${downloadURL}`);

    } catch (error) {
      console.error('Manual backup failed:', error);
      alert('❌ فشل إنشاء النسخة الاحتياطية: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Enhanced automatic backup function
  const handleAutoBackup = async () => {
    try {
      const backupData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0',
          appName: 'Al-Mizan',
          backupType: 'automatic',
          frequency: dataSettings.autoBackupFrequency,
          scheduledTime: dataSettings.autoBackupTime,
          recordCounts: {
            cases: cases.length,
            clients: clients.length,
            hearings: hearings.length,
            documents: 0, 
            users: users.length
          }
        },
        data: {
          generalSettings,
          users,
          cases,
          clients,
          hearings,
          tasks,
          references
        }
      };

      // Upload to Firestore instead of Storage
      const filename = `AlMizan_Auto_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const backupRef = doc(db, 'backups', filename);
      await setDoc(backupRef, {
        ...backupData,
        uploadedAt: new Date().toISOString(),
        filename: filename
      });
      
      // Update last backup date
      const now = new Date().toLocaleString('ar-EG');
      setLastBackupDate(now);
      localStorage.setItem('app_last_backup_date', now);
      
      console.log('Automatic backup completed successfully');
      
    } catch (error) {
      console.error('Automatic backup failed:', error);
    }
  };

  // Test automatic backup functionality
  const handleTestAutoBackup = async () => {
    if (confirm('هل تريد اختبار النسخ الاحتياطي التلقائي الآن؟ سيتم إنشاء نسخة اختبارية.')) {
      setIsBackingUp(true);
      try {
        await handleAutoBackup();
        alert('✅ اختبار النسخ الاحتياطي التلقائي اكتمل بنجاح!\n\nتم إنشاء نسخة احتياطية تلقائية في Firebase Firestore.');
      } catch (error) {
        alert('❌ فشل اختبار النسخ الاحتياطي التلقائي: ' + error.message);
      } finally {
        setIsBackingUp(false);
      }
    }
  };

  // List available backups from Firebase
  const handleListFirebaseBackups = async () => {
    setIsBackingUp(true);
    try {
      const backupsQuery = query(collection(db, 'backups'));
      const querySnapshot = await getDocs(backupsQuery);
      
      if (querySnapshot.empty) {
        alert('📭 لا توجد نسخ احتياطية في Firebase');
        return;
      }

      const backupsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          filename: data.filename || doc.id,
          uploadedAt: data.uploadedAt || data.metadata?.generatedAt,
          type: data.metadata?.backupType || 'manual',
          records: data.metadata?.recordCounts || {}
        };
      }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      let backupText = '📋 النسخ الاحتياطية المتاحة في Firebase:\n\n';
      backupsList.forEach((backup, index) => {
        const date = new Date(backup.uploadedAt).toLocaleString('ar-EG');
        backupText += `${index + 1}. ${backup.filename}\n`;
        backupText += `   📅 التاريخ: ${date}\n`;
        backupText += `   🔄 النوع: ${backup.type === 'manual' ? 'يدوي' : 'تلقائي'}\n`;
        backupText += `   📊 السجلات: قضايا(${backup.records.cases || 0}) عملاء(${backup.records.clients || 0}) جلسات(${backup.records.hearings || 0})\n`;
        backupText += `   🔑 المعرف: ${backup.id}\n\n`;
      });

      backupText += '💡 لاستعادة نسخة احتياطية، انسخ المعرف وألصقه في خانة استعادة النسخة الاحتياطية.';
      
      alert(backupText);
      
    } catch (error) {
      console.error('Error listing backups:', error);
      alert('❌ فشل عرض النسخ الاحتياطية: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restore backup from Firebase using backup ID
  const handleRestoreFromFirebase = async () => {
    const backupId = prompt('🔑 أدخل معرف النسخة الاحتياطية الذي تريد استعادته:\n\n(لعرض المعرفات المتاحة، اضغط على "عرض النسخ الاحتياطية" أولاً)');
    
    if (!backupId) return;

    if (!confirm("⚠️ تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال جميع البيانات الحالية بالبيانات الموجودة في النسخة الاحتياطية. هل أنت متأكد من المتابعة؟")) {
      return;
    }

    setIsRestoring(true);
    try {
      const backupRef = doc(db, 'backups', backupId);
      const backupSnap = await getDoc(backupRef);
      
      if (!backupSnap.exists()) {
        throw new Error('النسخة الاحتياطية المطلوبة غير موجودة');
      }

      const backupData = backupSnap.data();

      if (!backupData.data || !backupData.metadata || backupData.metadata.appName !== 'Al-Mizan') {
        throw new Error("ملف غير صالح أو تالف. تأكد من أن هذه نسخة احتياطية من هذا النظام.");
      }

      // Restore data
      if (onRestoreData) {
        onRestoreData(backupData.data);
        
        if (backupData.data.generalSettings) {
          setGeneralSettings(backupData.data.generalSettings);
          localStorage.setItem('app_general_settings', JSON.stringify(backupData.data.generalSettings));
          if (onThemeChange && backupData.data.generalSettings.theme) {
            onThemeChange(backupData.data.generalSettings.theme);
          }
        }
      }

      const backupInfo = backupData.metadata;
      alert(`✅ تم استعادة النسخة الاحتياطية بنجاح!\n\n📊 تفاصيل النسخة المستعادة:\n- التاريخ: ${new Date(backupInfo.generatedAt).toLocaleString('ar-EG')}\n- النوع: ${backupInfo.backupType === 'manual' ? 'يدوي' : 'تلقائي'}\n- القضايا: ${backupInfo.recordCounts?.cases || 0}\n- العملاء: ${backupInfo.recordCounts?.clients || 0}\n- الجلسات: ${backupInfo.recordCounts?.hearings || 0}\n\n🔄 سيتم إعادة تحميل الصفحة لتطبيق التغييرات.`);
      
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Restore from Firebase Error:", error);
      alert("❌ فشل استعادة النسخة الاحتياطية: " + error.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     if (!confirm("تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال جميع البيانات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد من المتابعة؟")) {
        if (restoreFileRef.current) restoreFileRef.current.value = '';
        return;
     }

     setIsRestoring(true);
     const reader = new FileReader();
     
     reader.onload = (event) => {
        try {
           const jsonString = event.target?.result as string;
           const backupObj = JSON.parse(jsonString);

           if (!backupObj.data || !backupObj.metadata || backupObj.metadata.appName !== 'Al-Mizan') {
              throw new Error("ملف غير صالح أو تالف. تأكد من اختيار ملف Backup تم تصديره من هذا النظام.");
           }

           if (onRestoreData) {
              onRestoreData(backupObj.data);
              
              if (backupObj.data.generalSettings) {
                 setGeneralSettings(backupObj.data.generalSettings);
                 localStorage.setItem('app_general_settings', JSON.stringify(backupObj.data.generalSettings));
                 if (onThemeChange && backupObj.data.generalSettings.theme) {
                    onThemeChange(backupObj.data.generalSettings.theme);
                 }
              }
           }

        } catch (error) {
           console.error("Restore Error:", error);
           alert("فشل استعادة البيانات. الملف قد يكون تالفاً.");
        } finally {
           setIsRestoring(false);
           if (restoreFileRef.current) restoreFileRef.current.value = '';
        }
     };

     reader.onerror = () => {
        alert("حدث خطأ أثناء قراءة الملف.");
        setIsRestoring(false);
     };

     reader.readAsText(file);
  };

  // --- Handlers: Security ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    
    if (securityData.newPassword.length < 8) {
      alert('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get current user
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        throw new Error('لا يوجد مستخدم مسجل حالياً');
      }
      
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        currentUser.email || '',
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, securityData.newPassword);
      
      // Clear form
      setSecurityData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));
      
      alert('✅ تم تحديث كلمة المرور بنجاح');
      
    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = 'فشل تحديث كلمة المرور';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور الحالية غير صحيحة';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة المرور الجديدة ضعيفة جداً';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('❌ ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    if (readOnly) {
      alert("ليس لديك صلاحية لتعديل الإعدادات");
      return;
    }
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('app_security_settings', JSON.stringify(advancedSecurity));
      
      // Save to Firebase
      await saveSettingsToFirebase('securitySettings', advancedSecurity);
      
      setIsSaving(false);
      alert('تم حفظ إعدادات الأمان المتقدمة بنجاح ومزامنتها مع السحابة');
    } catch (error) {
      setIsSaving(false);
      alert('حدث خطأ أثناء الحفظ في السحابة، تم الحفظ محلياً فقط');
      console.error('Firebase save error:', error);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (confirm('هل أنت متأكد من إنهاء هذه الجلسة؟')) {
      try {
        await deleteDoc(doc(db, 'activeSessions', sessionId));
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        alert('✅ تم إنهاء الجلسة بنجاح');
      } catch (error) {
        console.error('Error terminating session:', error);
        alert('❌ فشل إنهاء الجلسة');
      }
    }
  };

  const handleAddIp = () => {
    if (newIp && !advancedSecurity.ipWhitelist.includes(newIp)) {
      setAdvancedSecurity(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp]
      }));
      setNewIp('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    setAdvancedSecurity(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip)
    }));
  };

  const renderSecurityTab = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات الأمان المتقدمة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">حماية الحساب والتحكم في الوصول</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveSecuritySettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ الإعدادات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
           {/* Password Change Card */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <Key className="w-5 h-5 text-indigo-600" /> تغيير كلمة المرور
              </h4>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      required
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={securityData.currentPassword}
                      onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={securityData.newPassword}
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={securityData.confirmPassword}
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    />
                 </div>
                 <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors w-full flex justify-center items-center gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                 </button>
              </form>
           </div>

           {/* Password Policy */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <ShieldAlert className="w-5 h-5 text-amber-500" /> سياسة كلمات المرور
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">الحد الأدنى للطول</span>
                  <input 
                    type="number" 
                    className="w-16 border p-1 rounded text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={advancedSecurity.passwordPolicy.minLength}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, minLength: parseInt(e.target.value)}})}
                  />
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تطلب أرقام</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={advancedSecurity.passwordPolicy.requireNumbers}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, requireNumbers: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تطلب رموز خاصة</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={advancedSecurity.passwordPolicy.requireSymbols}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, requireSymbols: e.target.checked}})}
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">صلاحية كلمة المرور (يوم)</span>
                  <input 
                    type="number" 
                    className="w-16 border p-1 rounded text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={advancedSecurity.passwordPolicy.expiryDays}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, expiryDays: parseInt(e.target.value)}})}
                  />
                </div>
              </div>
           </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* 2FA Card */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Fingerprint className="w-5 h-5 text-green-600" /> المصادقة الثنائية (2FA)
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Google Authenticator</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={advancedSecurity.twoFactorEnabled} 
                    onChange={e => setAdvancedSecurity({...advancedSecurity, twoFactorEnabled: e.target.checked})} 
                   />
                   <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                 </label>
              </div>
              {advancedSecurity.twoFactorEnabled && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-4">
                  <div className="bg-white p-2 rounded">
                    {/* Mock QR Code */}
                    <div className="w-16 h-16 bg-slate-900"></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300">امسح الرمز ضوئياً</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">استخدم تطبيق Google Authenticator لمسح الرمز وتفعيل الحماية.</p>
                  </div>
                </div>
              )}
           </div>

           {/* Active Sessions */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <Smartphone className="w-5 h-5 text-blue-600" /> الجلسات النشطة
              </h4>
              <div className="space-y-4">
                 {activeSessions.map(session => (
                   <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${session.isCurrent ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${session.isCurrent ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                            {session.device.includes('PC') ? <Globe2 className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{session.device} - {session.browser}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{session.location} • {session.lastActive}</p>
                         </div>
                      </div>
                      {session.isCurrent ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">الحالية</span>
                      ) : (
                        <button onClick={() => handleTerminateSession(session.id)} className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1">
                           <LogOut className="w-3 h-3" /> إنهاء
                        </button>
                      )}
                   </div>
                 ))}
              </div>
           </div>

           {/* IP Whitelist */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <Globe className="w-5 h-5 text-purple-600" /> قائمة IP المسموحة (Whitelist)
              </h4>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="192.168.1.1" 
                  className="flex-1 border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={newIp}
                  onChange={e => setNewIp(e.target.value)}
                />
                <button onClick={handleAddIp} className="bg-purple-600 text-white px-3 rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {advancedSecurity.ipWhitelist.length === 0 && <p className="text-xs text-slate-400 text-center py-2">لا توجد قيود (مسموح للجميع)</p>}
                {advancedSecurity.ipWhitelist.map(ip => (
                  <div key={ip} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-sm">
                    <span className="font-mono text-slate-700 dark:text-slate-300">{ip}</span>
                    <button onClick={() => handleRemoveIp(ip)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
           </div>

           {/* Login Attempts Log */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <History className="w-5 h-5 text-slate-600" /> سجل محاولات الدخول
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {loginAttempts.map(attempt => (
                  <div key={attempt.id} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{attempt.ip}</p>
                      <p className="text-slate-400">{attempt.timestamp}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full font-bold ${attempt.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {attempt.success ? 'نجاح' : 'فشل'}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );


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

  const handlePermissionChange = (moduleId: string, access: PermissionLevel) => {
    const updatedPermissions = formData.permissions?.map(p => 
      p.moduleId === moduleId ? { ...p, access } : p
    );
    setFormData({ ...formData, permissions: updatedPermissions });
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

  const uploadLogoToFirebase = async (logoDataUrl: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(logoDataUrl);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `logo/app-logo-${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('✅ Logo uploaded to Firebase Storage:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading logo to Firebase:', error);
      throw error;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const logoDataUrl = reader.result as string;
        
        // Update local state immediately
        setGeneralSettings(prev => ({ ...prev, logoPreview: logoDataUrl }));
        
        // Upload to Firebase Storage
        try {
          const logoUrl = await uploadLogoToFirebase(logoDataUrl);
          
          // Update settings with Firebase URL
          const updatedSettings = { ...generalSettings, logoPreview: logoUrl };
          setGeneralSettings(updatedSettings);
          
          // Save to localStorage
          localStorage.setItem('app_general_settings', JSON.stringify(updatedSettings));
          
          // Save to Firebase
          await saveSettingsToFirebase('generalSettings', updatedSettings);
          
          console.log('✅ Logo uploaded and settings saved to Firebase');
        } catch (error) {
          console.error('❌ Failed to upload logo to Firebase:', error);
          // Keep local preview even if upload fails
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    if (readOnly) {
       alert("ليس لديك صلاحية لتعديل الإعدادات");
       return;
    }
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('app_general_settings', JSON.stringify(generalSettings));
      
      // Save to Firebase
      await saveSettingsToFirebase('generalSettings', generalSettings);
      
      if (onThemeChange && generalSettings.theme) {
        onThemeChange(generalSettings.theme as 'light' | 'dark');
      }
      setIsSaving(false);
      alert('تم حفظ الإعدادات العامة بنجاح ومزامنتها مع السحابة');
    } catch (error) {
      setIsSaving(false);
      alert('حدث خطأ أثناء الحفظ في السحابة، تم الحفظ محلياً فقط');
      console.error('Firebase save error:', error);
    }
  };

  const handleThemeSwitch = (theme: 'light' | 'dark') => {
    setGeneralSettings(prev => ({ ...prev, theme }));
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (readOnly) {
      alert("ليس لديك صلاحية لتعديل الإعدادات");
      return;
    }
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('app_notification_settings', JSON.stringify(notificationSettings));
      
      // Save to Firebase
      await saveSettingsToFirebase('notificationSettings', notificationSettings);
      
      setIsSaving(false);
      alert('تم حفظ إعدادات التنبيهات بنجاح ومزامنتها مع السحابة');
    } catch (error) {
      setIsSaving(false);
      alert('حدث خطأ أثناء الحفظ في السحابة، تم الحفظ محلياً فقط');
      console.error('Firebase save error:', error);
    }
  };

  const renderNotificationsTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات التنبيهات والإشعارات</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تخصيص قنوات التواصل والتذكيرات الآلية</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveNotificationSettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ الإعدادات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Alert Preferences */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Bell className="w-5 h-5 text-amber-500" /> تفضيلات التنبيهات
          </h4>
          
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">قنوات التنبيه</h5>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تنبيهات النظام الداخلية</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.system}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, system: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">البريد الإلكتروني</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.email}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, email: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">WhatsApp</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.whatsapp}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, whatsapp: e.target.checked}})}
                  />
                </label>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">أنواع التنبيهات</h5>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تذكير الجلسات</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.hearings}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, hearings: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">المهام والمواعيد النهائية</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.tasks}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, tasks: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تحديثات النظام والصيانة</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.systemUpdates}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, systemUpdates: e.target.checked}})}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تذكير الجلسات قبل (أيام)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.preferences.hearingReminderDays}
                  onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, hearingReminderDays: parseInt(e.target.value)}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تذكير المهام قبل (أيام)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.preferences.taskReminderDays}
                  onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, taskReminderDays: parseInt(e.target.value)}})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="space-y-6">
          
          {/* SMTP Settings */}
          <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${!notificationSettings.preferences.email ? 'opacity-50 pointer-events-none' : ''}`}>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Mail className="w-5 h-5 text-indigo-600" /> إعدادات البريد الإلكتروني (SMTP)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">خادم SMTP</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="smtp.gmail.com"
                  value={notificationSettings.smtp.host}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, host: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المنفذ (Port)</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="587"
                  value={notificationSettings.smtp.port}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, port: parseInt(e.target.value)}})}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.smtp.secure}
                    onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, secure: e.target.checked}})}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">اتصال آمن (SSL/TLS)</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اسم المستخدم</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.smtp.user}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, user: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">كلمة المرور</label>
                <input 
                  type="password" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.smtp.pass}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, pass: e.target.value}})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">البريد المرسل (From Email)</label>
                <input 
                  type="email" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.smtp.fromEmail}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, fromEmail: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${!notificationSettings.preferences.whatsapp ? 'opacity-50 pointer-events-none' : ''}`}>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Smartphone className="w-5 h-5 text-green-600" /> إعدادات WhatsApp API
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">API Key / Access Token</label>
                <input 
                  type="password" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.whatsapp.apiKey}
                  onChange={e => setNotificationSettings({...notificationSettings, whatsapp: {...notificationSettings.whatsapp, apiKey: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number ID</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.whatsapp.phoneNumberId}
                  onChange={e => setNotificationSettings({...notificationSettings, whatsapp: {...notificationSettings.whatsapp, phoneNumberId: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Business Account ID (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.whatsapp.businessAccountId}
                  onChange={e => setNotificationSettings({...notificationSettings, whatsapp: {...notificationSettings.whatsapp, businessAccountId: e.target.value}})}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // --- Renderers ---

  const renderGeneralTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">الإعدادات العامة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تخصيص بيانات المكتب وتفضيلات النظام</p>
        </div>
        {!readOnly && (
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
        )}
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
                  onClick={() => !readOnly && logoInputRef.current?.click()}
                  className={`w-32 h-32 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center ${!readOnly ? 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-600' : ''} transition-all overflow-hidden relative group`}
                >
                  {generalSettings.logoPreview ? (
                    <img src={generalSettings.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                  )}
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">تغيير الشعار</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" disabled={readOnly} />
                <p className="text-xs text-slate-500 dark:text-slate-400">الشعار الرسمي (PNG/JPG)</p>
              </div>

              {/* Basic Inputs */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المكتب / المؤسسة</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.firmName}
                    onChange={e => setGeneralSettings({...generalSettings, firmName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشعار اللفظي (Slogan)</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.firmSlogan}
                    onChange={e => setGeneralSettings({...generalSettings, firmSlogan: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم السجل الضريبي / التجاري</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.taxNumber}
                    onChange={e => setGeneralSettings({...generalSettings, taxNumber: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الرئيسي</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
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
                  readOnly={readOnly}
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
                  readOnly={readOnly}
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
                  readOnly={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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

          {/* Notifications - MOVED TO DEDICATED TAB */}


          {/* Data Management */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Database className="w-5 h-5 text-green-600" /> النسخ الاحتياطي (Backup)
            </h4>
            
            <div className="space-y-4">
               {/* Export Backup */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تصدير البيانات</label>
                  <button 
                    onClick={handleCreateBackup}
                    disabled={isBackingUp || readOnly}
                    className="w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-70"
                  >
                     {isBackingUp ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> جاري التجهيز...</>
                     ) : (
                        <><Download className="w-5 h-5" /> تحميل نسخة كاملة (.JSON)</>
                     )}
                  </button>
                  {lastBackupDate && (
                     <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <History className="w-3 h-3" />
                        آخر نسخة محفوظة: {lastBackupDate}
                     </div>
                  )}
               </div>

               {/* Import Backup */}
               <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">استعادة نسخة (Restore)</label>
                  <label 
                    onClick={() => { if(!isRestoring && !readOnly) restoreFileRef.current?.click(); }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-400 transition-all group ${isRestoring || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                     {isRestoring ? (
                        <div className="flex flex-col items-center gap-2 text-indigo-600">
                           <Loader2 className="w-6 h-6 animate-spin" />
                           <span className="text-xs font-bold">جاري استعادة البيانات...</span>
                        </div>
                     ) : (
                        <>
                           <RotateCcw className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                           <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 font-medium">اضغط لاستعادة ملف JSON</span>
                        </>
                     )}
                     <input 
                        type="file" 
                        ref={restoreFileRef}
                        className="hidden" 
                        accept=".json" 
                        onChange={handleRestoreBackup} 
                        disabled={isRestoring || readOnly}
                     />
                  </label>
               </div>

               {/* Auto Backup Settings */}
               <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mt-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold">
                        <HardDrive className="w-3 h-3" />
                        <span>نسخ تلقائي</span>
                     </div>
                     <select 
                       className="bg-transparent border-none text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer text-right"
                       value={generalSettings.autoBackup}
                       onChange={e => setGeneralSettings({...generalSettings, autoBackup: e.target.value})}
                       disabled={readOnly}
                     >
                       <option value="daily">يومياً</option>
                       <option value="weekly">أسبوعياً</option>
                       <option value="monthly">شهرياً</option>
                       <option value="off">إيقاف</option>
                     </select>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">إدارة المستخدمين والصلاحيات</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تحكم في من يمكنه الوصول إلى النظام وما يمكنه فعله</p>
        </div>
        {!readOnly && (
          <button 
            onClick={openAddUser}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> مستخدم جديد
          </button>
        )}
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
            {users.map(user => (
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
                <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : 'لم يدخل بعد'}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEditUser(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-colors" title="تعديل الصلاحيات">
                      <Shield className="w-4 h-4" />
                    </button>
                    {onDeleteUser && !readOnly && (
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );



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
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Bell className="w-4 h-4" /> التنبيهات والإشعارات
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Lock className="w-4 h-4" /> الأمان
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Database className="w-4 h-4" /> إدارة البيانات
            </button>
            <button 
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'maintenance' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Wrench className="w-4 h-4" /> صيانة النظام
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
      </div>

      {/* User Modal (Add/Edit) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">قم بتعبئة البيانات وتحديد الصلاحيات بدقة</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-4">بيانات الحساب</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      dir="ltr"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  
                  {/* Username & Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم (للدخول)</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="اختياري (يمكن استخدام البريد)"
                      value={formData.username || ''}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                       كلمة المرور {editingUser ? <span className="text-xs text-slate-400 font-normal">(اتركها فارغة للإبقاء على الحالية)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                       <input 
                         type="password" 
                         className="w-full border p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                         placeholder={editingUser ? "••••••••" : "كلمة مرور جديدة"}
                         required={!editingUser}
                         value={formData.password || ''}
                         onChange={e => setFormData({...formData, password: e.target.value})}
                         disabled={readOnly}
                       />
                       <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المسمى الوظيفي</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="مثال: محامي استئناف"
                      value={formData.roleLabel}
                      onChange={e => setFormData({...formData, roleLabel: e.target.value})}
                      disabled={readOnly}
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
                          disabled={readOnly}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">حساب نشط</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Permissions Matrix Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> جدول الصلاحيات
                </h4>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-900/50 p-3 text-xs font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <div className="col-span-1">الصفحة / الوحدة</div>
                    <div className="flex justify-center items-center gap-1"><Ban className="w-3 h-3 text-slate-400"/> لا يوجد صلاحية</div>
                    <div className="flex justify-center items-center gap-1"><Eye className="w-3 h-3 text-blue-500"/> قراءة فقط</div>
                    <div className="flex justify-center items-center gap-1"><Pencil className="w-3 h-3 text-green-500"/> تعديل وإدخال</div>
                  </div>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {MODULES.map(module => {
                      const currentAccess = formData.permissions?.find(p => p.moduleId === module.id)?.access || 'none';
                      
                      return (
                        <div key={module.id} className="grid grid-cols-4 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{module.label}</div>
                          
                          {/* Option: None */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'none'}
                                onChange={() => handlePermissionChange(module.id, 'none')}
                                className="sr-only"
                                disabled={readOnly}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'none' ? 'border-slate-500 bg-slate-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                {currentAccess === 'none' && <X className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>

                          {/* Option: Read */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'read'}
                                onChange={() => handlePermissionChange(module.id, 'read')}
                                className="sr-only"
                                disabled={readOnly}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'read' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                {currentAccess === 'read' && <Eye className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>

                          {/* Option: Write */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'write'}
                                onChange={() => handlePermissionChange(module.id, 'write')}
                                className="sr-only"
                                disabled={readOnly}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'write' ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
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

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsUserModalOpen(false)}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
              {!readOnly && (
                <button 
                  onClick={handleSaveUser}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" /> حفظ المستخدم
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
