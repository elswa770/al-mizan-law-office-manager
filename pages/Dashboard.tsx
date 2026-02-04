
import React, { useState, useMemo, useRef } from 'react';
import { Case, Client, Hearing, CaseStatus, Task, ActivityLog, HearingStatus, CaseDocument, ClientDocument } from '../types';
import { Briefcase, Users, Scale, AlertCircle, Calendar, CheckSquare, Clock, DollarSign, Plus, Search, Filter, ArrowUpRight, Upload, Bell, Zap, EyeOff, Eye, Check, AlertTriangle, FileText, X, FileCheck, User, CheckCircle } from 'lucide-react';

interface DashboardProps {
  cases: Case[];
  clients: Client[];
  hearings: Hearing[];
  tasks?: Task[];
  activities?: ActivityLog[];
  onUpdateTask?: (task: Task) => void;
  onNavigate?: (page: string) => void;
  onCaseClick?: (caseId: string) => void;
  onUpdateCase?: (updatedCase: Case) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  readOnly?: boolean;
}

const StatCard = ({ title, value, subtext, icon: Icon, color, onClick }: { title: string, value: string | number, subtext?: string, icon: any, color: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-all hover:-translate-y-1 duration-300 group cursor-pointer hover:shadow-md`}>
    <div className={`p-4 rounded-full ${color} bg-opacity-10 dark:bg-opacity-20 group-hover:bg-opacity-20 dark:group-hover:bg-opacity-30 transition-colors`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ cases, clients, hearings, tasks = [], activities = [], onUpdateTask, onNavigate, onCaseClick, onUpdateCase, onUpdateClient, readOnly = false }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Upload Modal State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadData, setUploadData] = useState({
    targetType: 'case' as 'case' | 'client',
    targetId: '',
    name: '',
    type: 'pdf' as string,
    docType: '' as string,
    isOriginal: false,
    file: null as File | null
  });

  // --- Task Modal State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium' as 'high' | 'medium' | 'low',
    relatedCaseId: '',
    type: 'other' as 'other' | 'memo' | 'admin' | 'finance'
  });

  // --- Derived Stats ---
  const today = new Date();
  today.setHours(0,0,0,0);

  const activeCases = cases.filter(c => c.status !== CaseStatus.CLOSED && c.status !== CaseStatus.ARCHIVED).length;
  
  const todayHearings = hearings.filter(h => {
    const d = new Date(h.date);
    d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });

  const delayedHearings = hearings.filter(h => 
    new Date(h.date) < today && 
    (h.status === HearingStatus.SCHEDULED || !h.status)
  ).length;

  // --- Financial Calculations from Transaction History ---
  const financialStats = useMemo(() => {
    let totalAgreed = 0;
    let totalCollected = 0;
    let totalExpenses = 0;
    let currentMonthExpenses = 0;

    cases.forEach(c => {
      if (c.finance) {
        totalAgreed += c.finance.agreedFees || 0;
        
        // Calculate collected from payment history
        const caseCollected = c.finance.history?.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + tx.amount, 0) || 0;
        totalCollected += caseCollected;
        
        // Calculate expenses from expense history
        const caseExpenses = c.finance.history?.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0) || 0;
        totalExpenses += caseExpenses;
        
        // Calculate current month expenses
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthExpenses = c.finance.history?.filter(tx => {
          if (tx.type !== 'expense') return false;
          const txDate = new Date(tx.date);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).reduce((sum, tx) => sum + tx.amount, 0) || 0;
        currentMonthExpenses += monthExpenses;
      }
    });

    const totalDues = totalAgreed - totalCollected;
    const collectionRate = totalAgreed > 0 ? Math.round((totalCollected / totalAgreed) * 100) : 0;
    const netIncome = totalCollected - totalExpenses;

    return { totalAgreed, totalCollected, totalExpenses, totalDues, collectionRate, currentMonthExpenses, netIncome };
  }, [cases]);

  const totalDues = financialStats.totalDues;

  // --- Smart Logic: Task Analysis ---
  const taskStats = useMemo(() => {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const overdueTasks = pendingTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0,0,0,0);
      return dueDate < today;
    });
    
    const dueTodayTasks = pendingTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0,0,0,0);
      return dueDate.getTime() === today.getTime();
    });
    
    const dueThisWeekTasks = pendingTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate >= today && dueDate <= weekFromNow;
    });
    
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    
    return {
      total: pendingTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      dueThisWeek: dueThisWeekTasks.length,
      highPriority: highPriorityTasks.length,
      completionRate: tasks.length > 0 ? Math.round(((tasks.filter(t => t.status === 'completed').length) / tasks.length) * 100) : 0
    };
  }, [tasks]);

  // --- Smart Logic: Critical Cases ---
  const criticalCases = useMemo(() => {
     return cases.filter(c => {
        if (c.status !== CaseStatus.OPEN) return false;
        // 1. No future hearing
        const hasFutureHearing = hearings.some(h => h.caseId === c.id && new Date(h.date) >= today);
        if (!hasFutureHearing) return true;
        // 2. Reserved for judgment for long time (> 30 days) - Hypothetical logic
        // if (c.status === CaseStatus.JUDGMENT) ...
        return false;
     });
  }, [cases, hearings]);

  // --- Helper: Toggle Task ---
  const toggleTask = (taskId: string) => {
     if (!onUpdateTask || readOnly) return;
     const task = tasks.find(t => t.id === taskId);
     if (task) {
        onUpdateTask({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' });
     }
  };

  // --- Upload Helpers ---
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOpenUpload = () => {
    setUploadData({
      targetType: 'case',
      targetId: '',
      name: '',
      type: 'pdf',
      docType: 'other',
      isOriginal: false,
      file: null
    });
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      let type = 'other';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.includes('image')) type = 'image';
      else if (file.type.includes('word') || file.type.includes('document')) type = 'word';

      setUploadData(prev => ({
        ...prev,
        file: file,
        name: prev.name || file.name,
        type: type
      }));
    }
  };

  // --- Task Handlers ---
  const handleOpenTaskModal = () => {
    setTaskData({
      title: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      relatedCaseId: '',
      type: 'other'
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.title.trim()) return;

    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: taskData.title.trim(),
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: 'pending',
      relatedCaseId: taskData.relatedCaseId || undefined,
      type: taskData.type
    };

    // Here you would typically save to database
    // For now, we'll just show a success message
    console.log('New task created:', newTask);
    setIsTaskModalOpen(false);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.name || !uploadData.targetId) return;

    const fileUrl = URL.createObjectURL(uploadData.file);
    const date = new Date().toISOString().split('T')[0];
    const size = formatFileSize(uploadData.file.size);

    if (uploadData.targetType === 'case' && onUpdateCase) {
       const targetCase = cases.find(c => c.id === uploadData.targetId);
       if (targetCase) {
          const newDoc: CaseDocument = {
             id: Math.random().toString(36).substring(2, 9),
             name: uploadData.name,
             type: uploadData.type as any,
             category: uploadData.docType as any,
             url: fileUrl,
             size: size,
             uploadDate: date,
             isOriginal: uploadData.isOriginal
          };
          onUpdateCase({ ...targetCase, documents: [...(targetCase.documents || []), newDoc] });
       }
    } else if (uploadData.targetType === 'client' && onUpdateClient) {
       const targetClient = clients.find(c => c.id === uploadData.targetId);
       if (targetClient) {
          const newDoc: ClientDocument = {
             id: Math.random().toString(36).substring(2, 9),
             name: uploadData.name,
             type: uploadData.docType as any,
             url: fileUrl,
             uploadDate: date,
          };
          onUpdateClient({ ...targetClient, documents: [...(targetClient.documents || []), newDoc] });
       }
    }

    setIsUploadModalOpen(false);
    alert('تم رفع المستند بنجاح!');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Top Bar (Search & Date & Focus Mode) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
               <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                  type="text" 
                  placeholder="بحث سريع (قضية، موكل، جلسة)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 text-sm dark:text-white transition-colors"
               />
            </div>
         </div>
         
         <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-left hidden sm:block">
               <p className="text-sm font-bold text-slate-800 dark:text-white">{today.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400">أهلاً بك في الميزان</p>
            </div>
            
            <button 
               onClick={() => setIsFocusMode(!isFocusMode)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isFocusMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            >
               {isFocusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               {isFocusMode ? 'وضع التركيز مفعل' : 'تفعيل التركيز'}
            </button>
         </div>
      </div>

      {/* 2. KPIs (Quick Stats) */}
      {!isFocusMode && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <StatCard 
               title="القضايا النشطة" 
               value={activeCases} 
               subtext="قيد العمل حالياً"
               icon={Briefcase} 
               color="text-blue-600 bg-blue-600" 
               onClick={() => onNavigate && onNavigate('cases')}
            />
            <StatCard 
               title="جلسات اليوم" 
               value={todayHearings.length} 
               subtext="تتطلب إجراء عاجل"
               icon={Scale} 
               color={todayHearings.length > 0 ? "text-amber-600 bg-amber-600" : "text-slate-600 bg-slate-600"}
               onClick={() => onNavigate && onNavigate('hearings')}
            />
            <StatCard 
               title="جلسات متأخرة" 
               value={delayedHearings} 
               subtext="لم يتم تحديث القرار"
               icon={AlertCircle} 
               color={delayedHearings > 0 ? "text-red-600 bg-red-600" : "text-green-600 bg-green-600"}
            />
            <StatCard 
               title="مستحقات معلقة" 
               value={totalDues.toLocaleString()} 
               subtext="جنية مصري"
               icon={DollarSign} 
               color="text-emerald-600 bg-emerald-600" 
            />
         </div>
      )}

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Left Column (2/3) */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* A. Critical Widget: Today's Hearings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative transition-colors">
               <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-amber-50/30 dark:bg-amber-900/10">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                     جلسات اليوم والقادمة
                  </h3>
                  <button onClick={() => onNavigate && onNavigate('hearings')} className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline">عرض الجدول الكامل</button>
               </div>
               
               <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {todayHearings.length > 0 ? todayHearings.map(h => {
                     const c = cases.find(c => c.id === h.caseId);
                     return (
                        <div key={h.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-mono text-sm px-2 py-1 rounded font-bold">
                                 {h.time || '09:00'}
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 dark:text-white text-sm cursor-pointer hover:text-primary-600 dark:hover:text-primary-400" onClick={() => c && onCaseClick && onCaseClick(c.id)}>{c?.title || 'قضية'}</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{c?.court} • {c?.caseNumber}</p>
                              </div>
                           </div>
                           {!readOnly && (
                             <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white">تأجيل</button>
                                <button className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700">تسجيل قرار</button>
                             </div>
                           )}
                        </div>
                     )
                  }) : (
                     <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                        <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>لا توجد جلسات اليوم، يوم هادئ! ☕</p>
                     </div>
                  )}
               </div>
            </div>

            {/* B. Professional Tasks Dashboard */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
               {/* Header with Stats */}
               <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                     <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        المهام المطلوبة
                     </h3>
                     {!readOnly && (
                       <button onClick={handleOpenTaskModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><Plus className="w-4 h-4" /></button>
                     )}
                  </div>
                  
                  {/* Task Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                     <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</p>
                        <p className="text-xs text-red-500 dark:text-red-400">متأخرة</p>
                     </div>
                     <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{taskStats.dueToday}</p>
                        <p className="text-xs text-amber-500 dark:text-amber-400">لهذا اليوم</p>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{taskStats.dueThisWeek}</p>
                        <p className="text-xs text-blue-500 dark:text-blue-400">هذا الأسبوع</p>
                     </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                     <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>معدل الإنجاز</span>
                        <span className="font-bold">{taskStats.completionRate}%</span>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500" style={{width: `${taskStats.completionRate}%`}}></div>
                     </div>
                  </div>
               </div>
               
               {/* Tasks List */}
               <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-80 overflow-y-auto">
                  {/* Show overdue tasks first */}
                  {tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0))).map(task => (
                     <div key={task.id} className="p-4 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-start gap-3 group transition-colors border-l-4 border-l-red-500">
                        <button 
                           onClick={() => toggleTask(task.id)}
                           disabled={readOnly}
                           className={`mt-1 w-5 h-5 rounded border-2 border-red-300 ${!readOnly ? 'hover:border-red-500 cursor-pointer' : 'cursor-default'} flex items-center justify-center transition-colors`}
                        >
                           {task.status === 'completed' && <div className="w-3 h-3 bg-red-500 rounded-sm"></div>}
                        </button>
                        <div className="flex-1">
                           <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{task.title}</p>
                           <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                 متأخرة
                              </span>
                              <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-3 h-3" /> {task.dueDate}</span>
                              {task.relatedCaseId && <span className="text-primary-600 dark:text-primary-400 font-medium">#{task.relatedCaseId}</span>}
                           </div>
                        </div>
                     </div>
                  ))}
                  
                  {/* Show today's tasks */}
                  {tasks.filter(t => t.status === 'pending').filter(task => {
                     const dueDate = new Date(task.dueDate);
                     dueDate.setHours(0,0,0,0);
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     return dueDate.getTime() === today.getTime();
                  }).map(task => (
                     <div key={task.id} className="p-4 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-start gap-3 group transition-colors border-l-4 border-l-amber-500">
                        <button 
                           onClick={() => toggleTask(task.id)}
                           disabled={readOnly}
                           className={`mt-1 w-5 h-5 rounded border-2 border-amber-300 ${!readOnly ? 'hover:border-amber-500 cursor-pointer' : 'cursor-default'} flex items-center justify-center transition-colors`}
                        >
                           {task.status === 'completed' && <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>}
                        </button>
                        <div className="flex-1">
                           <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{task.title}</p>
                           <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                 اليوم
                              </span>
                              <span className="flex items-center gap-1 text-amber-500"><Calendar className="w-3 h-3" /> {task.dueDate}</span>
                              {task.relatedCaseId && <span className="text-primary-600 dark:text-primary-400 font-medium">#{task.relatedCaseId}</span>}
                           </div>
                        </div>
                     </div>
                  ))}
                  
                  {/* Show other pending tasks */}
                  {tasks.filter(t => t.status === 'pending').filter(task => {
                     const dueDate = new Date(task.dueDate);
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     return dueDate > today;
                  }).map(task => (
                     <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-start gap-3 group transition-colors">
                        <button 
                           onClick={() => toggleTask(task.id)}
                           disabled={readOnly}
                           className={`mt-1 w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-500 ${!readOnly ? 'hover:border-blue-500 cursor-pointer' : 'cursor-default'} flex items-center justify-center transition-colors`}
                        >
                           {task.status === 'completed' && <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>}
                        </button>
                        <div className="flex-1">
                           <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{task.title}</p>
                           <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                 task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                 task.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              }`}>
                                 {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'متوسط' : 'عادي'}
                              </span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.dueDate}</span>
                              {task.relatedCaseId && <span className="text-primary-600 dark:text-primary-400 font-medium">#{task.relatedCaseId}</span>}
                           </div>
                        </div>
                     </div>
                  ))}
                  
                  {tasks.filter(t => t.status === 'pending').length === 0 && (
                     <div className="p-6 text-center text-slate-400 text-sm">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                           <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="font-bold">أنت منجز! لا توجد مهام معلقة 🎉</p>
                        <p className="text-xs mt-1 text-slate-400">معدل الإنجاز: {taskStats.completionRate}%</p>
                     </div>
                  )}
               </div>
            </div>

            {/* C. Activity Feed */}
            {!isFocusMode && (
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                     <Zap className="w-5 h-5 text-yellow-500" />
                     أحدث النشاطات
                  </h3>
                  <div className="space-y-4 relative before:absolute before:right-[9px] before:top-2 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                     {activities.slice(0, 5).map(act => (
                        <div key={act.id} className="relative pr-6">
                           <div className="absolute right-0 top-1.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                           </div>
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-sm text-slate-800 dark:text-white font-medium">
                                    <span className="font-bold">{act.user}</span> قام بـ {act.action}
                                 </p>
                                 <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mt-0.5">{act.target}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                 {new Date(act.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         {/* Right Column (1/3) */}
         <div className="space-y-6">
            
            {/* Quick Actions (Hide if ReadOnly) */}
            {!readOnly && (
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onNavigate && onNavigate('cases')} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group text-center">
                     <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Plus className="w-5 h-5" /></div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">قضية جديدة</span>
                  </button>
                  <button onClick={() => onNavigate && onNavigate('clients')} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group text-center">
                     <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-full text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users className="w-5 h-5" /></div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">موكل جديد</span>
                  </button>
                  <button onClick={() => onNavigate && onNavigate('hearings')} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group text-center">
                     <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-full text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors"><Calendar className="w-5 h-5" /></div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إضافة جلسة</span>
                  </button>
                  <button onClick={handleOpenUpload} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group text-center">
                     <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Upload className="w-5 h-5" /></div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">رفع مستند</span>
                  </button>
               </div>
            )}

            {/* Critical Cases (Smart List) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/20">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-red-500" />
                     قضايا تحتاج انتباه ({criticalCases.length})
                  </h3>
               </div>
               <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {criticalCases.slice(0, 4).map(c => (
                     <div key={c.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors" onClick={() => onCaseClick && onCaseClick(c.id)}>
                        <div className="flex justify-between items-start mb-1">
                           <span className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{c.title}</span>
                           <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 rounded whitespace-nowrap">بدون جلسة</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{c.caseNumber} • {c.court}</p>
                     </div>
                  ))}
                  {criticalCases.length === 0 && (
                     <div className="p-4 text-center text-xs text-green-600 font-bold flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> كل القضايا محدثة!
                     </div>
                  )}
               </div>
            </div>

            {/* Financial Summary */}
            {!isFocusMode && (
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4 flex items-center gap-2">
                     <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> الوضع المالي
                  </h3>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">إجمالي الأتعاب</span>
                        <span className="font-bold text-slate-800 dark:text-white">{financialStats.totalAgreed.toLocaleString()}</span>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{width: `${financialStats.collectionRate}%`}}></div>
                     </div>
                     <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>تم تحصيل: {financialStats.collectionRate}%</span>
                        <span className="text-red-500 dark:text-red-400 font-bold">متبقي: {financialStats.totalDues.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                     <p className="text-xs text-slate-400 mb-1">مصروفات هذا الشهر</p>
                     <p className="font-bold text-slate-800 dark:text-white">{financialStats.currentMonthExpenses.toLocaleString()} ج.م</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                     <p className="text-xs text-slate-400 mb-1">صافي الدخل</p>
                     <p className={`font-bold ${financialStats.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {financialStats.netIncome.toLocaleString()} ج.م
                     </p>
                  </div>
               </div>
            )}
         </div>

      </div>

      {/* Upload Modal (Duplicate Logic from Documents for Quick Action) */}
      {isUploadModalOpen && !readOnly && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">رفع مستند جديد (سريع)</h3>
                  <button onClick={() => setIsUploadModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
               </div>
               
               <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
                  {/* Target Selection */}
                  <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                     <button
                        type="button"
                        onClick={() => { setUploadData({ ...uploadData, targetType: 'case', targetId: '', docType: 'contract' }); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${uploadData.targetType === 'case' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                        <Briefcase className="w-4 h-4 inline-block ml-2" /> خاص بقضية
                     </button>
                     <button
                        type="button"
                        onClick={() => { setUploadData({ ...uploadData, targetType: 'client', targetId: '', docType: 'national_id' }); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${uploadData.targetType === 'client' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                        <User className="w-4 h-4 inline-block ml-2" /> خاص بموكل
                     </button>
                  </div>

                  {/* Target Dropdown */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {uploadData.targetType === 'case' ? 'اختر القضية' : 'اختر الموكل'} <span className="text-red-500">*</span>
                     </label>
                     <select
                        required
                        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        value={uploadData.targetId}
                        onChange={e => setUploadData({ ...uploadData, targetId: e.target.value })}
                     >
                        <option value="">-- اختر --</option>
                        {uploadData.targetType === 'case' 
                           ? cases.map(c => <option key={c.id} value={c.id}>{c.title} - {c.caseNumber}</option>)
                           : clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        }
                     </select>
                  </div>

                  {/* File Upload Area */}
                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadData.file ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                     {uploadData.file ? (
                        <div className="flex flex-col items-center gap-2">
                           <FileCheck className="w-8 h-8 text-primary-600" />
                           <p className="text-sm font-bold text-slate-800 dark:text-white">{uploadData.file.name}</p>
                           <p className="text-xs text-slate-500">{formatFileSize(uploadData.file.size)}</p>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                           <Upload className="w-8 h-8 opacity-50" />
                           <p className="text-sm font-medium">اضغط لاختيار ملف من جهازك</p>
                           <p className="text-xs">PDF, Word, Images</p>
                        </div>
                     )}
                  </div>

                  {/* Document Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المستند</label>
                        <input 
                           type="text" 
                           required
                           className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                           value={uploadData.name}
                           onChange={e => setUploadData({ ...uploadData, name: e.target.value })}
                           placeholder="مثال: عقد بيع ابتدائي"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التصنيف</label>
                        <select
                           className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                           value={uploadData.docType}
                           onChange={e => setUploadData({ ...uploadData, docType: e.target.value })}
                        >
                           {uploadData.targetType === 'case' ? (
                              <>
                                 <option value="contract">عقد</option>
                                 <option value="ruling">حكم</option>
                                 <option value="notice">إعلان/إنذار</option>
                                 <option value="minutes">محضر</option>
                                 <option value="other">عام</option>
                              </>
                           ) : (
                              <>
                                 <option value="national_id">بطاقة هوية</option>
                                 <option value="poa">توكيل</option>
                                 <option value="commercial_register">سجل تجاري</option>
                                 <option value="contract">عقد</option>
                                 <option value="other">أخرى</option>
                              </>
                           )}
                        </select>
                     </div>
                  </div>

                  {uploadData.targetType === 'case' && (
                     <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <input type="checkbox" checked={uploadData.isOriginal} onChange={e => setUploadData({ ...uploadData, isOriginal: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                        نسخة أصلية
                     </label>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">إلغاء</button>
                     <button 
                        type="submit" 
                        disabled={!uploadData.file || !uploadData.name || !uploadData.targetId} 
                        className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                        <Check className="w-4 h-4" /> حفظ المستند
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && !readOnly && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">إضافة مهمة جديدة</h3>
                  <button onClick={() => setIsTaskModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               
               <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">عنوان المهمة</label>
                     <input 
                        type="text" 
                        value={taskData.title}
                        onChange={e => setTaskData({...taskData, title: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="أدخل عنوان المهمة"
                        required
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الاستحقاق</label>
                        <input 
                           type="date" 
                           value={taskData.dueDate}
                           onChange={e => setTaskData({...taskData, dueDate: e.target.value})}
                           className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                           required
                        />
                     </div>
                     
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأولوية</label>
                        <select 
                           value={taskData.priority}
                           onChange={e => setTaskData({...taskData, priority: e.target.value as 'high' | 'medium' | 'low'})}
                           className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                           <option value="high">عاجل</option>
                           <option value="medium">متوسط</option>
                           <option value="low">عادي</option>
                        </select>
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">القضية المرتبطة (اختياري)</label>
                     <select 
                        value={taskData.relatedCaseId}
                        onChange={e => setTaskData({...taskData, relatedCaseId: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                     >
                        <option value="">بدون ارتباط</option>
                        {cases.map(c => (
                           <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                        ))}
                     </select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                     <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-lg">إلغاء</button>
                     <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">إضافة المهمة</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
