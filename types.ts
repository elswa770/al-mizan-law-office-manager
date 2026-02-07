
// Domain Entities

export enum CaseStatus {
  OPEN = 'قيد العمل',
  CLOSED = 'مغلقة',
  PENDING = 'معلقة',
  ARCHIVED = 'مؤرشفة',
  DISMISSED = 'مشطوبة',
  JUDGMENT = 'صدر حكم',
  EXECUTION = 'قيد التنفيذ'
}

export enum CourtType {
  FAMILY = 'محكمة الأسرة',
  CIVIL = 'المحكمة المدنية',
  CRIMINAL = 'محكمة الجنايات',
  ADMINISTRATIVE = 'القضاء الإداري',
  ECONOMIC = 'المحكمة الاقتصادية'
}

export enum ClientRole {
  PLAINTIFF = 'مدعي',
  DEFENDANT = 'مدعى عليه',
  VICTIM = 'مجني عليه',
  ACCUSED = 'متهم',
  APPELLANT = 'مستأنف',
  APPELLEE = 'مستأنف ضده'
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
  INACTIVE = 'موقوف/أرشيف'
}

export interface POAFile {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
}

export interface ClientDocument {
  id: string;
  type: 'national_id' | 'commercial_register' | 'poa' | 'contract' | 'tax_card' | 'other';
  name: string;
  url: string;
  issueDate?: string; // تاريخ الإصدار/العمل
  expiryDate?: string; // تاريخ الانتهاء
  notes?: string;
  uploadDate: string;
}

export interface Client {
  id: string;
  name: string; // الاسم الكامل أو اسم الشركة
  type: ClientType;
  status: ClientStatus;
  
  // Identifiers
  nationalId: string; // الرقم القومي أو السجل التجاري
  nationality?: string;
  dateOfBirth?: string; // أو تاريخ التأسيس للشركة
  companyRepresentative?: string; // الممثل القانوني (للشركات)

  // Contact
  phone: string; // الرقم الأساسي
  secondaryPhone?: string;
  email?: string;
  address?: string;
  
  notes?: string;
  
  // Linked Data
  poaNumber?: string; // رقم التوكيل (Legacy support)
  poaType?: string; 
  poaExpiry?: string; 
  poaUrl?: string; // Legacy
  poaFiles?: POAFile[]; // Legacy
  
  documents?: ClientDocument[]; // New generic documents system
}

export interface Opponent {
  id: string;
  name: string;
  role: string; // صفة الخصم
  lawyer?: string; // محامي الخصم
  address?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'word' | 'other';
  category?: 'contract' | 'ruling' | 'notice' | 'minutes' | 'other'; // New category
  url: string; // URL or Base64 for preview
  size: string;
  uploadDate: string;
  isOriginal?: boolean; // أصل أم صورة
}

export interface CaseMemo {
  id: string;
  title: string;
  type: 'defense' | 'reply' | 'closing' | 'other'; // دفاع، رد، ختامية
  submissionDate: string;
  sessionDate?: string; // قدمت في جلسة...
  url?: string;
  notes?: string;
}

export interface CaseRuling {
  id: string;
  date: string;
  type: 'preliminary' | 'final' | 'execution'; // تمهيدي، قطعي، تنفيذي
  summary: string; // منطوق الحكم
  details?: string; // أسباب الحكم
  isAppealable: boolean;
  url?: string; // رابط ملف الحكم
  documentName?: string; // اسم ملف الحكم
}

export type PaymentMethod = 'cash' | 'check' | 'instapay' | 'wallet' | 'bank_transfer' | 'other';

export interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'payment' | 'expense'; // وارد (دفعة) أو صادر (مصروف)
  method?: PaymentMethod; // كاش، شيك، انستاباي...
  category?: string; // للمصروفات: رسوم، انتقالات، ضيافة...
  description?: string;
  recordedBy?: string; // اسم المستخدم
}

export interface CaseFinance {
  agreedFees: number; // الأتعاب المتفق عليها
  paidAmount: number; // المدفوع
  expenses: number; // مصروفات الجلسات والإدارية
  history?: FinancialTransaction[]; // سجل المعاملات التفصيلي
}

export interface CaseNote {
  id: string;
  content: string;
  date: string;
  createdAt: string; // ISO string for sorting
}

export interface CaseStrategy {
  strengthPoints: string;
  weaknessPoints: string;
  plan: string;
  privateNotes: string;
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
  caseNumber: string; // e.g., 1234/2024
  year: number;
  court: CourtType;
  courtBranch?: string; // اسم المحكمة التفصيلي (مثال: محكمة جنوب القاهرة)
  circle?: string; // e.g., الدائرة الأولى
  judgeName?: string; // اسم رئيس المحكمة
  stage?: 'primary' | 'appeal' | 'cassation'; // المرحلة: أولى، استئناف، نقض
  status: CaseStatus;
  
  clientId: string;
  clientName?: string; // Denormalized for display
  clientRole?: ClientRole; // صفة الموكل
  
  opponents?: Opponent[]; // الخصوم
  
  description?: string; // Main description
  
  openDate: string;
  updateDate?: string; // تاريخ آخر تحديث

  notes?: CaseNote[]; // Array of follow-up notes
  strategy?: CaseStrategy; // الملاحظات والاستراتيجية (خاص بالمحامي)

  documents?: CaseDocument[]; // Documents list
  memos?: CaseMemo[]; // المذكرات
  rulings?: CaseRuling[]; // قائمة الأحكام
  ruling?: CaseRuling; // Legacy support (optional)

  finance?: CaseFinance; // المصروفات والأتعاب
  
  responsibleLawyer?: string; // اسم المحامي المسئول عن القضية
  
  aiChatHistory?: ChatMessage[]; // سجل المحادثات مع المساعد الذكي
}

export interface HearingExpense {
  amount: number;
  description: string;
  paidBy: 'lawyer' | 'client';
}

export interface HearingAttachment {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'word' | 'other';
  uploadDate: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  time?: string; // HH:MM format
  type?: 'session' | 'ruling' | 'investigation'; // نظر، حكم، تحقيق
  status?: HearingStatus; // حالة الجلسة: قادمة، تمت، مؤجلة
  decision?: string; // القرار
  requirements?: string; // المطلوب من المحامي
  clientRequirements?: string; // المطلوب من الموكل
  isCompleted?: boolean; // تم التنفيذ (للمتطلبات)
  rulingUrl?: string; // Legacy support (keep for now)
  attachments?: HearingAttachment[]; // NEW: Multiple attachments
  expenses?: HearingExpense; // مصروفات الجلسة
  notes?: string;
  location?: string; // مكان الجلسة
}

export interface Invoice {
  id: string;
  caseId: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  isPaid: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  relatedCaseId?: string;
  type?: 'memo' | 'admin' | 'finance' | 'other';
}

export interface ActivityLog {
  id: string;
  action: string;
  target: string; // e.g., "Case 123"
  user: string;
  timestamp: string; // ISO
  type: 'create' | 'update' | 'delete' | 'upload';
}

// --- LEGAL REFERENCES MODULE ---
export type ReferenceType = 'law' | 'ruling' | 'encyclopedia' | 'regulation';
export type LawBranch = 'civil' | 'criminal' | 'administrative' | 'commercial' | 'family' | 'labor' | 'other';

export interface LegalReference {
  id: string;
  title: string; // اسم القانون أو الحكم أو الكتاب
  type: ReferenceType;
  branch: LawBranch;
  description?: string; // وصف مختصر أو مبدأ قانوني (للأحكام)
  articleNumber?: string; // رقم المادة (للقوانين)
  year?: number; // سنة الإصدار
  courtName?: string; // للمحاكم (نقض، دستورية)
  author?: string; // للكتب والموسوعات
  url?: string; // رابط PDF أو نص كامل
  tags?: string[]; // كلمات مفتاحية
}

// --- USER MANAGEMENT ---

export type PermissionLevel = 'none' | 'read' | 'write';

export interface UserPermission {
  moduleId: string; // e.g., 'cases', 'clients', 'finance', 'references'
  access: PermissionLevel;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  username?: string; // For login
  password?: string; // In real app, this should be hashed. Here for mock login.
  roleLabel: string; // e.g. "مدير النظام", "محامي", "سيكرتارية"
  isActive: boolean;
  avatar?: string;
  permissions: UserPermission[];
  lastLogin?: string;
}
