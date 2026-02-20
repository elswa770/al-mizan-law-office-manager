import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Client, Case, Hearing, Task, ActivityLog, AppUser, LegalReference, WorkLocation } from "../types";

// --- Clients ---
export const getClients = async (): Promise<Client[]> => {
  const querySnapshot = await getDocs(collection(db, "clients"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const addClient = async (client: Omit<Client, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "clients"), client);
  return docRef.id;
};

export const updateClient = async (id: string, client: Partial<Client>) => {
  const docRef = doc(db, "clients", id);
  await updateDoc(docRef, client);
};

export const deleteClient = async (id: string) => {
  await deleteDoc(doc(db, "clients", id));
};

// --- Cases ---
export const getCases = async (): Promise<Case[]> => {
  const querySnapshot = await getDocs(collection(db, "cases"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
};

export const addCase = async (caseData: Omit<Case, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "cases"), caseData);
  return docRef.id;
};

export const updateCase = async (id: string, caseData: Partial<Case>) => {
  const docRef = doc(db, "cases", id);
  await updateDoc(docRef, caseData);
};

// --- Hearings ---
export const getHearings = async (): Promise<Hearing[]> => {
  const querySnapshot = await getDocs(collection(db, "hearings"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hearing));
};

export const addHearing = async (hearing: Omit<Hearing, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "hearings"), hearing);
  return docRef.id;
};

export const updateHearing = async (id: string, hearingData: Partial<Hearing>) => {
  const docRef = doc(db, "hearings", id);
  
  // Remove undefined values from hearingData before sending to Firebase
  const cleanedData = Object.keys(hearingData).reduce((acc, key) => {
    const value = hearingData[key as keyof Hearing];
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Partial<Hearing>);
  
  await updateDoc(docRef, cleanedData);
};

// --- Tasks ---
export const getTasks = async (): Promise<Task[]> => {
  const querySnapshot = await getDocs(collection(db, "tasks"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
};

export const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "tasks"), task);
  return docRef.id;
};

export const updateTask = async (id: string, taskData: Partial<Task>) => {
  const docRef = doc(db, "tasks", id);
  await updateDoc(docRef, taskData);
};

export const deleteTask = async (id: string) => {
  await deleteDoc(doc(db, "tasks", id));
};

// --- Users (Lawyers/Staff) ---
export const getAppUsers = async (): Promise<AppUser[]> => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
};

export const addAppUser = async (user: Omit<AppUser, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "users"), user);
  return docRef.id;
};

export const updateAppUser = async (id: string, userData: Partial<AppUser>) => {
  const docRef = doc(db, "users", id);
  // Remove undefined fields to prevent Firebase errors
  const cleanData = Object.fromEntries(
    Object.entries(userData).filter(([_, value]) => value !== undefined)
  );
  await updateDoc(docRef, cleanData);
};

export const deleteAppUser = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
};

// --- Activity Logs ---
export const getActivities = async (limitCount: number = 20): Promise<ActivityLog[]> => {
  const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
    } as ActivityLog;
  });
};

// --- Legal References ---
export const getLegalReferences = async (): Promise<LegalReference[]> => {
  const querySnapshot = await getDocs(collection(db, "references"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalReference));
};

export const addLegalReference = async (reference: Omit<LegalReference, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "references"), reference);
  return docRef.id;
};

export const updateLegalReference = async (id: string, reference: Partial<LegalReference>) => {
  const docRef = doc(db, "references", id);
  await updateDoc(docRef, reference);
};

export const deleteLegalReference = async (id: string) => {
  await deleteDoc(doc(db, "references", id));
};

export const addActivity = async (activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "activities"), {
    ...activity,
    timestamp: serverTimestamp()
  });
  return docRef.id;
};

// --- Work Locations ---
export const getLocations = async (): Promise<WorkLocation[]> => {
  const querySnapshot = await getDocs(collection(db, "locations"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkLocation));
};

export const addLocation = async (location: Omit<WorkLocation, 'id'>): Promise<string> => {
  // Remove undefined fields to prevent Firebase errors
  const cleanLocation = Object.fromEntries(
    Object.entries(location).filter(([_, value]) => value !== undefined)
  );
  const docRef = await addDoc(collection(db, "locations"), cleanLocation);
  return docRef.id;
};

export const updateLocation = async (id: string, location: Partial<WorkLocation>) => {
  const docRef = doc(db, "locations", id);
  // Remove undefined fields to prevent Firebase errors
  const cleanLocation = Object.fromEntries(
    Object.entries(location).filter(([_, value]) => value !== undefined)
  );
  await updateDoc(docRef, cleanLocation);
};

export const deleteLocation = async (id: string) => {
  await deleteDoc(doc(db, "locations", id));
};
