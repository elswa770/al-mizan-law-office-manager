import { AppUser } from '../types';

export class LocalStorageBackup {
  private static readonly USERS_KEY = 'law_office_users_backup';
  private static readonly CASES_KEY = 'law_office_cases_backup';
  private static readonly CLIENTS_KEY = 'law_office_clients_backup';
  private static readonly HEARINGS_KEY = 'law_office_hearings_backup';
  private static readonly TASKS_KEY = 'law_office_tasks_backup';

  // Save users to localStorage
  static saveUsers(users: AppUser[]): void {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      console.log('✅ Users saved to localStorage backup:', users.length);
    } catch (error) {
      console.error('❌ Error saving users to localStorage:', error);
    }
  }

  // Load users from localStorage
  static loadUsers(): AppUser[] {
    try {
      const saved = localStorage.getItem(this.USERS_KEY);
      if (saved) {
        const users = JSON.parse(saved);
        console.log('📊 Users loaded from localStorage backup:', users.length);
        return users;
      }
      return [];
    } catch (error) {
      console.error('❌ Error loading users from localStorage:', error);
      return [];
    }
  }

  // Save any data to localStorage
  static saveData(key: string, data: any[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ ${key} saved to localStorage backup:`, data.length);
    } catch (error) {
      console.error(`❌ Error saving ${key} to localStorage:`, error);
    }
  }

  // Load any data from localStorage
  static loadData(key: string): any[] {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        console.log(`📊 ${key} loaded from localStorage backup:`, data.length);
        return data;
      }
      return [];
    } catch (error) {
      console.error(`❌ Error loading ${key} from localStorage:`, error);
      return [];
    }
  }

  // Clear all backup data
  static clearAll(): void {
    try {
      localStorage.removeItem(this.USERS_KEY);
      localStorage.removeItem(this.CASES_KEY);
      localStorage.removeItem(this.CLIENTS_KEY);
      localStorage.removeItem(this.HEARINGS_KEY);
      localStorage.removeItem(this.TASKS_KEY);
      console.log('🗑️ All localStorage backup data cleared');
    } catch (error) {
      console.error('❌ Error clearing localStorage backup:', error);
    }
  }

  // Check if localStorage is available
  static isAvailable(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }
}
