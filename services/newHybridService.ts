import { db } from './database';
import { Case, Client, Hearing, Task, ActivityLog, AppUser } from '../types';
import { FirebaseDataService } from './firebaseService';
import { convertToTimestamp } from './firebaseService';

export class NewHybridDataService {
  // ===== CASES =====
  
  static async saveCase(caseData: Case): Promise<string> {
    try {
      console.log('💾 Saving case (Firebase only):', caseData.title);
      
      // حفظ في Firebase فقط
      const firebaseId = await FirebaseDataService.saveCase(caseData);
      console.log('✅ Saved to Firebase with ID:', firebaseId);
      
      return firebaseId;
    } catch (error) {
      console.error('❌ Error in saveCase:', error);
      throw error;
    }
  }

  static async getAllCases(): Promise<Case[]> {
    try {
      console.log('📥 Getting all cases (Hybrid)...');
      
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localCases = await db.cases.toArray();
      console.log('📊 Local cases:', localCases.length);
      
      // 2. جلب البيانات من Firebase في الخلفية
      const firebaseCases = await FirebaseDataService.getAllCases();
      console.log('📊 Firebase cases:', firebaseCases.length);
      
      // 3. دمج البيانات
      const mergedCases = this.mergeCases(localCases, firebaseCases);
      
      // 4. تحديث البيانات المحلية إذا لزم الأمر
      await this.updateLocalCases(localCases, firebaseCases);
      
      console.log('✅ Total merged cases:', mergedCases.length);
      return mergedCases;
    } catch (error) {
      console.error('❌ Error in getAllCases:', error);
      return [];
    }
  }

  private static mergeCases(localCases: Case[], firebaseCases: Case[]): Case[] {
    const caseMap = new Map<string, Case>();
    
    // إضافة الحالات المحلية أولاً
    localCases.forEach(case_ => {
      caseMap.set(case_.id, case_);
    });
    
    // إضافة الحالات من Firebase (بدون استبدال الحالات الموجودة)
    firebaseCases.forEach(firebaseCase => {
      const localCase = caseMap.get(firebaseCase.id);
      if (!localCase) {
        // إضافة فقط إذا لم تكن موجودة محلياً
        caseMap.set(firebaseCase.id, firebaseCase);
        console.log('➕ Adding Firebase case to merge:', firebaseCase.id);
      } else {
        console.log('⚠️ Case already exists locally, keeping local version:', firebaseCase.id);
      }
    });
    
    return Array.from(caseMap.values());
  }

  private static async updateLocalCases(localCases: Case[], firebaseCases: Case[]): Promise<void> {
    for (const firebaseCase of firebaseCases) {
      const localCase = localCases.find(c => c.id === firebaseCase.id);
      
      if (!localCase) {
        // إضافة حالة جديدة محلياً مع التحقق من التكرار
        try {
          await db.cases.add(firebaseCase);
          console.log('➕ Added new case locally:', firebaseCase.id);
        } catch (error: any) {
          if (error.name === 'ConstraintError') {
            console.log('⚠️ Case already exists locally, skipping:', firebaseCase.id);
            // تحديث الحالة الموجودة بدلاً من الإضافة
            const { id, ...updateData } = firebaseCase;
            await db.cases.update(id, updateData);
            console.log('🔄 Updated existing case locally:', firebaseCase.id);
          } else {
            throw error;
          }
        }
      } else if (this.isFirebaseNewer(firebaseCase, localCase)) {
        // تحديث حالة موجودة محلياً
        try {
          const { id, ...updateData } = firebaseCase;
          await db.cases.update(id, updateData);
          console.log('🔄 Updated case locally:', firebaseCase.id);
        } catch (error: any) {
          console.error('❌ Error updating case locally:', error);
        }
      }
    }
  }

  private static isFirebaseNewer(firebaseCase: Case, localCase: Case): boolean {
    const firebaseDate = new Date(firebaseCase.updateDate || firebaseCase.openDate || 0);
    const localDate = new Date(localCase.updateDate || localCase.openDate || 0);
    return firebaseDate > localDate;
  }

  // ===== CLIENTS =====
  
  static async saveClient(clientData: Client): Promise<string> {
    try {
      console.log('💾 Saving client (Firebase only):', clientData.name);
      
      // حفظ في Firebase فقط
      const firebaseId = await FirebaseDataService.saveClient(clientData);
      console.log('✅ Saved to Firebase with ID:', firebaseId);
      
      return firebaseId;
    } catch (error) {
      console.error('❌ Error in saveClient:', error);
      throw error;
    }
  }

  static async getAllClients(): Promise<Client[]> {
    try {
      console.log('📥 Getting all clients (Hybrid)...');
      
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localClients = await db.clients.toArray();
      console.log('📊 Local clients:', localClients.length);
      
      // 2. جلب البيانات من Firebase في الخلفية
      const firebaseClients = await FirebaseDataService.getAllClients();
      console.log('📊 Firebase clients:', firebaseClients.length);
      
      // 3. دمج البيانات
      const mergedClients = this.mergeClients(localClients, firebaseClients);
      
      // 4. تحديث البيانات المحلية إذا لزم الأمر
      await this.updateLocalClients(localClients, firebaseClients);
      
      console.log('✅ Total merged clients:', mergedClients.length);
      return mergedClients;
    } catch (error) {
      console.error('❌ Error in getAllClients:', error);
      return [];
    }
  }

  private static mergeClients(localClients: Client[], firebaseClients: Client[]): Client[] {
    const clientMap = new Map<string, Client>();
    
    // إضافة العملاء المحليين أولاً
    localClients.forEach(client => {
      clientMap.set(client.id, client);
    });
    
    // إضافة العملاء من Firebase (بدون استبدال العملاء الموجودين)
    firebaseClients.forEach(firebaseClient => {
      const localClient = clientMap.get(firebaseClient.id);
      if (!localClient) {
        // إضافة فقط إذا لم يكن موجوداً محلياً
        clientMap.set(firebaseClient.id, firebaseClient);
        console.log('➕ Adding Firebase client to merge:', firebaseClient.id);
      } else {
        console.log('⚠️ Client already exists locally, keeping local version:', firebaseClient.id);
      }
    });
    
    return Array.from(clientMap.values());
  }

  private static async updateLocalClients(localClients: Client[], firebaseClients: Client[]): Promise<void> {
    for (const firebaseClient of firebaseClients) {
      const localClient = localClients.find(c => c.id === firebaseClient.id);
      
      if (!localClient) {
        // إضافة عميل جديد محلياً
        await db.clients.add(firebaseClient);
        console.log('➕ Added new client locally:', firebaseClient.id);
      }
    }
  }

  // ===== HEARINGS =====
  
  static async saveHearing(hearingData: Hearing): Promise<string> {
    try {
      console.log('💾 Saving hearing (Hybrid):', hearingData.date);
      
      // 1. حفظ محلي أولاً
      const localId = await db.hearings.add(hearingData);
      console.log('✅ Saved locally with ID:', localId);
      
      // 2. حفظ في Firebase مع معالجة undefined
      const firebaseHearingData = {
        id: hearingData.id,
        caseId: hearingData.caseId,
        date: hearingData.date,
        time: hearingData.time,
        status: hearingData.status,
        type: hearingData.type,
        location: hearingData.location || null,  // ✅ تحويل undefined إلى null
        notes: hearingData.notes || null,        // ✅ تحويل undefined إلى null
        expenses: hearingData.expenses || null,      // ✅ تحويل undefined إلى null
        createdAt: convertToTimestamp(new Date().toISOString()),
        updatedAt: convertToTimestamp(new Date().toISOString())
      };
      
      const firebaseId = await FirebaseDataService.saveHearing(firebaseHearingData);
      console.log('✅ Saved to Firebase with ID:', firebaseId);
      
      return firebaseId;
    } catch (error) {
      console.error('❌ Error in saveHearing:', error);
      throw error;
    }
  }

  static async getAllHearings(): Promise<Hearing[]> {
    try {
      console.log('📥 Getting all hearings (Hybrid)...');
      
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localHearings = await db.hearings.toArray();
      console.log('📊 Local hearings:', localHearings.length);
      
      // 2. جلب البيانات من Firebase في الخلفية
      const firebaseHearings = await FirebaseDataService.getAllHearings();
      console.log('📊 Firebase hearings:', firebaseHearings.length);
      
      // 3. دمج البيانات
      const mergedHearings = this.mergeHearings(localHearings, firebaseHearings);
      
      // 4. تحديث البيانات المحلية إذا لزم الأمر
      await this.updateLocalHearings(localHearings, firebaseHearings);
      
      console.log('✅ Total merged hearings:', mergedHearings.length);
      return mergedHearings;
    } catch (error) {
      console.error('❌ Error in getAllHearings:', error);
      return [];
    }
  }

  private static mergeHearings(localHearings: Hearing[], firebaseHearings: Hearing[]): Hearing[] {
    const hearingMap = new Map<string, Hearing>();
    
    // إضافة الجلسات المحلية
    localHearings.forEach(hearing => {
      hearingMap.set(hearing.id, hearing);
    });
    
    // إضافة/تحديث الجلسات من Firebase
    firebaseHearings.forEach(firebaseHearing => {
      const localHearing = hearingMap.get(firebaseHearing.id);
      if (!localHearing) {
        hearingMap.set(firebaseHearing.id, firebaseHearing);
      }
    });
    
    return Array.from(hearingMap.values());
  }

  private static async updateLocalHearings(localHearings: Hearing[], firebaseHearings: Hearing[]): Promise<void> {
    for (const firebaseHearing of firebaseHearings) {
      const localHearing = localHearings.find(h => h.id === firebaseHearing.id);
      
      if (!localHearing) {
        // إضافة جلسة جديدة محلياً
        await db.hearings.add(firebaseHearing);
        console.log('➕ Added new hearing locally:', firebaseHearing.id);
      }
    }
  }

  // ===== TASKS =====
  
  static async saveTask(taskData: Task): Promise<string> {
    try {
      console.log('💾 Saving task (Hybrid):', taskData.title);
      
      // 1. حفظ محلي أولاً
      const localId = await db.tasks.add(taskData);
      console.log('✅ Saved locally with ID:', localId);
      
      // 2. حفظ في Firebase
      const firebaseId = await FirebaseDataService.saveTask(taskData);
      console.log('✅ Saved to Firebase with ID:', firebaseId);
      
      return firebaseId;
    } catch (error) {
      console.error('❌ Error in saveTask:', error);
      throw error;
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    try {
      console.log('📥 Getting all tasks (Hybrid)...');
      
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localTasks = await db.tasks.toArray();
      console.log('📊 Local tasks:', localTasks.length);
      
      // 2. جلب البيانات من Firebase في الخلفية
      const firebaseTasks = await FirebaseDataService.getAllTasks();
      console.log('📊 Firebase tasks:', firebaseTasks.length);
      
      // 3. دمج البيانات
      const mergedTasks = this.mergeTasks(localTasks, firebaseTasks);
      
      // 4. تحديث البيانات المحلية إذا لزم الأمر
      await this.updateLocalTasks(localTasks, firebaseTasks);
      
      console.log('✅ Total merged tasks:', mergedTasks.length);
      return mergedTasks;
    } catch (error) {
      console.error('❌ Error in getAllTasks:', error);
      return [];
    }
  }

  private static mergeTasks(localTasks: Task[], firebaseTasks: Task[]): Task[] {
    const taskMap = new Map<string, Task>();
    
    // إضافة المهام المحلية
    localTasks.forEach(task => {
      taskMap.set(task.id, task);
    });
    
    // إضافة/تحديث المهام من Firebase
    firebaseTasks.forEach(firebaseTask => {
      const localTask = taskMap.get(firebaseTask.id);
      if (!localTask) {
        taskMap.set(firebaseTask.id, firebaseTask);
      }
    });
    
    return Array.from(taskMap.values());
  }

  private static async updateLocalTasks(localTasks: Task[], firebaseTasks: Task[]): Promise<void> {
    for (const firebaseTask of firebaseTasks) {
      const localTask = localTasks.find(t => t.id === firebaseTask.id);
      
      if (!localTask) {
        // إضافة مهمة جديدة محلياً
        await db.tasks.add(firebaseTask);
        console.log('➕ Added new task locally:', firebaseTask.id);
      }
    }
  }

  // ===== USERS =====
  
  static async saveUser(userData: AppUser): Promise<string> {
    try {
      console.log('💾 Saving user (Hybrid):', userData.name);
      
      // 1. حفظ محلي أولاً
      const localId = await db.users.add(userData);
      console.log('✅ Saved locally with ID:', localId);
      
      // 2. حفظ في Firebase
      const firebaseId = await FirebaseDataService.saveUser(userData);
      console.log('✅ Saved to Firebase with ID:', firebaseId);
      
      return firebaseId;
    } catch (error) {
      console.error('❌ Error in saveUser:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<AppUser[]> {
    try {
      console.log('📥 Getting all users (Hybrid)...');
      
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localUsers = await db.users.toArray();
      console.log('📊 Local users:', localUsers.length);
      
      // 2. جلب البيانات من Firebase في الخلفية
      const firebaseUsers = await FirebaseDataService.getAllUsers();
      console.log('📊 Firebase users:', firebaseUsers.length);
      
      // 3. دمج البيانات
      const mergedUsers = this.mergeUsers(localUsers, firebaseUsers);
      
      // 4. تحديث البيانات المحلية إذا لزم الأمر
      await this.updateLocalUsers(localUsers, firebaseUsers);
      
      console.log('✅ Total merged users:', mergedUsers.length);
      return mergedUsers;
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      return [];
    }
  }

  private static mergeUsers(localUsers: AppUser[], firebaseUsers: AppUser[]): AppUser[] {
    const userMap = new Map<string, AppUser>();
    
    // إضافة المستخدمين المحليين
    localUsers.forEach(user => {
      userMap.set(user.id, user);
    });
    
    // إضافة/تحديث المستخدمين من Firebase
    firebaseUsers.forEach(firebaseUser => {
      const localUser = userMap.get(firebaseUser.id);
      if (!localUser) {
        userMap.set(firebaseUser.id, firebaseUser);
      }
    });
    
    return Array.from(userMap.values());
  }

  private static async updateLocalUsers(localUsers: AppUser[], firebaseUsers: AppUser[]): Promise<void> {
    for (const firebaseUser of firebaseUsers) {
      const localUser = localUsers.find(u => u.id === firebaseUser.id);
      
      if (!localUser) {
        // إضافة مستخدم جديد محلياً
        await db.users.add(firebaseUser);
        console.log('➕ Added new user locally:', firebaseUser.id);
      }
    }
  }

  // ===== ACTIVITIES =====
  
  static async saveActivity(activityData: ActivityLog): Promise<string> {
    try {
      console.log('💾 Saving activity (Hybrid):', activityData.action);
      
      // 1. حفظ محلي أولاً
      const localId = await db.activities.add(activityData);
      console.log('✅ Saved locally with ID:', localId);
      
      // 2. حفظ في Firebase
      const firebaseId = await FirebaseDataService.saveActivity(activityData);
      console.log('✅ Saved to Firebase with ID:', firebaseId);
      
      return firebaseId;
    } catch (error) {
      console.error('❌ Error in saveActivity:', error);
      throw error;
    }
  }

  static async getAllActivities(): Promise<ActivityLog[]> {
    try {
      console.log('📥 Getting all activities (Hybrid)...');
      
      // 1. جلب البيانات المحلية أولاً (للسرعة)
      const localActivities = await db.activities.toArray();
      console.log('📊 Local activities:', localActivities.length);
      
      // 2. جلب البيانات من Firebase في الخلفية
      const firebaseActivities = await FirebaseDataService.getAllActivities();
      console.log('📊 Firebase activities:', firebaseActivities.length);
      
      // 3. دمج البيانات
      const mergedActivities = this.mergeActivities(localActivities, firebaseActivities);
      
      // 4. تحديث البيانات المحلية إذا لزم الأمر
      await this.updateLocalActivities(localActivities, firebaseActivities);
      
      console.log('✅ Total merged activities:', mergedActivities.length);
      return mergedActivities;
    } catch (error) {
      console.error('❌ Error in getAllActivities:', error);
      return [];
    }
  }

  private static mergeActivities(localActivities: ActivityLog[], firebaseActivities: ActivityLog[]): ActivityLog[] {
    const activityMap = new Map<string, ActivityLog>();
    
    // إضافة الأنشطة المحلية
    localActivities.forEach(activity => {
      activityMap.set(activity.id, activity);
    });
    
    // إضافة/تحديث الأنشطة من Firebase
    firebaseActivities.forEach(firebaseActivity => {
      const localActivity = activityMap.get(firebaseActivity.id);
      if (!localActivity) {
        activityMap.set(firebaseActivity.id, firebaseActivity);
      }
    });
    
    return Array.from(activityMap.values());
  }

  private static async updateLocalActivities(localActivities: ActivityLog[], firebaseActivities: ActivityLog[]): Promise<void> {
    for (const firebaseActivity of firebaseActivities) {
      const localActivity = localActivities.find(a => a.id === firebaseActivity.id);
      
      if (!localActivity) {
        // إضافة نشاط جديد محلياً
        await db.activities.add(firebaseActivity);
        console.log('➕ Added new activity locally:', firebaseActivity.id);
      }
    }
  }

  // ===== UPDATE FUNCTIONS =====
  
  static async updateCase(id: string, updates: Partial<Case>): Promise<void> {
    try {
      console.log('🔄 Updating case (Hybrid):', id);
      
      // 1. تحديث محلي
      await db.cases.update(id, updates);
      console.log('✅ Updated case locally');
      
      // 2. تحديث في Firebase
      await FirebaseDataService.updateCase(id, updates);
      console.log('✅ Updated case in Firebase');
    } catch (error) {
      console.error('❌ Error updating case:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
    try {
      console.log('🔄 Updating user (Hybrid):', id);
      
      // 1. تحديث محلي
      await db.users.update(id, updates);
      console.log('✅ Updated user locally');
      
      // 2. تحديث في Firebase
      await FirebaseDataService.updateUser(id, updates);
      console.log('✅ Updated user in Firebase');
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  static async deleteClient(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting client (Hybrid):', id);
      
      // 1. حذف محلي
      await db.clients.delete(id);
      console.log('✅ Deleted client locally');
      
      // 2. حذف من Firebase
      await FirebaseDataService.deleteClient(id);
      console.log('✅ Deleted client from Firebase');
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      throw error;
    }
  }

  // ===== SYNC ALL DATA =====
  
  static async syncAllData(): Promise<void> {
    try {
      console.log('🔄 Starting full Firebase sync...');
      
      await Promise.all([
        this.getAllCases(),
        this.getAllClients(),
        this.getAllHearings(),
        this.getAllTasks(),
        this.getAllUsers(),
        this.getAllActivities()
      ]);
      
      console.log('✅ All data synced successfully with Firebase!');
    } catch (error) {
      console.error('❌ Error syncing all data:', error);
    }
  }

  // ===== UTILITY FUNCTIONS =====
  
  static isOnline(): boolean {
    return navigator.onLine;
  }

  static getSyncStatus(): {
    lastSync: Date | null;
    pendingChanges: number;
    isOnline: boolean;
  } {
    return {
      lastSync: new Date(),
      pendingChanges: 0,
      isOnline: this.isOnline()
    };
  }
}
