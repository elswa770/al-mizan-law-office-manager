import { 
  db, 
  collections, 
  convertTimestamp, 
  convertToTimestamp,
  FirebaseCase,
  FirebaseClient,
  FirebaseHearing,
  FirebaseTask,
  FirebaseUser,
  FirebaseActivity
} from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { Case, Client, Hearing, Task, ActivityLog, AppUser } from '../types';

export class FirebaseDataService {
  // ===== CASES =====
  
  static async saveCase(caseData: Case): Promise<string> {
    try {
      console.log('💾 Saving case to Firebase:', caseData.title);
      
      // Convert undefined values to null for Firebase compatibility
      const cleanCaseData = {
        title: caseData.title,
        caseNumber: caseData.caseNumber,
        year: caseData.year,
        court: caseData.court,
        courtBranch: caseData.courtBranch || null,
        circle: caseData.circle || null,
        judgeName: caseData.judgeName || null,
        stage: caseData.stage || null,
        status: caseData.status,
        clientId: caseData.clientId,
        clientName: caseData.clientName,
        clientRole: caseData.clientRole || null,
        opponents: caseData.opponents || null,
        description: caseData.description || null,
        openDate: caseData.openDate,
        updateDate: caseData.updateDate || new Date().toISOString(),
        responsibleLawyer: caseData.responsibleLawyer || null,
        finance: caseData.finance ? {
          agreedFees: caseData.finance.agreedFees || 0,
          paidAmount: caseData.finance.paidAmount || 0,
          expenses: caseData.finance.expenses || 0,
          history: caseData.finance.history?.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            date: t.date,
            description: t.description || '',
            category: t.category
          })) || []
        } : null,
        notes: caseData.notes || null,
        strategy: caseData.strategy || null,
        documents: caseData.documents || null,
        memos: caseData.memos || null,
        rulings: caseData.rulings || null,
        aiChatHistory: caseData.aiChatHistory || null,
        createdAt: convertToTimestamp(caseData.openDate || new Date().toISOString()),
        updatedAt: convertToTimestamp(new Date().toISOString())
      };
      
      const docRef = await addDoc(collection(db, collections.cases), cleanCaseData);
      console.log('✅ Case saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving case to Firebase:', error);
      throw error;
    }
  }

  static async getAllCases(): Promise<Case[]> {
    try {
      console.log('📥 Fetching cases from Firebase...');
      
      const q = query(
        collection(db, collections.cases),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const cases: Case[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCase;
        const caseData: Case = {
          id: doc.id,
          title: data.title,
          caseNumber: data.caseNumber,
          year: data.year,
          court: data.court as any,
          courtBranch: data.courtBranch,
          circle: data.circle,
          judgeName: data.judgeName,
          stage: data.stage as any,
          status: data.status as any,
          clientId: data.clientId,
          clientName: data.clientName,
          clientRole: data.clientRole as any,
          opponents: data.opponents,
          description: data.description,
          openDate: data.openDate,
          updateDate: data.updateDate,
          responsibleLawyer: data.responsibleLawyer,
          finance: data.finance,
          notes: data.notes,
          strategy: data.strategy,
          documents: data.documents,
          memos: data.memos,
          rulings: data.rulings,
          aiChatHistory: data.aiChatHistory
        };
        cases.push(caseData);
      });
      
      console.log('✅ Fetched', cases.length, 'cases from Firebase');
      return cases;
    } catch (error) {
      console.error('❌ Error fetching cases from Firebase:', error);
      return [];
    }
  }

  static async updateCase(id: string, updates: Partial<Case>): Promise<void> {
    try {
      console.log('🔄 Updating case in Firebase:', id);
      
      // Convert undefined values to null for Firebase compatibility
      const cleanUpdateData: any = {
        ...updates,
        updatedAt: convertToTimestamp(new Date().toISOString())
      };
      
      // Convert undefined to null for specific fields
      if (updates.courtBranch !== undefined) cleanUpdateData.courtBranch = updates.courtBranch || null;
      if (updates.circle !== undefined) cleanUpdateData.circle = updates.circle || null;
      if (updates.judgeName !== undefined) cleanUpdateData.judgeName = updates.judgeName || null;
      if (updates.stage !== undefined) cleanUpdateData.stage = updates.stage || null;
      if (updates.clientRole !== undefined) cleanUpdateData.clientRole = updates.clientRole || null;
      if (updates.opponents !== undefined) cleanUpdateData.opponents = updates.opponents || null;
      if (updates.description !== undefined) cleanUpdateData.description = updates.description || null;
      if (updates.responsibleLawyer !== undefined) cleanUpdateData.responsibleLawyer = updates.responsibleLawyer || null;
      if (updates.notes !== undefined) cleanUpdateData.notes = updates.notes || null;
      if (updates.strategy !== undefined) cleanUpdateData.strategy = updates.strategy || null;
      if (updates.documents !== undefined) cleanUpdateData.documents = updates.documents || null;
      if (updates.memos !== undefined) cleanUpdateData.memos = updates.memos || null;
      if (updates.rulings !== undefined) cleanUpdateData.rulings = updates.rulings || null;
      if (updates.aiChatHistory !== undefined) cleanUpdateData.aiChatHistory = updates.aiChatHistory || null;
      
      await updateDoc(doc(db, collections.cases, id), cleanUpdateData);
      console.log('✅ Case updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating case in Firebase:', error);
      throw error;
    }
  }

  static async deleteCase(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting case from Firebase:', id);
      await deleteDoc(doc(db, collections.cases, id));
      console.log('✅ Case deleted from Firebase');
    } catch (error) {
      console.error('❌ Error deleting case from Firebase:', error);
      throw error;
    }
  }

  // ===== CLIENTS =====
  
  static async saveClient(clientData: Client): Promise<string> {
    try {
      console.log('💾 Saving client to Firebase:', clientData.name);
      
      const firebaseClient: Omit<FirebaseClient, 'id'> = {
        name: clientData.name,
        type: clientData.type,
        status: clientData.status,
        phone: clientData.phone,
        secondaryPhone: clientData.secondaryPhone || null,
        nationalId: clientData.nationalId || null,
        nationality: clientData.nationality || null,
        address: clientData.address || null,
        email: clientData.email || null,
        poaNumber: clientData.poaNumber || null,
        poaType: clientData.poaType || null,
        poaExpiry: clientData.poaExpiry || null,
        companyRepresentative: clientData.companyRepresentative || null,
        dateOfBirth: clientData.dateOfBirth || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, collections.clients), firebaseClient);
      console.log('✅ Client saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving client to Firebase:', error);
      throw error;
    }
  }

  static async getAllClients(): Promise<Client[]> {
    try {
      console.log('📥 Fetching clients from Firebase...');
      
      const q = query(
        collection(db, collections.clients),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const clients: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseClient;
        const clientData: Client = {
          id: doc.id,
          name: data.name,
          type: data.type as any,
          status: data.status as any,
          phone: data.phone,
          secondaryPhone: data.secondaryPhone,
          nationalId: data.nationalId,
          nationality: data.nationality,
          address: data.address,
          email: data.email,
          poaNumber: data.poaNumber,
          poaType: data.poaType,
          poaExpiry: data.poaExpiry,
          companyRepresentative: data.companyRepresentative,
          dateOfBirth: data.dateOfBirth
        };
        clients.push(clientData);
      });
      
      console.log('✅ Fetched', clients.length, 'clients from Firebase');
      return clients;
    } catch (error) {
      console.error('❌ Error fetching clients from Firebase:', error);
      return [];
    }
  }

  // ===== HEARINGS =====
  
  static async saveHearing(hearingData: Hearing): Promise<string> {
    try {
      console.log('💾 Saving hearing to Firebase:', hearingData.date);
      
      // Convert undefined values to null for Firebase compatibility
      const firebaseHearing: Omit<FirebaseHearing, 'id'> = {
        caseId: hearingData.caseId,
        date: hearingData.date,
        time: hearingData.time,
        status: hearingData.status,
        type: hearingData.type,
        location: hearingData.location || null,
        notes: hearingData.notes || null,
        expenses: hearingData.expenses || null,
        createdAt: convertToTimestamp(new Date().toISOString()),
        updatedAt: convertToTimestamp(new Date().toISOString())
      };
      
      const docRef = await addDoc(collection(db, collections.hearings), firebaseHearing);
      console.log('✅ Hearing saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving hearing to Firebase:', error);
      throw error;
    }
  }

  static async getAllHearings(): Promise<Hearing[]> {
    try {
      console.log('📥 Fetching hearings from Firebase...');
      
      const q = query(
        collection(db, collections.hearings),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const hearings: Hearing[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseHearing;
        const hearingData: Hearing = {
          id: doc.id,
          caseId: data.caseId,
          date: data.date,
          time: data.time,
          status: data.status as any,
          type: data.type,
          location: data.location,
          notes: data.notes,
          expenses: data.expenses
        };
        hearings.push(hearingData);
      });
      
      console.log('✅ Fetched', hearings.length, 'hearings from Firebase');
      return hearings;
    } catch (error) {
      console.error('❌ Error fetching hearings from Firebase:', error);
      return [];
    }
  }

  // ===== TASKS =====
  
  static async saveTask(taskData: Task): Promise<string> {
    try {
      console.log('💾 Saving task to Firebase:', taskData.title);
      
      const firebaseTask: Omit<FirebaseTask, 'id'> = {
        title: taskData.title,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: taskData.status,
        relatedCaseId: taskData.relatedCaseId,
        type: taskData.type,
        createdAt: convertToTimestamp(new Date().toISOString()),
        updatedAt: convertToTimestamp(new Date().toISOString())
      };
      
      const docRef = await addDoc(collection(db, collections.tasks), firebaseTask);
      console.log('✅ Task saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving task to Firebase:', error);
      throw error;
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    try {
      console.log('📥 Fetching tasks from Firebase...');
      
      const q = query(
        collection(db, collections.tasks),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseTask;
        const taskData: Task = {
          id: doc.id,
          title: data.title,
          dueDate: data.dueDate,
          priority: data.priority,
          status: data.status as any,
          relatedCaseId: data.relatedCaseId,
          type: data.type
        };
        tasks.push(taskData);
      });
      
      console.log('✅ Fetched', tasks.length, 'tasks from Firebase');
      return tasks;
    } catch (error) {
      console.error('❌ Error fetching tasks from Firebase:', error);
      return [];
    }
  }

  // ===== USERS =====
  
  static async saveUser(userData: AppUser): Promise<string> {
    try {
      console.log('💾 Saving user to Firebase:', userData.name);
      
      const firebaseUser: Omit<FirebaseUser, 'id'> = {
        username: userData.username,
        email: userData.email,
        name: userData.name,
        roleLabel: userData.roleLabel,
        isActive: userData.isActive,
        permissions: userData.permissions,
        lastLogin: userData.lastLogin ? convertToTimestamp(userData.lastLogin) : undefined,
        createdAt: convertToTimestamp(new Date().toISOString()),
        updatedAt: convertToTimestamp(new Date().toISOString())
      };
      
      const docRef = await addDoc(collection(db, collections.users), firebaseUser);
      console.log('✅ User saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving user to Firebase:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<AppUser[]> {
    try {
      console.log('📥 Fetching users from Firebase...');
      
      const q = query(
        collection(db, collections.users),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const users: AppUser[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseUser;
        const userData: AppUser = {
          id: doc.id,
          username: data.username,
          email: data.email,
          name: data.name,
          roleLabel: data.roleLabel,
          isActive: data.isActive,
          permissions: data.permissions,
          lastLogin: data.lastLogin ? convertTimestamp(data.lastLogin) : undefined
        };
        users.push(userData);
      });
      
      console.log('✅ Fetched', users.length, 'users from Firebase');
      return users;
    } catch (error) {
      console.error('❌ Error fetching users from Firebase:', error);
      return [];
    }
  }

  // ===== ACTIVITIES =====
  
  static async saveActivity(activityData: ActivityLog): Promise<string> {
    try {
      console.log('💾 Saving activity to Firebase:', activityData.action);
      
      const firebaseActivity: Omit<FirebaseActivity, 'id'> = {
        action: activityData.action,
        target: activityData.target,
        user: activityData.user,
        timestamp: activityData.timestamp,
        type: activityData.type,
        details: activityData.details,
        createdAt: convertToTimestamp(new Date().toISOString())
      };
      
      const docRef = await addDoc(collection(db, collections.activities), firebaseActivity);
      console.log('✅ Activity saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving activity to Firebase:', error);
      throw error;
    }
  }

  static async getAllActivities(): Promise<ActivityLog[]> {
    try {
      console.log('📥 Fetching activities from Firebase...');
      
      const q = query(
        collection(db, collections.activities),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const activities: ActivityLog[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseActivity;
        const activityData: ActivityLog = {
          id: doc.id,
          action: data.action,
          target: data.target,
          user: data.user,
          timestamp: data.timestamp,
          type: data.type,
          details: data.details
        };
        activities.push(activityData);
      });
      
      console.log('✅ Fetched', activities.length, 'activities from Firebase');
      return activities;
    } catch (error) {
      console.error('❌ Error fetching activities from Firebase:', error);
      return [];
    }
  }

  // ===== UPDATE FUNCTIONS =====
  
  static async updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
    try {
      console.log('💾 Updating user in Firebase:', id);
      
      const userRef = doc(db, collections.users, id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(userRef, updateData);
      console.log('✅ User updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating user in Firebase:', error);
      throw error;
    }
  }

  static async deleteClient(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting client from Firebase:', id);
      await deleteDoc(doc(db, collections.clients, id));
      console.log('✅ Client deleted from Firebase');
    } catch (error) {
      console.error('❌ Error deleting client from Firebase:', error);
      throw error;
    }
  }
}

export { convertToTimestamp };
