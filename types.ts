
export enum CaseStatus {
  OPEN = 'مفتوحة',
  CLOSED = 'مغلقة',
  ARCHIVED = 'مؤرشفة',
  JUDGMENT = 'حكم نهائي',
  EXECUTION = 'قيد التنفيذ'
}

export enum HearingStatus {
  SCHEDULED = 'محددة',
  COMPLETED = 'تمت',
  POSTPONED = 'مؤجلة',
  CANCELLED = 'ملغاة',
  RESERVED_FOR_JUDGMENT = 'حجز للحكم'
}

export enum ClientType {
  INDIVIDUAL = 'فرد',
  COMPANY = 'شركة'
}

export enum ClientStatus {
  ACTIVE = 'نشط',
  INACTIVE = 'غير نشط'
}

export enum CourtType {
  FAMILY = 'أسرة',
  CRIMINAL = 'جنايات',
  MISDEMEANOR = 'جنح',
  CIVIL = 'مدني',
  ADMINISTRATIVE = 'مجلس دولة',
  ECONOMIC = 'اقتصادية',
  LABOR = 'عمالي'
}

export type PermissionLevel = 'none' | 'read' | 'write';
export type PaymentMethod = 'cash' | 'check' | 'instapay' | 'wallet' | 'bank_transfer';
export type ReferenceType = 'law' | 'ruling' | 'encyclopedia' | 'regulation';
export type LawBranch = 'civil' | 'criminal' | 'administrative' | 'commercial' | 'family' | 'labor' | 'other';

export interface Permission {
  moduleId: string;
  access: PermissionLevel;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  roleLabel: string;
  isActive: boolean;
  permissions: Permission[];
  avatar?: string;
  lastLogin?: string;
}

export interface ClientDocument {
  id: string;
  type: 'national_id' | 'poa' | 'commercial_register' | 'contract' | 'other';
  name: string;
  url: string;
  uploadDate: string;
  expiryDate?: string;
  issueDate?: string;
  notes?: string;
}

export interface POAFile extends ClientDocument {}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  nationalId: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  email?: string;
  notes?: string;
  nationality?: string;
  dateOfBirth?: string;
  companyRepresentative?: string;
  documents?: ClientDocument[];
  poaFiles?: POAFile[];
  poaExpiry?: string;
}

export interface Opponent {
  name: string;
  role: string;
  lawyer?: string;
  phone?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'word' | 'other';
  category: 'contract' | 'ruling' | 'notice' | 'minutes' | 'other';
  url: string;
  size?: string;
  uploadDate: string;
  isOriginal?: boolean;
}

export interface CaseRuling {
  id: string;
  date: string;
  summary: string;
  documentName?: string;
  url?: string;
}

export interface CaseMemo {
  id: string;
  title: string;
  type: 'defense' | 'appeal' | 'other';
  submissionDate: string;
  url?: string;
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
  author: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'payment' | 'expense';
  method?: PaymentMethod;
  category?: string;
  description?: string;
  recordedBy: string;
}

export interface CaseFinance {
  agreedFees: number;
  paidAmount: number;
  expenses: number;
  history: FinancialTransaction[];
}

export interface CaseStrategy {
  strengthPoints?: string;
  weaknessPoints?: string;
  plan?: string;
  privateNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Case {
  id: string;
  title: string;
  caseNumber: string;
  year: number;
  court: string;
  courtBranch?: string;
  circle?: string;
  judgeName?: string;
  stage?: 'primary' | 'appeal' | 'cassation';
  status: CaseStatus;
  clientId: string;
  clientName: string;
  clientRole?: string;
  opponents?: Opponent[];
  documents?: CaseDocument[];
  rulings?: CaseRuling[];
  memos?: CaseMemo[];
  notes?: DailyNote[];
  finance?: CaseFinance;
  strategy?: CaseStrategy;
  aiChatHistory?: ChatMessage[];
  description?: string;
  startDate?: string;
}

export interface HearingExpenses {
  amount: number;
  description: string;
  paidBy: 'lawyer' | 'client';
}

export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  time?: string;
  type: 'session' | 'procedure';
  status: HearingStatus;
  decision?: string;
  requirements?: string;
  clientRequirements?: string;
  isCompleted?: boolean;
  rulingUrl?: string;
  expenses?: HearingExpenses;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  relatedCaseId?: string;
  assignedTo?: string; // User ID
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface LegalReference {
  id: string;
  title: string;
  type: ReferenceType;
  branch: LawBranch;
  description?: string;
  articleNumber?: string;
  year?: number;
  courtName?: string;
  author?: string;
  url?: string;
  tags?: string[];
}

export interface WorkLocation {
  id: string;
  name: string;
  type: 'court' | 'police_station' | 'notary' | 'expert' | 'other';
  address: string;
  governorate: string;
  googleMapLink?: string;
  notes?: string;
  phone?: string;
}
