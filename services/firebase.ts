import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AAIzaSyAjK1kb6XLvhx6FCspku_Prw7caT9mzn44",
  authDomain: "al-mizan-d3777.firebaseapp.com",
  projectId: "al-mizan-d3777",
  storageBucket: "al-mizan-d3777.firebasestorage.app",
  messagingSenderId: "995042761699",
  appId: "1:995042761699:web:9f35c623d34d126881ded6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Firestore settings for better network handling
export const configureFirestore = () => {
  // These settings help with network issues
  try {
    // Uncomment for local development
    // connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Settings for production - using experimental settings for better network handling
    if ('settings' in db) {
      (db as any).settings({
        ignoreUndefinedProperties: true,
        merge: true,
        // Add timeout settings
        timeout: 30000,
        // Cache settings
        cacheSizeBytes: 10 * 1024 * 1024, // 10MB
      });
    }
  } catch (error) {
    console.warn('⚠️ Firestore settings configuration failed:', error);
  }
};

export const auth = getAuth(app);

// Collections
export const collections = {
  cases: 'cases',
  clients: 'clients',
  hearings: 'hearings',
  tasks: 'tasks',
  users: 'users',
  activities: 'activities',
  documents: 'documents'
};

// Helper functions
export const convertTimestamp = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

export const convertToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

// Database interfaces for Firebase
export interface FirebaseCase {
  id: string;
  title: string;
  caseNumber: string;
  year: number;
  court: string;
  courtBranch?: string;
  circle?: string;
  judgeName?: string;
  stage?: string;
  status: string;
  clientId?: string;
  clientName?: string;
  clientRole?: string;
  opponents?: any[];
  description?: string;
  openDate: string;
  updateDate?: string;
  responsibleLawyer?: string;
  finance?: {
    agreedFees: number;
    history: Array<{
      id: string;
      type: 'payment' | 'expense';
      amount: number;
      date: string;
      description: string;
      category?: string;
    }>;
  };
  notes?: any[];
  strategy?: any;
  documents?: any[];
  memos?: any[];
  rulings?: any[];
  aiChatHistory?: any[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseClient {
  id: string;
  name: string;
  type: string;
  status: string;
  phone: string;
  secondaryPhone?: string;
  nationalId: string;
  nationality?: string;
  address?: string;
  email?: string;
  poaNumber?: string;
  poaType?: string;
  poaExpiry?: string;
  companyRepresentative?: string;
  dateOfBirth?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseHearing {
  id: string;
  caseId: string;
  date: string;
  time: string;
  status: string;
  type: string;
  location?: string;
  notes?: string;
  expenses?: {
    amount: number;
    description: string;
    paidBy: string;
    date: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  relatedCaseId?: string;
  type: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseUser {
  id: string;
  username: string;
  email: string;
  name: string;
  roleLabel: string;
  isActive: boolean;
  permissions: Array<{
    moduleId: string;
    access: string;
  }>;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseActivity {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  type: string;
  details?: any;
  createdAt: Timestamp;
}

export { app };
