
import { Case, CaseStatus, Client, CourtType, Hearing, ClientRole, HearingStatus, ClientType, ClientStatus, Task, ActivityLog, AppUser, LegalReference } from '../types';

// Simulate DB Infrastructure
export const MOCK_CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'أحمد محمد علي', 
    type: ClientType.INDIVIDUAL,
    status: ClientStatus.ACTIVE,
    phone: '01012345678', 
    secondaryPhone: '01222333444',
    nationalId: '29001011234567', 
    nationality: 'مصري',
    address: '15 شارع النصر، المعادي، القاهرة', 
    email: 'ahmed.ali@example.com',
    poaNumber: '1224/أ', 
    poaType: 'عام قضايا', 
    poaExpiry: '2025-12-31' 
  },
  { 
    id: '2', 
    name: 'شركة النور للتجارة والتوزيع', 
    type: ClientType.COMPANY,
    status: ClientStatus.ACTIVE,
    phone: '01223456789', 
    nationalId: '30005051234567', // سجل تجاري
    address: 'برج الأطباء، الدقي، الجيزة',
    companyRepresentative: 'م/ محمود حسين',
    dateOfBirth: '2010-05-20' // تاريخ التأسيس
  },
  { 
    id: '3', 
    name: 'سارة محمود حسن', 
    type: ClientType.INDIVIDUAL,
    status: ClientStatus.INACTIVE,
    phone: '01112345678', 
    nationalId: '29509091234567', 
    nationality: 'مصري',
    address: 'الإسكندرية، المنتزه' 
  },
];

export const MOCK_CASES: Case[] = [
  { 
    id: '101', 
    title: 'دعوى صحة توقيع', 
    caseNumber: '4532', 
    year: 2024, 
    court: CourtType.CIVIL,
    courtBranch: 'محكمة جنوب القاهرة الابتدائية',
    circle: 'الدائرة 5 مدني',
    judgeName: 'المستشار/ محمد حسين',
    stage: 'primary',
    status: CaseStatus.OPEN, 
    clientId: '1', 
    clientName: 'أحمد محمد علي',
    clientRole: ClientRole.PLAINTIFF,
    openDate: '2024-01-15',
    updateDate: '2024-05-20',
    documents: [],
    notes: [
      { id: 'n1', content: 'تم استلام أصل العقد من الموكل', date: '2024-01-16', createdAt: '2024-01-16T10:00:00Z' }
    ],
    opponents: [
      { id: 'o1', name: 'محمود عبد العزيز', role: 'مدعى عليه', address: 'حلوان', lawyer: 'أ. خالد السيد' }
    ],
    strategy: {
      strengthPoints: 'العقد موثق بشهود',
      weaknessPoints: 'تأخر تاريخ التسجيل',
      plan: 'التركيز على صحة التوقيع بغض النظر عن الموضوع',
      privateNotes: 'يجب مراجعة صحيفة الدعوى بدقة قبل الجلسة القادمة'
    },
    finance: {
      agreedFees: 5000,
      paidAmount: 2000,
      expenses: 350,
      history: [
        { id: 'tx1', date: '2024-01-15', amount: 1000, type: 'payment', method: 'cash', description: 'مقدم أتعاب عند فتح الملف' },
        { id: 'tx2', date: '2024-02-01', amount: 1000, type: 'payment', method: 'instapay', description: 'دفعة ثانية' },
        { id: 'ex1', date: '2024-01-20', amount: 150, type: 'expense', category: 'رسوم', description: 'رسوم رفع الدعوى' },
        { id: 'ex2', date: '2024-02-15', amount: 200, type: 'expense', category: 'انتقالات', description: 'بدل انتقال للمحكمة' }
      ]
    },
    memos: [
      { id: 'm1', title: 'مذكرة دفاع أولية', type: 'defense', submissionDate: '2024-02-15', sessionDate: '2024-02-20' }
    ],
    rulings: []
  },
  { 
    id: '102', 
    title: 'جنحة شيك بدون رصيد', 
    caseNumber: '891', 
    year: 2024, 
    court: CourtType.CRIMINAL, 
    courtBranch: 'محكمة جنح الدقي',
    judgeName: 'المستشار/ أحمد زكي',
    status: CaseStatus.PENDING, 
    clientId: '2', 
    clientName: 'شركة النور للتجارة',
    clientRole: ClientRole.VICTIM,
    openDate: '2024-02-10',
    documents: [],
    notes: [],
    rulings: [],
    finance: {
        agreedFees: 15000,
        paidAmount: 5000,
        expenses: 0,
        history: [
            { id: 'tx3', date: '2024-02-10', amount: 5000, type: 'payment', method: 'check', description: 'شيك مقدم أتعاب رقم 5541' }
        ]
    }
  },
  { 
    id: '103', 
    title: 'دعوى نفقة', 
    caseNumber: '112', 
    year: 2024, 
    court: CourtType.FAMILY, 
    courtBranch: 'محكمة أسرة المنتزه',
    status: CaseStatus.OPEN, 
    clientId: '3', 
    clientName: 'سارة محمود حسن',
    clientRole: ClientRole.PLAINTIFF,
    openDate: '2024-03-05',
    documents: [],
    notes: [],
    rulings: [],
    finance: {
        agreedFees: 8000,
        paidAmount: 0,
        expenses: 50,
        history: [
            { id: 'ex3', date: '2024-05-25', amount: 50, type: 'expense', category: 'تصوير', description: 'صورة رسمية من الحكم التمهيدي' }
        ]
    }
  },
];

export const MOCK_HEARINGS: Hearing[] = [
  { 
    id: 'h1', 
    caseId: '101', 
    date: '2024-05-20', 
    time: '09:00', 
    type: 'session', 
    status: HearingStatus.COMPLETED,
    requirements: 'تقديم أصل العقد', 
    clientRequirements: 'إحضار الشهود',
    decision: 'تأجيل للاطلاع والمذكرات'
  },
  { 
    id: 'h2', 
    caseId: '102', 
    date: '2024-05-22', 
    time: '11:30', 
    type: 'session', 
    status: HearingStatus.SCHEDULED,
    requirements: 'حضور المتهم' 
  },
  { 
    id: 'h3', 
    caseId: '103', 
    date: '2024-05-25', 
    time: '10:00', 
    type: 'session', 
    status: HearingStatus.POSTPONED,
    decision: 'تأجيل للاطلاع',
    expenses: { amount: 50, description: 'رسوم صورة محضر', paidBy: 'lawyer' }
  },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'إعداد مذكرة دفاع - دعوى صحة توقيع', dueDate: '2024-05-19', priority: 'high', status: 'pending', relatedCaseId: '101', type: 'memo' },
  { id: 't2', title: 'سداد رسوم استئناف', dueDate: '2024-05-21', priority: 'medium', status: 'pending', relatedCaseId: '103', type: 'finance' },
  { id: 't3', title: 'تجديد كارنيه النقابة', dueDate: '2024-06-01', priority: 'low', status: 'completed', type: 'admin' },
];

export const MOCK_ACTIVITIES: ActivityLog[] = [
  { id: 'a1', action: 'إضافة جلسة جديدة', target: 'دعوى رقم 4532', user: 'محمد المحامي', timestamp: '2024-05-18T10:30:00Z', type: 'create' },
  { id: 'a2', action: 'رفع مستند', target: 'عقد بيع ابتدائي', user: 'السكرتير', timestamp: '2024-05-18T09:15:00Z', type: 'upload' },
  { id: 'a3', action: 'تعديل بيانات موكل', target: 'أحمد محمد علي', user: 'محمد المحامي', timestamp: '2024-05-17T16:45:00Z', type: 'update' },
];

export const MOCK_USERS: AppUser[] = [
  {
    id: 'u0',
    name: 'المدير العام',
    email: 'admin', // Using simple string for login
    username: 'admin',
    password: 'admin',
    roleLabel: 'مدير النظام',
    isActive: true,
    lastLogin: '2024-05-20T12:00:00Z',
    permissions: [
      { moduleId: 'dashboard', access: 'write' },
      { moduleId: 'cases', access: 'write' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'fees', access: 'write' },
      { moduleId: 'reports', access: 'write' },
      { moduleId: 'ai-assistant', access: 'write' },
      { moduleId: 'references', access: 'write' },
      { moduleId: 'settings', access: 'write' },
    ]
  },
  {
    id: 'u1',
    name: 'محمد المحامي',
    email: 'mohamed@almizan.com',
    password: 'password123',
    roleLabel: 'محامي استئناف',
    isActive: true,
    lastLogin: '2024-05-20T10:00:00Z',
    permissions: [
      { moduleId: 'dashboard', access: 'write' },
      { moduleId: 'cases', access: 'write' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'fees', access: 'write' },
      { moduleId: 'reports', access: 'write' },
      { moduleId: 'ai-assistant', access: 'write' },
      { moduleId: 'references', access: 'write' },
      { moduleId: 'settings', access: 'write' },
    ]
  },
  {
    id: 'u2',
    name: 'سارة - سكرتارية',
    email: 'sara@almizan.com',
    password: 'password123',
    roleLabel: 'سكرتارية',
    isActive: true,
    lastLogin: '2024-05-20T09:30:00Z',
    permissions: [
      { moduleId: 'dashboard', access: 'read' },
      { moduleId: 'cases', access: 'read' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'fees', access: 'read' },
      { moduleId: 'reports', access: 'none' },
      { moduleId: 'ai-assistant', access: 'none' },
      { moduleId: 'references', access: 'read' },
      { moduleId: 'settings', access: 'none' },
    ]
  }
];

// --- MOCK LEGAL REFERENCES ---
export const MOCK_REFERENCES: LegalReference[] = [
  {
    id: 'ref1',
    title: 'القانون المدني المصري',
    type: 'law',
    branch: 'civil',
    year: 1948,
    articleNumber: '1',
    description: 'القانون رقم 131 لسنة 1948 بإصدار القانون المدني.',
    tags: ['عقود', 'التزامات', 'ملكية']
  },
  {
    id: 'ref2',
    title: 'قانون العقوبات',
    type: 'law',
    branch: 'criminal',
    year: 1937,
    description: 'القانون رقم 58 لسنة 1937 وتعديلاته.',
    tags: ['جنايات', 'جنح', 'عقوبات']
  },
  {
    id: 'ref3',
    title: 'مجموعة أحكام النقض - الدوائر المدنية',
    type: 'ruling',
    branch: 'civil',
    courtName: 'محكمة النقض',
    year: 2020,
    description: 'مبدأ: العقد شريعة المتعاقدين، لا يجوز نقضه ولا تعديله إلا باتفاق الطرفين.',
    tags: ['نقض مدني', 'عقود', 'مسؤولية']
  },
  {
    id: 'ref4',
    title: 'الوسيط في شرح القانون المدني',
    type: 'encyclopedia',
    branch: 'civil',
    author: 'د. عبد الرزاق السنهوري',
    description: 'الموسوعة الأشهر في شرح القانون المدني المصري، الجزء الأول: مصادر الالتزام.',
    tags: ['فقه', 'شرح', 'سنهوري']
  },
  {
    id: 'ref5',
    title: 'قانون الإجراءات الجنائية',
    type: 'law',
    branch: 'criminal',
    articleNumber: '54',
    description: 'ضمانات المتهم في مرحلة التحقيق والمحاكمة.',
    tags: ['إجراءات', 'تحقيق', 'حبس احتياطي']
  },
  {
    id: 'ref6',
    title: 'حكم دستورية عليا - إيجار الأماكن',
    type: 'ruling',
    branch: 'civil',
    courtName: 'المحكمة الدستورية العليا',
    year: 2002,
    description: 'الحكم بعدم دستورية امتداد عقد الإيجار للأقارب من الدرجة الثانية.',
    tags: ['دستورية', 'إيجار', 'مساكن']
  },
  {
    id: 'ref7',
    title: 'قانون الشركات المساهمة',
    type: 'law',
    branch: 'commercial',
    year: 1981,
    description: 'القانون 159 لسنة 1981 ولائحته التنفيذية.',
    tags: ['شركات', 'تجاري', 'استثمار']
  }
];
