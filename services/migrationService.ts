import { db } from './database';
import { MOCK_CASES, MOCK_CLIENTS, MOCK_HEARINGS, MOCK_TASKS, MOCK_ACTIVITIES, MOCK_USERS, MOCK_REFERENCES } from './mockData';
import { Case, Client, Hearing, Task, ActivityLog, AppUser, LegalReference } from '../types';

export class MigrationService {
  // Check if database is empty
  static async isDatabaseEmpty(): Promise<boolean> {
    try {
      const caseCount = await db.cases.count();
      const clientCount = await db.clients.count();
      const userCount = await db.users.count();
      
      return caseCount === 0 && clientCount === 0 && userCount === 0;
    } catch (error) {
      console.error('Error checking database status:', error);
      return true;
    }
  }

  // Migrate all mock data to database
  static async migrateMockData(): Promise<void> {
    try {
      console.log('Starting migration...');
      
      // Clear existing data
      await db.cases.clear();
      await db.clients.clear();
      await db.hearings.clear();
      await db.tasks.clear();
      await db.activities.clear();
      await db.users.clear();
      await db.references.clear();
      
      // Migrate users
      if (MOCK_USERS.length > 0) {
        await db.users.bulkAdd(MOCK_USERS);
        console.log(`Migrated ${MOCK_USERS.length} users`);
      }
      
      // Migrate clients
      if (MOCK_CLIENTS.length > 0) {
        await db.clients.bulkAdd(MOCK_CLIENTS);
        console.log(`Migrated ${MOCK_CLIENTS.length} clients`);
      }
      
      // Migrate cases
      if (MOCK_CASES.length > 0) {
        await db.cases.bulkAdd(MOCK_CASES);
        console.log(`Migrated ${MOCK_CASES.length} cases`);
      }
      
      // Migrate hearings
      if (MOCK_HEARINGS.length > 0) {
        await db.hearings.bulkAdd(MOCK_HEARINGS);
        console.log(`Migrated ${MOCK_HEARINGS.length} hearings`);
      }
      
      // Migrate tasks
      if (MOCK_TASKS.length > 0) {
        await db.tasks.bulkAdd(MOCK_TASKS);
        console.log(`Migrated ${MOCK_TASKS.length} tasks`);
      }
      
      // Migrate activities
      if (MOCK_ACTIVITIES.length > 0) {
        await db.activities.bulkAdd(MOCK_ACTIVITIES);
        console.log(`Migrated ${MOCK_ACTIVITIES.length} activities`);
      }
      
      // Migrate references
      if (MOCK_REFERENCES.length > 0) {
        await db.references.bulkAdd(MOCK_REFERENCES);
        console.log(`Migrated ${MOCK_REFERENCES.length} references`);
      }
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // Initialize database with sample data if empty
  static async initializeDatabase(): Promise<void> {
    const isEmpty = await this.isDatabaseEmpty();
    
    if (isEmpty) {
      console.log('Database is empty, initializing with sample data...');
      await this.migrateMockData();
    } else {
      console.log('Database already contains data, skipping initialization');
    }
  }

  // Backup database data to JSON
  static async backupData(): Promise<string> {
    try {
      const backup = {
        cases: await db.cases.toArray(),
        clients: await db.clients.toArray(),
        hearings: await db.hearings.toArray(),
        tasks: await db.tasks.toArray(),
        activities: await db.activities.toArray(),
        users: await db.users.toArray(),
        references: await db.references.toArray(),
        backupDate: new Date().toISOString()
      };
      
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  // Restore data from JSON backup
  static async restoreData(backupJson: string): Promise<void> {
    try {
      const backup = JSON.parse(backupJson);
      
      // Clear existing data
      await db.cases.clear();
      await db.clients.clear();
      await db.hearings.clear();
      await db.tasks.clear();
      await db.activities.clear();
      await db.users.clear();
      await db.references.clear();
      
      // Restore data
      if (backup.cases?.length > 0) await db.cases.bulkAdd(backup.cases);
      if (backup.clients?.length > 0) await db.clients.bulkAdd(backup.clients);
      if (backup.hearings?.length > 0) await db.hearings.bulkAdd(backup.hearings);
      if (backup.tasks?.length > 0) await db.tasks.bulkAdd(backup.tasks);
      if (backup.activities?.length > 0) await db.activities.bulkAdd(backup.activities);
      if (backup.users?.length > 0) await db.users.bulkAdd(backup.users);
      if (backup.references?.length > 0) await db.references.bulkAdd(backup.references);
      
      console.log('Data restored successfully!');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  // Get database statistics
  static async getDatabaseStats(): Promise<Record<string, number>> {
    try {
      return {
        cases: await db.cases.count(),
        clients: await db.clients.count(),
        hearings: await db.hearings.count(),
        tasks: await db.tasks.count(),
        activities: await db.activities.count(),
        users: await db.users.count(),
        references: await db.references.count()
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }
}

export default MigrationService;
