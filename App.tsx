
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Clients from './pages/Clients';
import Hearings from './pages/Hearings';
import Documents from './pages/Documents';
import Fees from './pages/Fees';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import CaseDetails from './pages/CaseDetails';
import ClientDetails from './pages/ClientDetails';
import Settings from './pages/Settings';
import Login from './pages/Login';
import LegalReferences from './pages/LegalReferences'; // Import New Page
import { db } from './services/database';
import { MigrationService } from './services/migrationService';
import { LocalStorageBackup } from './services/localStorageBackup';
import AuthService from './services/authService';
import { NewHybridDataService } from './services/newHybridService';
import { FirebaseDataService } from './services/firebaseService';
import { SupabaseAuthService } from './services/supabaseAuth';
import { supabase } from './services/supabase';
import { configureFirestore } from './services/firebase';
import { Hearing, Case, Client, HearingStatus, Task, ActivityLog, AppUser, PermissionLevel, LegalReference } from './types';
import { FileText, Wallet, BarChart3, Settings as SettingsIcon, ShieldAlert, CheckCircle } from 'lucide-react';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Lift state up to handle updates across the app
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [references, setReferences] = useState<LegalReference[]>([]); // New References State
  const [isLoading, setIsLoading] = useState(true);

  // --- Theme Effect ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);



// --- Database Initialization Effect ---
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Starting database initialization...');
        
        // Clear existing localStorage data for Firebase-only mode
        LocalStorageBackup.clearAllExistingData();
        console.log('🗑️ LocalStorage cleared - Using Firebase only mode');
        
        // Configure Firestore settings
        try {
          configureFirestore();
          console.log('✅ Firestore configured');
        } catch (error) {
          console.warn('⚠️ Firestore configuration failed:', error);
        }
        
        // Initialize local database for offline support
        await MigrationService.initializeDatabase();
        console.log('✅ Local database initialized');
        
        // Load local data FIRST as fallback
        const [localCases, localClients, localHearings, localTasks, localActivities, localUsers, localReferences] = await Promise.all([
          db.cases.toArray(),
          db.clients.toArray(),
          db.hearings.toArray(),
          db.tasks.toArray(),
          db.activities.toArray(),
          db.users.toArray(),
          db.references.toArray()
        ]);
        
        console.log('📊 Local data loaded:', {
          cases: localCases.length,
          clients: localClients.length,
          hearings: localHearings.length,
          tasks: localTasks.length,
          activities: localActivities.length,
          users: localUsers.length,
          references: localReferences.length
        });
        
        // Check LocalStorage backup as additional fallback
        let finalUsers = localUsers;
        if (localUsers.length === 0 && LocalStorageBackup.isAvailable()) {
          const backupUsers = LocalStorageBackup.loadUsers();
          if (backupUsers.length > 0) {
            console.log('💾 Loading users from LocalStorage backup:', backupUsers.length);
            finalUsers = backupUsers;
            
            // Restore to IndexedDB
            try {
              for (const user of backupUsers) {
                await db.users.add(user);
              }
              console.log('✅ Restored users from LocalStorage to IndexedDB');
            } catch (restoreError) {
              console.error('❌ Error restoring users to IndexedDB:', restoreError);
            }
          }
        }
        
        // Set local data immediately
        setCases(localCases);
        setClients(localClients);
        setHearings(localHearings);
        setTasks(localTasks);
        setActivities(localActivities);
        setUsers(finalUsers);
        setReferences(localReferences);
        
        console.log('🔄 Attempting to sync with Firebase...');
        
        // Try to sync with Firebase (this will update the state if successful)
        try {
          const [syncedCases, syncedClients, syncedHearings, syncedTasks, syncedActivities, syncedUsers] = await Promise.all([
            NewHybridDataService.getAllCases(),
            NewHybridDataService.getAllClients(),
            NewHybridDataService.getAllHearings(),
            NewHybridDataService.getAllTasks(),
            NewHybridDataService.getAllActivities(),
            NewHybridDataService.getAllUsers()
          ]);
          
          // Update all synced data if different
          if (syncedCases.length !== localCases.length || 
              JSON.stringify(syncedCases) !== JSON.stringify(localCases)) {
            console.log('🔄 Cases data changed after sync, updating...');
            setCases(syncedCases);
          }
          
          if (syncedClients.length !== localClients.length || 
              JSON.stringify(syncedClients) !== JSON.stringify(localClients)) {
            console.log('🔄 Clients data changed after sync, updating...');
            setClients(syncedClients);
          }
          
          if (syncedHearings.length !== localHearings.length || 
              JSON.stringify(syncedHearings) !== JSON.stringify(localHearings)) {
            console.log('🔄 Hearings data changed after sync, updating...');
            setHearings(syncedHearings);
          }
          
          if (syncedTasks.length !== localTasks.length || 
              JSON.stringify(syncedTasks) !== JSON.stringify(localTasks)) {
            console.log('🔄 Tasks data changed after sync, updating...');
            setTasks(syncedTasks);
          }
          
          if (syncedActivities.length !== localActivities.length || 
              JSON.stringify(syncedActivities) !== JSON.stringify(localActivities)) {
            console.log('🔄 Activities data changed after sync, updating...');
            setActivities(syncedActivities);
          }
          
          if (syncedUsers.length !== localUsers.length || 
              JSON.stringify(syncedUsers) !== JSON.stringify(localUsers)) {
            console.log('🔄 Users data changed after sync, updating...');
            setUsers(syncedUsers);
          }
          
          console.log('✅ Firebase sync completed successfully');
        } catch (syncError) {
          console.log('⚠️ Firebase sync failed, using local data only:', syncError);
        }
        
        console.log('🎉 Database initialization completed');
      } catch (error) {
        console.error('❌ Error initializing database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // --- Network Status Effect ---
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online - syncing data...');
      NewHybridDataService.syncAllData();
    };

    const handleOffline = () => {
      console.log('App is offline - using local data only');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Periodic Sync Effect ---
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (NewHybridDataService.isOnline()) {
        console.log('🔄 Starting periodic sync...');
        NewHybridDataService.syncAllData();
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes

    return () => clearInterval(syncInterval);
  }, []);

  // --- Initial Data Load Effect ---
  useEffect(() => {
    const loadInitialData = async () => {
      if (NewHybridDataService.isOnline()) {
        console.log('🚀 Loading initial data from remote...');
        try {
          await NewHybridDataService.syncAllData();
          
          // تحديث البيانات في الـ state بعد المزامنة
          const [cases, clients, hearings, tasks, users] = await Promise.all([
            NewHybridDataService.getAllCases(),
            NewHybridDataService.getAllClients(),
            NewHybridDataService.getAllHearings(),
            NewHybridDataService.getAllTasks(),
            NewHybridDataService.getAllUsers()
          ]);
          
          setCases(cases);
          setClients(clients);
          setHearings(hearings);
          setTasks(tasks);
          setUsers(users);
          
          console.log('✅ Initial data loaded successfully');
        } catch (error) {
          console.error('❌ Error loading initial data:', error);
        }
      }
    };
    
    loadInitialData();
  }, []);

  // --- Page State Management with Persistence ---
  
  // Load page state from localStorage on mount
  useEffect(() => {
    const loadPageState = () => {
      try {
        const savedPage = localStorage.getItem('law_office_current_page');
        const savedCaseId = localStorage.getItem('law_office_selected_case_id');
        const savedClientId = localStorage.getItem('law_office_selected_client_id');
        
        if (savedPage) {
          console.log('🔄 Restoring page state from localStorage:', savedPage);
          setCurrentPage(savedPage);
          
          if (savedCaseId && savedPage === 'case-details') {
            setSelectedCaseId(savedCaseId);
          }
          
          if (savedClientId && savedPage === 'client-details') {
            setSelectedClientId(savedClientId);
          }
        } else {
          // Only set dashboard if no saved page exists
          setCurrentPage('dashboard');
        }
      } catch (error) {
        console.error('❌ Error loading page state:', error);
        // Clear corrupted data and set default
        localStorage.removeItem('law_office_current_page');
        localStorage.removeItem('law_office_selected_case_id');
        localStorage.removeItem('law_office_selected_client_id');
        setCurrentPage('dashboard');
      }
    };
    
    loadPageState();
  }, []);

  // Save page state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentPage) {
        localStorage.setItem('law_office_current_page', currentPage);
        
        if (currentPage === 'case-details' && selectedCaseId) {
          localStorage.setItem('law_office_selected_case_id', selectedCaseId);
        } else {
          localStorage.removeItem('law_office_selected_case_id');
        }
        
        if (currentPage === 'client-details' && selectedClientId) {
          localStorage.setItem('law_office_selected_client_id', selectedClientId);
        } else {
          localStorage.removeItem('law_office_selected_client_id');
        }
      }
    } catch (error) {
      console.error('❌ Error saving page state:', error);
    }
  }, [currentPage, selectedCaseId, selectedClientId]);

  // --- Auth State Management with Persistence ---
  
  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const savedAuth = localStorage.getItem('law_office_auth_state');
        const savedUser = localStorage.getItem('law_office_current_user');
        
        if (savedAuth === 'true' && savedUser) {
          const user = JSON.parse(savedUser);
          console.log('🔄 Restoring auth state from localStorage:', user.name);
          setIsAuthenticated(true);
          setCurrentUser(user);
          
          // Verify with Supabase
          SupabaseAuthService.getCurrentSession().then(session => {
            if (!session) {
              console.log('⚠️ Supabase session expired, but keeping local auth');
              // Don't logout automatically, let user continue with local auth
            }
          });
        }
      } catch (error) {
        console.error('❌ Error loading auth state:', error);
        // Clear corrupted data
        localStorage.removeItem('law_office_auth_state');
        localStorage.removeItem('law_office_current_user');
      }
    };
    
    loadAuthState();
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('law_office_auth_state', isAuthenticated.toString());
      if (currentUser) {
        localStorage.setItem('law_office_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('law_office_current_user');
      }
    } catch (error) {
      console.error('❌ Error saving auth state:', error);
    }
  }, [isAuthenticated, currentUser]);

  // --- Auth Handlers ---
  const handleLogin = async (username: string, pass: string) => {
    try {
      // استخدام Local Authentication فقط للآن
      const user = users.find(u => 
        (u.username === username || u.email === username) && u.password === pass
      );

      if (user && user.isActive) {
        // Update last login
        db.users.update(user.id, { lastLogin: new Date().toISOString() });
        
        setCurrentUser({ ...user, lastLogin: new Date().toISOString() });
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    console.log('🔄 Logging out user...');
    
    // Clear Supabase session
    SupabaseAuthService.logout().catch(error => {
      console.log('⚠️ Error logging out from Supabase:', error);
    });
    
    // Clear local state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage(null);
    setSelectedCaseId(null);
    setSelectedClientId(null);
    
    // Clear all localStorage data
    localStorage.removeItem('law_office_auth_state');
    localStorage.removeItem('law_office_current_user');
    localStorage.removeItem('law_office_current_page');
    localStorage.removeItem('law_office_selected_case_id');
    localStorage.removeItem('law_office_selected_client_id');
    
    console.log('✅ User logged out successfully');
  };

  // --- Permission Helpers ---
  const hasAccess = (moduleId: string): boolean => {
    return AuthService.canRead(currentUser, moduleId);
  };

  const canWrite = (moduleId: string): boolean => {
    return AuthService.canWrite(currentUser, moduleId);
  };

  const isReadOnly = (moduleId: string): boolean => {
    return hasAccess(moduleId) && !canWrite(moduleId);
  };

  const isAdmin = (): boolean => {
    return AuthService.isAdmin(currentUser);
  };

  const canManageUsers = (): boolean => {
    return AuthService.canManageUsers(currentUser);
  };

  const canAccessSystemSettings = (): boolean => {
    return AuthService.canAccessSystemSettings(currentUser);
  };

  // --- App Logic ---

  const handleCaseClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentPage('case-details');
    // Refresh data when navigating to case details
    if (NewHybridDataService.isOnline()) {
      NewHybridDataService.syncAllData().then(() => {
        // Reload data into state after sync
        NewHybridDataService.getAllCases().then(cases => setCases(cases));
        NewHybridDataService.getAllClients().then(clients => setClients(clients));
        NewHybridDataService.getAllHearings().then(hearings => setHearings(hearings));
        NewHybridDataService.getAllTasks().then(tasks => setTasks(tasks));
      });
    }
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setCurrentPage('cases'); 
    // Refresh data when navigating to cases
    if (NewHybridDataService.isOnline()) {
      NewHybridDataService.syncAllData().then(() => {
        // Reload data into state after sync
        NewHybridDataService.getAllCases().then(cases => setCases(cases));
        NewHybridDataService.getAllClients().then(clients => setClients(clients));
        NewHybridDataService.getAllHearings().then(hearings => setHearings(hearings));
        NewHybridDataService.getAllTasks().then(tasks => setTasks(tasks));
      });
    }
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentPage('client-details');
    // Refresh data when navigating to client details
    if (NewHybridDataService.isOnline()) {
      NewHybridDataService.syncAllData().then(() => {
        // Reload data into state after sync
        NewHybridDataService.getAllCases().then(cases => setCases(cases));
        NewHybridDataService.getAllClients().then(clients => setClients(clients));
        NewHybridDataService.getAllHearings().then(hearings => setHearings(hearings));
        NewHybridDataService.getAllTasks().then(tasks => setTasks(tasks));
      });
    }
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentPage('clients');
    // Refresh data when navigating to clients
    if (NewHybridDataService.isOnline()) {
      NewHybridDataService.syncAllData().then(() => {
        // Reload data into state after sync
        NewHybridDataService.getAllCases().then(cases => setCases(cases));
        NewHybridDataService.getAllClients().then(clients => setClients(clients));
        NewHybridDataService.getAllHearings().then(hearings => setHearings(hearings));
        NewHybridDataService.getAllTasks().then(tasks => setTasks(tasks));
      });
    }
  };

  const handleAddCase = async (newCase: Case) => {
  try {
    console.log('🔄 Adding new case:', newCase.title);
    
    // Save using Hybrid Service (local + Firebase)
    const caseId = await NewHybridDataService.saveCase(newCase);
    const savedCase = { ...newCase, id: caseId };
    
    // Add to state only once
    setCases(prev => {
      // Check if case already exists to prevent duplicates
      if (prev.find(c => c.id === caseId)) {
        console.log('⚠️ Case already exists in state, skipping:', caseId);
        return prev;
      }
      console.log('✅ Adding case to state:', caseId);
      return [savedCase, ...prev];
    });
  } catch (error) {
    console.error('❌ Error adding case:', error);
    // Fallback to local only
    setCases(prev => {
      // Generate temporary ID for local case
      const tempId = `temp-${Date.now()}`;
      const tempCase = { ...newCase, id: tempId };
      if (prev.find(c => c.id === tempId)) {
        return prev;
      }
      return [tempCase, ...prev];
    });
  }
};

const handleUpdateCase = async (updatedCase: Case) => {
  try {
    // Update using Hybrid Service
    await NewHybridDataService.updateCase(updatedCase.id, updatedCase);
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  } catch (error) {
    console.error('Error updating case:', error);
    // Fallback to local only
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  }
};

const handleAddHearing = async (newHearing: Hearing) => {
  try {
    // Save using Hybrid Service
    const hearingId = await NewHybridDataService.saveHearing(newHearing);
    const savedHearing = { ...newHearing, id: hearingId };
    setHearings(prev => [savedHearing, ...prev]);
  } catch (error) {
    console.error('Error adding hearing:', error);
    // Fallback to local only
    setHearings(prev => [newHearing, ...prev]);
  }
};

  const handleUpdateHearing = (updatedHearing: Hearing) => {
    setHearings(prev => prev.map(h => h.id === updatedHearing.id ? updatedHearing : h));
  };

  // Client Handlers
  const handleAddClient = async (newClient: Client) => {
  try {
    console.log('🔄 Adding new client:', newClient.name);
    
    // Save using Hybrid Service
    const clientId = await NewHybridDataService.saveClient(newClient);
    const savedClient = { ...newClient, id: clientId };
    
    // Add to state only once
    setClients(prev => {
      // Check if client already exists to prevent duplicates
      if (prev.find(c => c.id === clientId)) {
        console.log('⚠️ Client already exists in state, skipping:', clientId);
        return prev;
      }
      console.log('✅ Adding client to state:', clientId);
      return [savedClient, ...prev];
    });
  } catch (error) {
    console.error('❌ Error adding client:', error);
    // Fallback to local only
    setClients(prev => {
      // Generate temporary ID for local client
      const tempId = `temp-${Date.now()}`;
      const tempClient = { ...newClient, id: tempId };
      if (prev.find(c => c.id === tempId)) {
        return prev;
      }
      return [tempClient, ...prev];
    });
  }
};

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      console.log('🔄 Starting to delete case:', caseId);
      
      // Check if case exists
      const caseToDelete = cases.find(c => c.id === caseId);
      if (!caseToDelete) {
        console.error('❌ Case not found:', caseId);
        return;
      }
      
      // Delete from Firebase
      await FirebaseDataService.deleteCase(caseId);
      console.log('✅ Case deleted from Firebase:', caseId);
      
      // Delete from local database
      await db.cases.delete(caseId);
      console.log('✅ Case deleted from local database:', caseId);
      
      // Update state
      setCases(prev => prev.filter(c => c.id !== caseId));
      setHearings(prev => prev.filter(h => h.caseId !== caseId));
      
      // Go back to cases list
      handleBackToCases();
      
      console.log('✅ Case deletion completed:', caseId);
    } catch (error) {
      console.error('❌ Error deleting case:', error);
      // Fallback: remove from state only
      setCases(prev => prev.filter(c => c.id !== caseId));
      setHearings(prev => prev.filter(h => h.caseId !== caseId));
      handleBackToCases();
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      console.log('🔄 Starting to delete client:', clientId);
      
      // التحقق من وجود قضايا مرتبطة بالموكل
      const clientCases = cases.filter(c => c.clientId === clientId);
      
      if (clientCases.length > 0) {
        // عرض رسالة تحذير مع تفاصيل القضايا المرتبطة
        const caseDetails = clientCases.map(c => `• ${c.title} (${c.caseNumber}/${c.year})`).join('\n');
        const confirmed = window.confirm(
          `⚠️ لا يمكن حذف هذا الموكل لأنه مرتبط بالقضايا التالية:\n\n${caseDetails}\n\n` +
          `عدد القضايا: ${clientCases.length}\n\n` +
          `يجب حذف القضايا أولاً أو نقلها إلى موكل آخر قبل حذف الموكل.\n\n` +
          `هل تريد عرض القضايا المرتبطة؟`
        );
        
        if (confirmed) {
          // الانتقال إلى صفحة القضايا مع فلترة للموكل
          setCurrentPage('cases');
        }
        return;
      }
      
      // تأكيد الحذف (فقط إذا لم يكن هناك قضايا مرتبطة)
      const confirmed = window.confirm('هل أنت متأكد من حذف هذا الموكل؟ لا يمكن التراجع عن هذا الإجراء.');
      if (!confirmed) return;
      
      // حذف باستخدام Hybrid Service
      await NewHybridDataService.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      console.log('✅ Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('حدث خطأ أثناء حذف الموكل. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  // --- Enhanced Error Boundary for User Operations ---
  const handleUserOperation = async (operation: string, operationFn: () => Promise<void>) => {
    try {
      console.log(`🔄 Starting user operation: ${operation}`);
      await operationFn();
      console.log(`✅ User operation completed: ${operation}`);
    } catch (error) {
      console.error(`❌ User operation failed: ${operation}`, error);
      
      // Check if it's an auth error - but DON'T auto-logout
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        console.log('🔐 Authentication error detected - NOT auto-logging out');
        // Show error to user but keep them logged in
        alert('خطأ في المصادقة. يرجى المحاولة مرة أخرى.');
        return;
      }
      
      // Check if it's a network error
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.log('🌐 Network error detected, keeping user logged in');
        alert('خطأ في الاتصال بالإنترنت. البيانات محفوظة محلياً.');
        return;
      }
      
      // Check if it's a Supabase error
      if (error.message?.includes('PGRST') || error.message?.includes('supabase')) {
        console.log('🗄️ Supabase error detected, keeping user logged in');
        alert('خطأ في مزامنة السحابة. البيانات محفوظة محلياً.');
        return;
      }
      
      console.log('⚠️ Unknown error, keeping user logged in');
      alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    }
  };

// User Handlers
  const handleAddUser = async (newUser: AppUser) => {
    try {
      console.log('🔄 Starting to save user:', newUser.name);
      
      // حفظ باستخدام Hybrid Service (محلي + Supabase)
      const userId = await NewHybridDataService.saveUser(newUser);
      const savedUser = { ...newUser, id: userId };
      
      console.log('✅ User saved to Hybrid Service:', savedUser);
      
      // التحقق من الحفظ في IndexedDB مباشرة
      const verifyUser = await db.users.get(userId);
      console.log('🔍 Verification - User in IndexedDB:', verifyUser);
      
      // حفظ في LocalStorage كـ backup
      const currentUsers = [...users, savedUser];
      LocalStorageBackup.saveUsers(currentUsers);
      console.log('💾 User saved to LocalStorage backup');
      
      setUsers(currentUsers);
      console.log('📊 Updated users state:', currentUsers.length, 'users');
      
      console.log('🎉 User saved successfully:', newUser.name);
    } catch (error) {
      console.error('❌ Error saving user:', error);
      
      // Fallback to IndexedDB only
      try {
        console.log('🔄 Trying fallback to IndexedDB only...');
        const localId = await db.users.add(newUser);
        const fallbackUser = { ...newUser, id: localId.toString() };
        
        // Save fallback to LocalStorage
        const fallbackUsers = [...users, fallbackUser];
        LocalStorageBackup.saveUsers(fallbackUsers);
        console.log('💾 Fallback user saved to LocalStorage');
        
        setUsers(fallbackUsers);
        console.log('✅ Fallback successful - User saved locally:', fallbackUser.name);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        // Final fallback - state only + LocalStorage
        const finalUsers = [...users, newUser];
        LocalStorageBackup.saveUsers(finalUsers);
        setUsers(finalUsers);
        console.log('⚠️ Final fallback - User saved to state and LocalStorage');
      }
    }
  };

  const handleUpdateUser = async (updatedUser: AppUser) => {
    try {
      // تحديث باستخدام Hybrid Service (محلي + Supabase)
      await NewHybridDataService.updateUser(updatedUser.id, updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      console.log('User updated successfully:', updatedUser.name);
    } catch (error) {
      console.error('Error updating user:', error);
      // Fallback to IndexedDB only
      const { id, ...updateData } = updatedUser;
      await db.users.update(id, updateData);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  };

  const handleDeleteUser = async (userId: string) => {
  try {
    console.log('🔄 Starting to delete user:', userId);
    
    // 1. Delete from IndexedDB
    await db.users.delete(userId);
    console.log('✅ User deleted from IndexedDB');
    
    // 2. Delete from Supabase (if online)
    if (NewHybridDataService.isOnline()) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
        
        if (error) {
          console.log('⚠️ Failed to delete from Supabase:', error);
        } else {
          console.log('✅ User deleted from Supabase');
        }
      } catch (deleteError) {
        console.log('⚠️ Supabase delete failed:', deleteError);
      }
    }
    
    // 3. Update state
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    
    // 4. Update LocalStorage backup
    LocalStorageBackup.saveUsers(updatedUsers);
    console.log('💾 LocalStorage backup updated');
    
    console.log('🎉 User deleted successfully from all systems');
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    // Fallback - state only
    const fallbackUsers = users.filter(u => u.id !== userId);
    setUsers(fallbackUsers);
    LocalStorageBackup.saveUsers(fallbackUsers);
    console.log('⚠️ Fallback - User deleted from state and LocalStorage only');
  }
};

  // References Handlers
  const handleAddReference = (newRef: LegalReference) => {
    setReferences(prev => [newRef, ...prev]);
  };

  // --- SMART NOTIFICATION SYSTEM ---
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notificationList: any[] = [];

    // Helper to parse dates strictly
    const parseDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    hearings.forEach(h => {
      if (!h.date) return;
      const hDate = parseDate(h.date);
      const diffTime = hDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const relatedCase = cases.find(c => c.id === h.caseId);
      const caseTitle = relatedCase?.title || 'قضية غير معروفة';

      // 1. Upcoming Hearings Alerts (7 days, 3 days, 1 day, Today)
      if (diffDays >= 0 && h.status !== HearingStatus.COMPLETED && h.status !== HearingStatus.CANCELLED) {
        let title = '';
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let message = '';

        if (diffDays === 0) {
          title = `جلسة اليوم: ${caseTitle}`;
          urgency = 'critical';
          message = 'يرجى مراجعة الملف والاستعداد للجلسة';
        } else if (diffDays === 1) {
          title = `جلسة غداً: ${caseTitle}`;
          urgency = 'high';
          message = 'تذكير: الجلسة غداً، هل تم تجهيز المستندات؟';
        } else if (diffDays === 3) {
          title = `جلسة بعد 3 أيام: ${caseTitle}`;
          urgency = 'medium';
          message = 'تذكير بالموعد القادم';
        } else if (diffDays === 7) {
          title = `جلسة بعد أسبوع: ${caseTitle}`;
          urgency = 'low';
          message = 'تنبيه مبكر';
        }

        if (title) {
          notificationList.push({
            id: `hearing-upcoming-${h.id}-${diffDays}`,
            date: h.date,
            time: h.time,
            title,
            message,
            caseNumber: relatedCase?.caseNumber,
            clientName: relatedCase?.clientName,
            court: relatedCase?.court,
            caseId: h.caseId,
            hearingId: h.id,
            type: 'hearing',
            urgency
          });
        }
      }

      // 2. Overdue Hearings (Past date, not completed/cancelled/postponed explicitly in a resolved state)
      // If status is SCHEDULED but date is past -> It's Overdue/Late Action
      if (diffDays < 0 && (h.status === HearingStatus.SCHEDULED || !h.status)) {
        notificationList.push({
          id: `hearing-overdue-${h.id}`,
          date: h.date,
          title: `تأخير إجراء: ${caseTitle}`,
          message: 'مر موعد الجلسة ولم يتم تحديث الحالة أو القرار',
          caseNumber: relatedCase?.caseNumber,
          clientName: relatedCase?.clientName,
          court: relatedCase?.court,
          caseId: h.caseId,
          hearingId: h.id,
          type: 'hearing',
          urgency: 'critical'
        });
      }

      // 3. Task Completion Alert (Past or Today, Requirements exist, Not Completed)
      if (diffDays <= 0 && h.requirements && !h.isCompleted && h.status !== HearingStatus.CANCELLED) {
         notificationList.push({
          id: `hearing-task-${h.id}`,
          date: h.date,
          title: `مطلوب تنفيذ: ${caseTitle}`,
          message: `المطلوب: ${h.requirements}`,
          caseNumber: relatedCase?.caseNumber,
          clientName: relatedCase?.clientName,
          caseId: h.caseId,
          hearingId: h.id,
          type: 'task',
          urgency: 'high'
        });
      }
    });

    // 4. POA Expiry Notifications
    const poaWarningDate = new Date(today);
    poaWarningDate.setDate(today.getDate() + 30); // Warn 30 days ahead

    clients.forEach(c => {
      if (!c.poaExpiry) return;
      const expiryDate = parseDate(c.poaExpiry);
      
      // Expired
      if (expiryDate < today) {
        notificationList.push({
          id: `poa-expired-${c.id}`,
          date: c.poaExpiry,
          title: `توكيل منتهي: ${c.name}`,
          message: 'يرجى تجديد التوكيل فوراً',
          clientName: c.name,
          clientId: c.id,
          type: 'poa_expiry',
          urgency: 'critical'
        });
      } 
      // Expiring Soon (within 30 days)
      else if (expiryDate <= poaWarningDate) {
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        notificationList.push({
          id: `poa-soon-${c.id}`,
          date: c.poaExpiry,
          title: `قرب انتهاء توكيل: ${c.name}`,
          message: `باقي ${daysLeft} يوم على الانتهاء`,
          clientName: c.name,
          clientId: c.id,
          type: 'poa_expiry',
          urgency: 'high'
        });
      }
    });

    // Sort: Critical first, then by date desc
    return notificationList.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency as keyof typeof urgencyOrder] !== urgencyOrder[b.urgency as keyof typeof urgencyOrder]) {
        return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [hearings, cases, clients]);

  const handleNotificationClick = (id: string, type: 'hearing' | 'poa_expiry' | 'task') => {
    if (type === 'poa_expiry') {
      setSelectedClientId(id);
      setCurrentPage('client-details');
    } else {
      // For hearings and tasks, the ID passed is the CASE ID (to navigate to case context)
      setSelectedCaseId(id); 
      setCurrentPage('case-details');
    }
  };

  const renderPage = () => {
    // If no page is set, show loading or default
    if (!currentPage) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      );
    }

    // Check general page permissions first
    // Note: 'case-details' and 'client-details' inherit permissions from 'cases' and 'clients' respectively
    let checkModuleId = currentPage;
    if (currentPage === 'case-details') checkModuleId = 'cases';
    if (currentPage === 'client-details') checkModuleId = 'clients';
    if (currentPage === 'billing') checkModuleId = 'fees'; // backward compatibility

    // Logic for 'Fees' page with dual permissions (Fees OR Expenses)
    if (currentPage === 'fees') {
       if (!hasAccess('fees') && !hasAccess('expenses')) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-100">عفواً، لا تملك صلاحية للوصول</h2>
              <button onClick={() => setCurrentPage('dashboard')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">العودة للرئيسية</button>
            </div>
          );
       }
    } else if (!hasAccess(checkModuleId)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-100">عفواً، لا تملك صلاحية للوصول</h2>
          <p className="text-slate-500 max-w-md dark:text-slate-400">
            حسابك لا يملك الصلاحيات اللازمة لعرض هذه الصفحة. يرجى مراجعة مدير النظام إذا كنت تعتقد أن هذا خطأ.
          </p>
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      );
    }

    // Is Read Only?
    const readOnly = isReadOnly(checkModuleId);

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            cases={cases} 
            clients={clients} 
            hearings={hearings} 
            tasks={tasks}
            activities={activities}
            onUpdateTask={!readOnly ? handleUpdateTask : undefined}
            onNavigate={setCurrentPage}
            onCaseClick={handleCaseClick}
            onUpdateCase={!readOnly ? handleUpdateCase : undefined}
            onUpdateClient={!readOnly ? handleUpdateClient : undefined}
            readOnly={readOnly}
          />
        );
      case 'cases':
        return (
          <Cases 
            cases={cases} 
            clients={clients}
            onCaseClick={handleCaseClick} 
            onAddCase={!readOnly ? handleAddCase : undefined}
            readOnly={readOnly}
          />
        );
      case 'case-details':
        if (!selectedCaseId) return <Cases cases={cases} clients={clients} onCaseClick={handleCaseClick} onAddCase={!readOnly ? handleAddCase : undefined} readOnly={readOnly} />;
        return (
          <CaseDetails 
            caseId={selectedCaseId} 
            cases={cases} 
            clients={clients} 
            hearings={hearings}
            onBack={handleBackToCases}
            onAddHearing={!readOnly ? handleAddHearing : undefined}
            onUpdateCase={!readOnly ? handleUpdateCase : undefined}
            onUpdateHearing={!readOnly ? handleUpdateHearing : undefined}
            onClientClick={handleClientClick}
            onDeleteCase={!readOnly ? handleDeleteCase : undefined}
            // case-details might need its own readOnly prop if granular, but here inheriting 'cases' module perm
          />
        );
      case 'clients':
        return (
          <Clients 
            clients={clients} 
            onClientClick={handleClientClick} 
            onAddClient={!readOnly ? handleAddClient : undefined}
            onUpdateClient={!readOnly ? handleUpdateClient : undefined}
            onDeleteClient={!readOnly ? handleDeleteClient : undefined}
            cases={cases}
            hearings={hearings}
            readOnly={readOnly}
          />
        );
      case 'client-details':
        if (!selectedClientId) return <Clients clients={clients} onClientClick={handleClientClick} cases={cases} hearings={hearings} readOnly={readOnly} />;
        return (
           <ClientDetails 
             clientId={selectedClientId}
             clients={clients}
             cases={cases}
             hearings={hearings}
             onBack={handleBackToClients}
             onCaseClick={handleCaseClick}
             onUpdateClient={!readOnly ? handleUpdateClient : undefined}
             onDeleteClient={!readOnly ? handleDeleteClient : undefined}
           />
        );
      case 'hearings':
        return (
          <Hearings 
            hearings={hearings} 
            cases={cases} 
            onCaseClick={handleCaseClick} 
            onUpdateHearing={!readOnly ? handleUpdateHearing : undefined}
            onAddHearing={!readOnly ? handleAddHearing : undefined}
          />
        );
      case 'documents':
        return (
          <Documents 
            cases={cases} 
            clients={clients} 
            onCaseClick={handleCaseClick}
            onClientClick={handleClientClick}
            onUpdateCase={!readOnly ? handleUpdateCase : undefined}
            onUpdateClient={!readOnly ? handleUpdateClient : undefined}
          />
        );
      case 'fees':
        const canViewIncome = hasAccess('fees');
        const canViewExpenses = hasAccess('expenses');
        return (
           <Fees 
             cases={cases} 
             clients={clients} 
             hearings={hearings} 
             onUpdateCase={!readOnly ? handleUpdateCase : undefined}
             canViewIncome={canViewIncome}
             canViewExpenses={canViewExpenses}
           />
        );
      case 'tasks':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">المهام</h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">صفحة المهام قيد التطوير</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">سيتم إضافة نظام إدارة المهام قريباً</p>
            </div>
          </div>
        );
      case 'reports':
        return (
           <Reports 
             cases={cases} 
             clients={clients} 
             hearings={hearings} 
             tasks={tasks}
           />
        );
      case 'references':
        return (
          <LegalReferences 
            references={references}
            onAddReference={!readOnly ? handleAddReference : undefined}
            readOnly={readOnly}
          />
        );
      case 'settings':
        return (
          <Settings 
            users={users}
            onAddUser={canManageUsers() ? handleAddUser : undefined}
            onUpdateUser={canManageUsers() ? handleUpdateUser : undefined}
            onDeleteUser={canManageUsers() ? handleDeleteUser : undefined}
            currentTheme={theme}
            onThemeChange={canAccessSystemSettings() ? setTheme : undefined}
          />
        );
      case 'billing': // Backward compatibility
        return (
           <Fees 
             cases={cases} 
             clients={clients} 
             hearings={hearings} 
             onUpdateCase={!readOnly ? handleUpdateCase : undefined}
             canViewIncome={hasAccess('fees')}
             canViewExpenses={hasAccess('expenses')}
           />
        );
      case 'ai-assistant':
        return (
          <AIAssistant 
            cases={cases}
            references={references} // Pass references for deep learning
            onUpdateCase={!readOnly ? handleUpdateCase : undefined}
          />
        );
      default:
        return <Dashboard cases={cases} clients={clients} hearings={hearings} tasks={tasks} activities={activities} />;
    }
  };

  // If not logged in, show Login Page
  if (!isAuthenticated) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل قاعدة البيانات...</p>
          </div>
        </div>
      );
    }
    return <Login onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activePage={currentPage} 
      onNavigate={(page) => {
        setCurrentPage(page);
        // Refresh data when navigating to any page
        if (NewHybridDataService.isOnline()) {
          NewHybridDataService.syncAllData().then(() => {
            // Reload data into state after sync
            NewHybridDataService.getAllCases().then(cases => setCases(cases));
            NewHybridDataService.getAllClients().then(clients => setClients(clients));
            NewHybridDataService.getAllHearings().then(hearings => setHearings(hearings));
            NewHybridDataService.getAllTasks().then(tasks => setTasks(tasks));
          });
        }
      }}
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
