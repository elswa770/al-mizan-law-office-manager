import Dexie, { Table } from 'dexie';
import { Case, CaseStatus, CourtType, Client, ClientRole, Hearing, HearingStatus, ClientType, ClientStatus, Task, ActivityLog, AppUser, LegalReference, UserPermission, PermissionLevel, ReferenceType, LawBranch } from '../types';

// Main database class
export class LawOfficeDatabase extends Dexie {
  // Tables
  cases!: Table<Case>;
  clients!: Table<Client>;
  hearings!: Table<Hearing>;
  tasks!: Table<Task>;
  activities!: Table<ActivityLog>;
  users!: Table<AppUser>;
  references!: Table<LegalReference>;

  constructor() {
    super('LawOfficeDatabase');
    
    // Define database schema - STABLE VERSION
    this.version(2).stores({
      cases: 'id, caseNumber, title, status, court, clientId, openDate, updateDate, responsibleLawyer',
      clients: 'id, name, type, status, phone, email, nationalId',
      hearings: 'id, caseId, date, time, status, type',
      tasks: 'id, title, dueDate, priority, status, relatedCaseId, type',
      activities: 'id, action, target, user, timestamp, type',
      users: 'id, name, email, username, roleLabel, isActive',
      references: 'id, title, type, branch, year, tags'
    });

    // Initialize with sample data ONLY if database is completely empty
    this.on('populate', async () => {
      // Check if admin user exists before adding
      const adminExists = await this.users.where('username').equals('admin').count();
      if (adminExists === 0) {
        this.initializeSampleData();
      }
    });
  }

  // Initialize sample data
  private async initializeSampleData() {
    try {
      // Add admin user only
      await this.users.bulkAdd([
        {
          id: '1',
          username: 'admin',
          email: 'admin@lawoffice.com',
          name: 'مدير النظام',
          password: 'admin123',
          roleLabel: 'مدير النظام',
          isActive: true,
          permissions: [
            { moduleId: 'cases', access: 'write' as PermissionLevel },
            { moduleId: 'clients', access: 'write' as PermissionLevel },
            { moduleId: 'finance', access: 'write' as PermissionLevel },
            { moduleId: 'references', access: 'write' as PermissionLevel },
            { moduleId: 'users', access: 'write' as PermissionLevel },
            { moduleId: 'settings', access: 'write' as PermissionLevel },
            { moduleId: 'reports', access: 'write' as PermissionLevel },
            { moduleId: 'documents', access: 'write' as PermissionLevel },
            { moduleId: 'hearings', access: 'write' as PermissionLevel },
            { moduleId: 'tasks', access: 'write' as PermissionLevel },
            { moduleId: 'activities', access: 'write' as PermissionLevel },
            { moduleId: 'system', access: 'write' as PermissionLevel }
          ],
          lastLogin: new Date().toISOString()
        }
      ]);

      console.log('Admin user initialized successfully');
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  }

  // Helper methods for data operations
  async getAllCases(): Promise<Case[]> {
    return await this.cases.toArray();
  }

  async getAllClients(): Promise<Client[]> {
    return await this.clients.toArray();
  }

  async getAllHearings(): Promise<Hearing[]> {
    return await this.hearings.toArray();
  }

  async getAllTasks(): Promise<Task[]> {
    return await this.tasks.toArray();
  }

  async getAllActivities(): Promise<ActivityLog[]> {
    return await this.activities.orderBy('timestamp').reverse().toArray();
  }

  async getAllUsers(): Promise<AppUser[]> {
    return await this.users.toArray();
  }

  async getAllReferences(): Promise<LegalReference[]> {
    return await this.references.toArray();
  }

  // CRUD operations
  async addCase(caseData: Omit<Case, 'id'>): Promise<string> {
    const id = await this.cases.add(caseData as Case);
    return id.toString();
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<number> {
    return await this.cases.update(id, updates);
  }

  async deleteCase(id: string): Promise<void> {
    await this.cases.delete(id);
  }

  async addClient(clientData: Omit<Client, 'id'>): Promise<string> {
    const id = await this.clients.add(clientData as Client);
    return id.toString();
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<number> {
    return await this.clients.update(id, updates);
  }

  async deleteClient(id: string): Promise<void> {
    await this.clients.delete(id);
  }

  async addHearing(hearingData: Omit<Hearing, 'id'>): Promise<string> {
    const id = await this.hearings.add(hearingData as Hearing);
    return id.toString();
  }

  async updateHearing(id: string, updates: Partial<Hearing>): Promise<number> {
    return await this.hearings.update(id, updates);
  }

  async deleteHearing(id: string): Promise<void> {
    await this.hearings.delete(id);
  }

  async addTask(taskData: Omit<Task, 'id'>): Promise<string> {
    const id = await this.tasks.add(taskData as Task);
    return id.toString();
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<number> {
    return await this.tasks.update(id, updates);
  }

  async deleteTask(id: string): Promise<void> {
    await this.tasks.delete(id);
  }

  async addActivity(activityData: Omit<ActivityLog, 'id'>): Promise<string> {
    const id = await this.activities.add(activityData as ActivityLog);
    return id.toString();
  }

  async addReference(referenceData: Omit<LegalReference, 'id'>): Promise<string> {
    const id = await this.references.add(referenceData as LegalReference);
    return id.toString();
  }

  async updateReference(id: string, updates: Partial<LegalReference>): Promise<number> {
    return await this.references.update(id, updates);
  }

  async deleteReference(id: string): Promise<void> {
    await this.references.delete(id);
  }
}

// Create and export database instance
export const db = new LawOfficeDatabase();
