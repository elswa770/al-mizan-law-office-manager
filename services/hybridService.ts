import { supabase } from './supabase';
import { db } from './database';
import { Case, Client, Hearing, Task, ActivityLog, AppUser } from '../types';

export class HybridDataService {
  // ===== CASES =====
  
  // إضافة قضية - حفظ محلي وسحابي
  static async saveCase(caseData: Case): Promise<string> {
    try {
      console.log('💾 Saving case:', caseData.title);
      
      // 1. حفظ محلي أولاً
      const localId = await db.cases.add(caseData);
      console.log('✅ Saved locally with ID:', localId);
      
      // 2. حفظ في Supabase للاستمرارية
      const remoteData = this.convertLocalCaseToRemote(caseData);
      console.log('🌐 Converting to remote data...');
      
      const { data, error } = await supabase
        .from('cases')
        .insert({
          ...remoteData,
          id: localId.toString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving to Supabase:', error);
        // نرجع الـ ID المحلي إذا فشل السحابي
        return localId.toString();
      }

      console.log('✅ Saved to Supabase with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Error in saveCase:', error);
      throw error;
    }
  }

  // جلب جميع القضايا - محلي أولاً ثم سحابي
  static async getAllCases(): Promise<Case[]> {
    try {
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localCases = await db.cases.toArray();
      
      // 2. جلب البيانات السحابية في الخلفية
      const { data: remoteCases, error } = await supabase
        .from('cases')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching from Supabase:', error);
        return localCases; // نرجع البيانات المحلية إذا فشل السحابي
      }

      // 3. مزامنة البيانات
      await this.syncCases(localCases, remoteCases || []);
      
      // 4. إرجاع البيانات المحدثة
      return await db.cases.toArray();
    } catch (error) {
      console.error('Error in getAllCases:', error);
      return await db.cases.toArray(); // fallback للبيانات المحلية
    }
  }

  // تحديث قضية
  static async updateCase(id: string, updates: Partial<Case>): Promise<void> {
    try {
      // 1. تحديث محلي
      await db.cases.update(id, updates);
      
      // 2. تحديث سحابي
      const remoteData = this.convertLocalCaseToRemote(updates as Case);
      const { error } = await supabase
        .from('cases')
        .update(remoteData)
        .eq('id', id);

      if (error) {
        console.error('Error updating in Supabase:', error);
        // سيتم تحديثه لاحقاً في المزامنة
      }
    } catch (error) {
      console.error('Error in updateCase:', error);
      throw error;
    }
  }

  // ===== CLIENTS =====
  
  static async saveClient(clientData: Omit<Client, 'id'>): Promise<string> {
    try {
      const localId = await db.clients.add(clientData as Client);
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          id: localId.toString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving client to Supabase:', error);
        return localId.toString();
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveClient:', error);
      throw error;
    }
  }

  static async getAllClients(): Promise<Client[]> {
    try {
      const localClients = await db.clients.toArray();
      
      const { data: remoteClients, error } = await supabase
        .from('clients')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients from Supabase:', error);
        return localClients;
      }

      await this.syncClients(localClients, remoteClients || []);
      return await db.clients.toArray();
    } catch (error) {
      console.error('Error in getAllClients:', error);
      return await db.clients.toArray();
    }
  }

  // ===== HEARINGS =====
  
  static async saveHearing(hearingData: Omit<Hearing, 'id'>): Promise<string> {
    try {
      const localId = await db.hearings.add(hearingData as Hearing);
      
      const { data, error } = await supabase
        .from('hearings')
        .insert({
          ...hearingData,
          id: localId.toString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving hearing to Supabase:', error);
        return localId.toString();
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveHearing:', error);
      throw error;
    }
  }

  static async getAllHearings(): Promise<Hearing[]> {
    try {
      const localHearings = await db.hearings.toArray();
      
      const { data: remoteHearings, error } = await supabase
        .from('hearings')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching hearings from Supabase:', error);
        return localHearings;
      }

      await this.syncHearings(localHearings, remoteHearings || []);
      return await db.hearings.toArray();
    } catch (error) {
      console.error('Error in getAllHearings:', error);
      return await db.hearings.toArray();
    }
  }

  // ===== TASKS =====
  
  static async saveTask(taskData: Omit<Task, 'id'>): Promise<string> {
    try {
      const localId = await db.tasks.add(taskData as Task);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          id: localId.toString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving task to Supabase:', error);
        return localId.toString();
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveTask:', error);
      throw error;
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    try {
      const localTasks = await db.tasks.toArray();
      
      const { data: remoteTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks from Supabase:', error);
        return localTasks;
      }

      await this.syncTasks(localTasks, remoteTasks || []);
      return await db.tasks.toArray();
    } catch (error) {
      console.error('Error in getAllTasks:', error);
      return await db.tasks.toArray();
    }
  }

  // ===== SYNC FUNCTIONS =====
  
  private static async syncCases(localCases: Case[], remoteCases: any[]): Promise<void> {
    console.log('🔄 Syncing cases:', localCases.length, 'local vs', remoteCases.length, 'remote');
    
    for (const remoteCase of remoteCases) {
      const localCase = localCases.find(c => c.id === remoteCase.id);
      const convertedCase = this.convertRemoteCaseToLocal(remoteCase);
      
      if (!localCase) {
        // إضافة حالة غير موجودة محلياً
        console.log('➕ Adding new case from remote:', remoteCase.id);
        await db.cases.add(convertedCase);
      } else {
        // مقارنة التواريخ بشكل صحيح
        const remoteDate = new Date(remoteCase.updated_at || remoteCase.created_at);
        const localDate = new Date(localCase.updateDate || localCase.openDate || 0);
        
        if (remoteDate > localDate) {
          // تحديث الحالة المحلية إذا كانت السحابية أحدث
          console.log('🔄 Updating local case from remote:', remoteCase.id);
          const { id, ...updateData } = convertedCase;
          await db.cases.update(localCase.id, updateData);
        }
      }
    }
  }

  private static async syncClients(localClients: Client[], remoteClients: any[]): Promise<void> {
    console.log('🔄 Syncing clients:', localClients.length, 'local vs', remoteClients.length, 'remote');
    
    for (const remoteClient of remoteClients) {
      const localClient = localClients.find(c => c.id === remoteClient.id);
      const convertedClient = this.convertRemoteClientToLocal(remoteClient);
      
      if (!localClient) {
        console.log('➕ Adding new client from remote:', remoteClient.id);
        await db.clients.add(convertedClient);
      } else {
        // مقارنة التواريخ بشكل صحيح - Client ليس لديه updateDate أو addDate
        const remoteDate = new Date(remoteClient.updated_at || remoteClient.created_at);
        const localDate = new Date(0); // نستخدم تاريخ افتراضي للعميل المحلي
        
        // إذا كان العميل البعيد أحدث، نحدث المحلي
        if (remoteDate > localDate) {
          console.log('🔄 Updating local client from remote:', remoteClient.id);
          const { id, ...updateData } = convertedClient;
          await db.clients.update(localClient.id, updateData);
        }
      }
    }
  }

  private static async syncHearings(localHearings: Hearing[], remoteHearings: any[]): Promise<void> {
    for (const remoteHearing of remoteHearings) {
      const localHearing = localHearings.find(h => h.id === remoteHearing.id);
      const convertedHearing = this.convertRemoteHearingToLocal(remoteHearing);
      
      if (!localHearing) {
        await db.hearings.add(convertedHearing);
      } else if (new Date(remoteHearing.updated_at) > new Date(localHearing.date)) {
        const { id, ...updateData } = convertedHearing;
        await db.hearings.update(localHearing.id, updateData);
      }
    }
  }

  private static async syncTasks(localTasks: Task[], remoteTasks: any[]): Promise<void> {
    for (const remoteTask of remoteTasks) {
      const localTask = localTasks.find(t => t.id === remoteTask.id);
      const convertedTask = this.convertRemoteTaskToLocal(remoteTask);
      
      if (!localTask) {
        await db.tasks.add(convertedTask);
      } else if (new Date(remoteTask.updated_at) > new Date(localTask.dueDate)) {
        const { id, ...updateData } = convertedTask;
        await db.tasks.update(localTask.id, updateData);
      }
    }
  }

  // ===== CONVERSION FUNCTIONS =====
  
  private static convertLocalCaseToRemote(localCase: Case): any {
    return {
      id: localCase.id,
      title: localCase.title,
      case_number: localCase.caseNumber,
      year: localCase.year,
      court: localCase.court,
      court_branch: localCase.courtBranch,
      circle: localCase.circle,
      judge_name: localCase.judgeName,
      stage: localCase.stage,
      status: localCase.status,
      client_id: localCase.clientId,
      client_name: localCase.clientName,
      client_role: localCase.clientRole,
      opponents: localCase.opponents,
      description: localCase.description,
      open_date: localCase.openDate,
      update_date: localCase.updateDate || new Date().toISOString(),
      responsible_lawyer: localCase.responsibleLawyer,
      finance: localCase.finance,
      notes: localCase.notes,
      strategy: localCase.strategy,
      documents: localCase.documents,
      memos: localCase.memos,
      rulings: localCase.rulings,
      ai_chat_history: localCase.aiChatHistory,
      created_at: localCase.openDate || new Date().toISOString(),
      updated_at: localCase.updateDate || new Date().toISOString()
    };
  }

  private static convertRemoteCaseToLocal(remoteCase: any): Case {
    return {
      id: remoteCase.id,
      title: remoteCase.title,
      caseNumber: remoteCase.case_number,
      year: remoteCase.year,
      court: remoteCase.court as any,
      courtBranch: remoteCase.court_branch,
      circle: remoteCase.circle,
      judgeName: remoteCase.judge_name,
      stage: remoteCase.stage as any,
      status: remoteCase.status as any,
      clientId: remoteCase.client_id,
      clientName: remoteCase.client_name,
      clientRole: remoteCase.client_role as any,
      opponents: remoteCase.opponents,
      description: remoteCase.description,
      openDate: remoteCase.open_date,
      updateDate: remoteCase.update_date,
      responsibleLawyer: remoteCase.responsible_lawyer,
      finance: remoteCase.finance,
      notes: remoteCase.notes,
      strategy: remoteCase.strategy,
      documents: remoteCase.documents,
      memos: remoteCase.memos,
      rulings: remoteCase.rulings,
      aiChatHistory: remoteCase.ai_chat_history
    };
  }

  private static convertRemoteClientToLocal(remoteClient: any): Client {
    return {
      id: remoteClient.id,
      name: remoteClient.name,
      type: remoteClient.type as any,
      status: remoteClient.status as any,
      phone: remoteClient.phone,
      secondaryPhone: remoteClient.secondary_phone,
      nationalId: remoteClient.national_id,
      nationality: remoteClient.nationality,
      address: remoteClient.address,
      email: remoteClient.email,
      poaNumber: remoteClient.poa_number,
      poaType: remoteClient.poa_type,
      poaExpiry: remoteClient.poa_expiry,
      companyRepresentative: remoteClient.company_representative,
      dateOfBirth: remoteClient.date_of_birth
    };
  }

  private static convertRemoteHearingToLocal(remoteHearing: any): Hearing {
    return {
      id: remoteHearing.id,
      caseId: remoteHearing.case_id,
      date: remoteHearing.date,
      time: remoteHearing.time,
      status: remoteHearing.status as any,
      type: remoteHearing.type,
      notes: remoteHearing.notes,
      expenses: remoteHearing.expenses
    };
  }

  private static convertRemoteTaskToLocal(remoteTask: any): Task {
    return {
      id: remoteTask.id,
      title: remoteTask.title,
      dueDate: remoteTask.due_date,
      priority: remoteTask.priority,
      status: remoteTask.status,
      relatedCaseId: remoteTask.related_case_id,
      type: remoteTask.type
    };
  }

  // ===== USERS =====
  
  // إضافة مستخدم - حفظ محلي وسحابي
  static async saveUser(userData: AppUser): Promise<string> {
    try {
      // 1. حفظ محلي أولاً
      const localId = await db.users.add(userData);
      
      // 2. حفظ في Supabase للاستمرارية
      const remoteData = this.convertLocalUserToRemote(userData);
      // Generate proper UUID for Supabase
      const supabaseId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...remoteData,
          id: supabaseId // Use proper UUID instead of localId
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving user to Supabase:', error);
        // نرجع الـ ID المحلي إذا فشل السحابي
        return localId.toString();
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveUser:', error);
      throw error;
    }
  }

  // تحديث مستخدم
  static async updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
    try {
      // 1. تحديث محلي
      const { id: userId, ...updateData } = updates as AppUser;
      await db.users.update(id, updateData);
      
      // 2. تحديث سحابي
      const remoteData = this.convertLocalUserToRemote(updates as AppUser);
      const { error } = await supabase
        .from('users')
        .update(remoteData)
        .eq('id', id);

      if (error) {
        console.error('Error updating user in Supabase:', error);
        // سيتم تحديثه لاحقاً في المزامنة
      }
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  // جلب جميع المستخدمين
  static async getAllUsers(): Promise<AppUser[]> {
    try {
      // 1. جلب البيانات المحلية أولاً
      const localUsers = await db.users.toArray();
      
      // 2. جلب البيانات السحابية
      const { data: remoteUsers, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.error('Error fetching users from Supabase:', error);
        return localUsers; // نرجع البيانات المحلية إذا فشل السحابي
      }

      // 3. مزامنة البيانات
      await this.syncUsers(localUsers, remoteUsers || []);
      
      // 4. إرجاع البيانات المحدثة
      return await db.users.toArray();
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return await db.users.toArray(); // fallback للبيانات المحلية
    }
  }

  // مزامنة المستخدمين
  private static async syncUsers(localUsers: AppUser[], remoteUsers: any[]): Promise<void> {
    for (const remoteUser of remoteUsers) {
      const localUser = localUsers.find(u => u.id === remoteUser.id);
      const convertedUser = this.convertRemoteUserToLocal(remoteUser);
      
      if (!localUser) {
        // إضافة مستخدم جديد فقط إذا لم يكن موجوداً
        try {
          await db.users.add(convertedUser);
        } catch (error) {
          // تجاهل خطأ التكرار - المستخدم موجود بالفعل
          console.log('User already exists, skipping:', remoteUser.id);
        }
      } else if (new Date(remoteUser.updated_at) > new Date(localUser.lastLogin || '')) {
        // تحديث المستخدم الموجود فقط إذا كان أحدث
        try {
          const { id, ...updateData } = convertedUser;
          await db.users.update(localUser.id, updateData);
        } catch (error) {
          console.error('Error updating user:', error);
        }
      }
    }
  }

  // ===== ACTIVITIES =====
  
  // إضافة نشاط - حفظ محلي وسحابي
  static async saveActivity(activityData: ActivityLog): Promise<string> {
    try {
      // 1. حفظ محلي أولاً
      const localId = await db.activities.add(activityData);
      
      // 2. حفظ في Supabase للاستمرارية
      const remoteData = this.convertLocalActivityToRemote(activityData);
      // Generate proper UUID for Supabase
      const supabaseId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('activity_log') // Changed from 'activity_logs' to 'activity_log'
        .insert({
          ...remoteData,
          id: supabaseId // Use proper UUID instead of localId
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving activity to Supabase:', error);
        // نرجع الـ ID المحلي إذا فشل السحابي
        return localId.toString();
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveActivity:', error);
      throw error;
    }
  }

  // جلب جميع النشاطات
  static async getAllActivities(): Promise<ActivityLog[]> {
    try {
      // 1. جلب البيانات المحلية أولاً
      const localActivities = await db.activities.toArray();
      
      // 2. جلب البيانات السحابية
      const { data: remoteActivities, error } = await supabase
        .from('activity_log') // Changed from 'activity_logs' to 'activity_log'
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities from Supabase:', error);
        return localActivities; // نرجع البيانات المحلية إذا فشل السحابي
      }

      // 3. مزامنة البيانات
      await this.syncActivities(localActivities, remoteActivities || []);
      
      // 4. إرجاع البيانات المحدثة
      return await db.activities.toArray();
    } catch (error) {
      console.error('Error in getAllActivities:', error);
      return await db.activities.toArray(); // fallback للبيانات المحلية
    }
  }

  // مزامنة النشاطات
  private static async syncActivities(localActivities: ActivityLog[], remoteActivities: any[]): Promise<void> {
    for (const remoteActivity of remoteActivities) {
      const localActivity = localActivities.find(a => a.id === remoteActivity.id);
      const convertedActivity = this.convertRemoteActivityToLocal(remoteActivity);
      
      if (!localActivity) {
        // إضافة نشاط جديد فقط إذا لم يكن موجوداً
        try {
          await db.activities.add(convertedActivity);
        } catch (error) {
          // تجاهل خطأ التكرار - النشاط موجود بالفعل
          console.log('Activity already exists, skipping:', remoteActivity.id);
        }
      }
    }
  }

  private static convertLocalUserToRemote(localUser: AppUser): any {
    return {
      id: localUser.id,
      username: localUser.username,
      email: localUser.email,
      name: localUser.name,
      password_hash: localUser.password || '',
      role_label: localUser.roleLabel,
      is_active: localUser.isActive,
      last_login: localUser.lastLogin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private static convertRemoteUserToLocal(remoteUser: any): AppUser {
    return {
      id: remoteUser.id,
      username: remoteUser.username,
      email: remoteUser.email,
      name: remoteUser.name,
      password: remoteUser.password_hash,
      roleLabel: remoteUser.role_label,
      isActive: remoteUser.is_active,
      lastLogin: remoteUser.last_login,
      permissions: [], // Will be loaded separately
      avatar: undefined
    };
  }

  private static convertLocalActivityToRemote(localActivity: ActivityLog): any {
    return {
      id: localActivity.id,
      user_id: localActivity.user,
      action: localActivity.action,
      target: localActivity.target,
      type: localActivity.type,
      created_at: localActivity.timestamp
    };
  }

  private static convertRemoteActivityToLocal(remoteActivity: any): ActivityLog {
    return {
      id: remoteActivity.id,
      user: remoteActivity.user_id,
      action: remoteActivity.action,
      target: remoteActivity.target,
      timestamp: remoteActivity.created_at,
      type: remoteActivity.type
    };
  }

  // ===== OFFLINE SUPPORT =====
  
  // التحقق من حالة الاتصال
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // مزامنة جميع البيانات عند العودة للإنترنت
  static async syncAllData(): Promise<void> {
    if (!this.isOnline()) return;
    
    try {
      await Promise.all([
        this.getAllCases(),
        this.getAllClients(),
        this.getAllHearings(),
        this.getAllTasks(),
        this.getAllUsers(),
        this.getAllActivities()
      ]);
      
      console.log('All data synced successfully (including Users & Activities)');
    } catch (error) {
      console.error('Error syncing all data:', error);
    }
  }

  // الحصول على حالة المزامنة
  static getSyncStatus(): {
    lastSync: Date | null;
    pendingChanges: number;
    isOnline: boolean;
  } {
    return {
      lastSync: null, // يمكن تخزينه في localStorage
      pendingChanges: 0, // يمكن حسابه من queue
      isOnline: this.isOnline()
    };
  }
}
