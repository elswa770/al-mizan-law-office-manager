
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Client, Case, CaseStatus, POAFile, ClientType, Hearing, ClientDocument, ClientStatus } from '../types';
import { ArrowRight, User, Phone, MapPin, Mail, FileText, Calendar, Briefcase, Hash, Save, X, ScrollText, AlertTriangle, Upload, Eye, CheckCircle, Trash2, Edit3, Plus, File, Building2, Wallet, BellRing, PhoneCall, MessageCircle, MoreVertical, Clock } from 'lucide-react';
import { DocumentService } from '../services/documentService';

interface ClientDetailsProps {
  clientId: string;
  clients: Client[];
  cases: Case[];
  hearings?: Hearing[]; // Make optional or required based on App.tsx update
  onBack: () => void;
  onCaseClick: (caseId: string) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ clientId, clients, cases, hearings = [], onBack, onCaseClick, onUpdateClient, onDeleteClient }) => {
  const client = clients.find(c => c.id === clientId);
  const clientCases = cases.filter(c => c.clientId === clientId);
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'documents' | 'finance'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  
  // Doc Upload State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [newDocData, setNewDocData] = useState<Partial<ClientDocument>>({ type: 'poa', name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firebaseDocuments, setFirebaseDocuments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Firebase documents on component mount
  useEffect(() => {
    if (clientId) {
      loadClientDocuments();
    }
  }, [clientId]);

  const loadClientDocuments = async () => {
    try {
      const documents = await DocumentService.getClientDocuments(clientId);
      setFirebaseDocuments(documents);
      console.log('📥 Loaded client documents:', documents.length);
    } catch (error) {
      console.error('❌ Error loading client documents:', error);
    }
  };

  if (!client) return <div className="p-10 text-center dark:text-white">الموكل غير موجود</div>;

  // --- Derived Stats & Data ---
  const activeCasesCount = clientCases.filter(c => c.status !== CaseStatus.CLOSED && c.status !== CaseStatus.ARCHIVED).length;
  
  // Calculate financial stats from transaction history for all client cases
  const clientFinancialStats = useMemo(() => {
    let totalAgreed = 0;
    let totalCollected = 0;
    let totalExpenses = 0;

    clientCases.forEach(c => {
      if (c.finance) {
        totalAgreed += c.finance.agreedFees || 0;
        
        // Calculate collected from payment history
        const caseCollected = c.finance.history?.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + tx.amount, 0) || 0;
        totalCollected += caseCollected;
        
        // Calculate expenses from expense history
        const caseExpenses = c.finance.history?.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0) || 0;
        totalExpenses += caseExpenses;
      }
    });

    const totalDues = totalAgreed - totalCollected;
    const netIncome = totalCollected - totalExpenses;

    return { totalAgreed, totalCollected, totalExpenses, totalDues, netIncome };
  }, [clientCases]);

  const totalDues = clientFinancialStats.totalDues;
  const totalPaid = clientFinancialStats.totalCollected;
  
  // Get Alerts
  const alerts = [];
  // 1. POA Expiry
  if (client.poaExpiry) {
     const expiry = new Date(client.poaExpiry);
     const today = new Date();
     const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
     if (diffDays < 0) alerts.push({ type: 'critical', msg: 'التوكيل منتهي الصلاحية' });
     else if (diffDays <= 7) alerts.push({ type: 'critical', msg: `تحذير: التوكيل ينتهي خلال ${diffDays} أيام` });
     else if (diffDays < 30) alerts.push({ type: 'warning', msg: `التوكيل ينتهي خلال ${diffDays} يوم` });
  }
  // 2. Risk Cases (Active but no future hearing)
  const riskyCases = clientCases.filter(c => {
     if (c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED) return false;
     const futureHearing = hearings.find(h => h.caseId === c.id && new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)));
     return !futureHearing;
  });
  if (riskyCases.length > 0) alerts.push({ type: 'warning', msg: `يوجد ${riskyCases.length} قضايا نشطة بدون جلسات قادمة` });
  // 3. Financials
  if (totalDues && totalDues > 5000) alerts.push({ type: 'info', msg: `مستحقات مالية مرتفعة: ${totalDues.toLocaleString()} ج.م` });


  // --- Handlers ---
  const handleOpenEdit = () => {
    setFormData({ ...client });
    setIsEditModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateClient && formData.name) {
       onUpdateClient({ ...client, ...formData } as Client);
       setIsEditModalOpen(false);
    }
  };

  const handleDeleteClient = () => {
    if (onDeleteClient) {
      // التحقق من وجود قضايا مرتبطة بالموكل
      const clientCases = cases.filter(c => c.clientId === clientId);
      
      if (clientCases.length > 0) {
        // عرض رسالة تحذير مع تفاصيل القضايا المرتبطة
        const caseDetails = clientCases.map(c => `• ${c.title} (${c.caseNumber}/${c.year})`).join('\n');
        const confirmed = window.confirm(
          `⚠️ لا يمكن حذف هذا الموكل لأنه مرتبط بالقضايا التالية:\n\n${caseDetails}\n\n` +
          `عدد القضايا: ${clientCases.length}\n\n` +
          `يجب حذف القضايا أولاً أو نقلها إلى موكل آخر قبل حذف الموكل.\n\n` +
          `هل تريد عرض القضايا المرتبطة؟`
        );
        
        if (confirmed) {
          // الانتقال إلى صفحة القضايا
          onBack(); // العودة للخلف أولاً
          setTimeout(() => {
            // يمكن إضافة فلترة للقضايا هنا إذا لزم الأمر
            window.location.hash = '#cases';
          }, 100);
        }
        return;
      }
      
      // تأكيد الحذف (فقط إذا لم يكن هناك قضايا مرتبطة)
      const confirmed = window.confirm('هل أنت متأكد من حذف هذا الموكل؟ لا يمكن التراجع عن هذا الإجراء.');
      if (confirmed) {
        onDeleteClient(clientId);
      }
    }
  };

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
        if (!newDocData.name) setNewDocData({ ...newDocData, name: e.target.files[0].name });
     }
  };

  const handleSaveDocument = async () => {
     if (onUpdateClient && selectedFile && newDocData.name) {
        try {
          console.log('🚀 Starting client document upload with Firebase Storage');
          
          // رفع المستند إلى Firebase Storage
          const documentData = {
            title: newDocData.name,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            category: newDocData.type === 'poa' ? 'legal' : 'other' as any,
            uploadedBy: 'current-user',
            isOriginal: true,
            clientId: client.id
          };

          const documentId = await DocumentService.uploadDocument(selectedFile, documentData);
          console.log('✅ Client document uploaded successfully:', documentId);

          // تحديث المستند المحلي أيضاً (للعرض الفوري)
          const newLocalDoc: ClientDocument = {
             id: Math.random().toString(36).substring(2, 9),
             type: newDocData.type as any,
             name: newDocData.name,
             url: URL.createObjectURL(selectedFile),
             uploadDate: new Date().toISOString().split('T')[0],
             issueDate: newDocData.issueDate,
             expiryDate: newDocData.expiryDate,
             notes: newDocData.notes
          };
          
          let updatedClient = { ...client, documents: [...(client.documents || []), newLocalDoc] };

          // If it's a POA, update the client's main expiration date for global alerts
          if (newDocData.type === 'poa' && newDocData.expiryDate) {
             updatedClient.poaExpiry = newDocData.expiryDate;
          }

          onUpdateClient(updatedClient);
          setIsDocModalOpen(false);
          setNewDocData({ type: 'poa', name: '' });
          setSelectedFile(null);
          
          // تحديث قائمة المستندات
          await loadClientDocuments();
          
        } catch (error) {
          console.error('❌ Error uploading client document:', error);
          alert('حدث خطأ أثناء رفع المستند. يرجى المحاولة مرة أخرى.');
        }
     }
  };

  // --- Render Sections ---

  const renderSidebar = () => (
     <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
           <div className={`h-24 ${client.status === ClientStatus.ACTIVE ? 'bg-slate-800' : 'bg-slate-400'} relative`}>
              <button onClick={handleOpenEdit} className="absolute top-3 left-3 p-1.5 bg-white/20 hover:bg-white/40 rounded text-white transition-colors">
                 <Edit3 className="w-4 h-4" />
              </button>
              {onDeleteClient && (
                <button 
                  onClick={handleDeleteClient} 
                  className="absolute top-3 right-3 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded text-white transition-colors" 
                  title="حذف الموكل"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
           </div>
           <div className="px-6 pb-6 -mt-10 relative">
              <div className="flex justify-between items-end mb-4">
                 <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-md">
                    <div className={`w-full h-full rounded-lg flex items-center justify-center text-3xl font-bold ${client.type === ClientType.COMPANY ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'}`}>
                       {client.type === ClientType.COMPANY ? <Building2 className="w-8 h-8" /> : <User className="w-8 h-8" />}
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold border ${client.status === ClientStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
                    {client.status}
                 </div>
              </div>
              
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">{client.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-4">{client.nationalId}</p>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                 <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span dir="ltr">{client.phone}</span>
                 </div>
                 {client.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                       <Mail className="w-4 h-4 text-slate-400" />
                       <span>{client.email}</span>
                    </div>
                 )}
                 <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span>{client.address || 'العنوان غير مسجل'}</span>
                 </div>
                 {client.companyRepresentative && (
                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                       <User className="w-4 h-4 text-slate-400 mt-0.5" />
                       <span>يمثلها: {client.companyRepresentative}</span>
                    </div>
                 )}
                 {client.poaExpiry && (
                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                       <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
                       <span className={new Date(client.poaExpiry) < new Date() ? "text-red-500 font-bold" : ""}>
                          ينتهي التوكيل: {client.poaExpiry}
                       </span>
                    </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6">
                 <button onClick={() => window.open(`tel:${client.phone}`)} className="flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors">
                    <PhoneCall className="w-4 h-4" /> اتصال
                 </button>
                 <button onClick={() => window.open(`https://wa.me/2${client.phone}`, '_blank')} className="flex items-center justify-center gap-2 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 text-sm font-medium transition-colors">
                    <MessageCircle className="w-4 h-4" /> واتساب
                 </button>
              </div>
           </div>
        </div>

        {/* Alerts Section (Sidebar) */}
        {alerts.length > 0 && (
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <BellRing className="w-5 h-5 text-amber-500" /> تنبيهات هامة
              </h3>
              <div className="space-y-3">
                 {alerts.map((alert, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                       alert.type === 'critical' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                       alert.type === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                       <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                       <span>{alert.msg}</span>
                    </div>
                 ))}
              </div>
           </div>
        )}
     </div>
  );

  // --- TABS CONTENT ---

  const renderOverviewTab = () => (
     <div className="space-y-6 animate-in fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">القضايا النشطة</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeCasesCount}</p>
           </div>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">إجمالي المستحقات</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{(totalDues || 0).toLocaleString()} ج.م</p>
           </div>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">إجمالي المدفوعات</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(totalPaid || 0).toLocaleString()} ج.م</p>
           </div>
        </div>

        {/* Recent Cases Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4">آخر القضايا</h3>
           <div className="space-y-4">
              {clientCases.slice(0, 3).map(c => (
                 <div key={c.id} onClick={() => onCaseClick(c.id)} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <div>
                       <p className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.caseNumber} / {c.year} - {c.court}</p>
                    </div>
                    <div className="text-right">
                       <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${c.status === CaseStatus.OPEN ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {c.status}
                       </span>
                    </div>
                 </div>
              ))}
              {clientCases.length === 0 && <p className="text-slate-500 text-sm text-center">لا توجد قضايا مسجلة</p>}
              {clientCases.length > 3 && <button onClick={() => setActiveTab('cases')} className="w-full text-center text-xs text-primary-600 dark:text-primary-400 font-bold mt-2">عرض الكل</button>}
           </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">ملاحظات عامة</h3>
              <button onClick={handleOpenEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Edit3 className="w-4 h-4"/></button>
           </div>
           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {client.notes || 'لا توجد ملاحظات مسجلة.'}
           </p>
        </div>
     </div>
  );

  const renderCasesTab = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
       <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white">سجل القضايا ({clientCases.length})</h3>
       </div>
       <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {clientCases.map(c => {
             const nextHearing = hearings.find(h => h.caseId === c.id && new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)));
             const isRisky = c.status === CaseStatus.OPEN && !nextHearing;

             return (
                <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isRisky ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {isRisky ? <AlertTriangle className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                         </div>
                         <div>
                            <h4 onClick={() => onCaseClick(c.id)} className="font-bold text-slate-800 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                               {c.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{c.caseNumber} / {c.year} • {c.court}</p>
                         </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-medium">{c.status}</span>
                   </div>
                   
                   <div className="flex items-center gap-6 mt-3 pl-12">
                      {nextHearing ? (
                         <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                            <Calendar className="w-3 h-3" />
                            <span>جلسة قادمة: {nextHearing.date}</span>
                         </div>
                      ) : (
                         c.status === CaseStatus.OPEN && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
                               <AlertTriangle className="w-3 h-3" />
                               <span>لا توجد جلسات مجدولة (مطلوب تحديد جلسة)</span>
                            </div>
                         )
                      )}
                   </div>
                </div>
             );
          })}
          {clientCases.length === 0 && <div className="p-8 text-center text-slate-400">لا توجد قضايا</div>}
       </div>
    </div>
  );

  const renderDocumentsTab = () => (
     <div className="space-y-4 animate-in fade-in">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="font-bold text-slate-800 dark:text-white">المستندات القانونية</h3>
           <button onClick={() => setIsDocModalOpen(true)} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2">
              <Upload className="w-4 h-4" /> رفع مستند
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Firebase Documents */}
           {firebaseDocuments.length > 0 && (
              <div className="col-span-full mb-4">
                 <h4 className="font-medium text-slate-600 dark:text-slate-300 mb-3">المستندات المرفوعة (Firebase)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {firebaseDocuments.map(doc => (
                       <div key={doc.id} className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="flex items-start justify-between">
                             <div className="flex items-start gap-3">
                                <div className="bg-green-100 dark:bg-green-800 p-2.5 rounded-lg text-green-600 dark:text-green-300">
                                   <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="font-bold text-green-900 dark:text-green-200 text-sm">{doc.title}</p>
                                   <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className="text-[10px] bg-green-100 dark:bg-green-800 px-1.5 py-0.5 rounded text-green-700 dark:text-green-300">
                                         {DocumentService.getFileIcon(doc.fileType)} {doc.category}
                                      </span>
                                      <span className="text-[10px] text-green-600 dark:text-green-400">
                                         {DocumentService.formatFileSize(doc.fileSize)}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg">
                                <Eye className="w-4 h-4" />
                             </a>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Legacy Documents */}
           {[...(client.documents || []), ...(client.poaFiles || [])].map(f => ({
              id: f.id,
              type: 'poa',
              name: f.name,
              url: f.url,
              uploadDate: f.uploadDate,
              expiryDate: client.poaExpiry
           }) as ClientDocument).map((doc, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between group">
                 <div className="flex items-start gap-3">
                    <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-lg text-slate-500 dark:text-slate-400">
                       <FileText className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="font-bold text-slate-800 dark:text-white text-sm">{doc.name}</p>
                       <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                             {doc.type === 'poa' ? 'توكيل' : doc.type === 'national_id' ? 'بطاقة هوية' : 'مستند'}
                          </span>
                          {doc.expiryDate && (
                             <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${new Date(doc.expiryDate) < new Date() ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {new Date(doc.expiryDate) < new Date() ? 'منتهي' : 'ساري'}
                             </span>
                          )}
                          {doc.issueDate && doc.type === 'poa' && (
                             <span className="text-[10px] text-slate-400">إصدار: {doc.issueDate}</span>
                          )}
                       </div>
                    </div>
                 </div>
                 <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                    <Eye className="w-4 h-4" />
                 </a>
              </div>
           ))}}
           {firebaseDocuments.length === 0 && [...(client.documents || []), ...(client.poaFiles || [])].length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                 <File className="w-10 h-10 mx-auto mb-2 opacity-50" />
                 <p>لا توجد مستندات مرفقة</p>
              </div>
           )}
        </div>
     </div>
  );

  const renderFinanceTab = () => (
     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              كشف حساب الموكل
           </h3>
           <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400 ml-2">إجمالي المتبقي:</span>
              <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">{(totalDues || 0).toLocaleString()} ج.م</span>
           </div>
        </div>
        <table className="w-full text-sm text-right">
           <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-600">
              <tr>
                 <th className="p-4">القضية</th>
                 <th className="p-4">قيمة الأتعاب</th>
                 <th className="p-4">المدفوع</th>
                 <th className="p-4">المصروفات</th>
                 <th className="p-4">المتبقي</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {clientCases.map(c => {
                 if (!c.finance) return null;
                 const remaining = (c.finance.agreedFees || 0) - (c.finance.paidAmount || 0);
                 return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200">
                       <td className="p-4 font-medium">{c.title}</td>
                       <td className="p-4">{(c.finance.agreedFees || 0).toLocaleString()}</td>
                       <td className="p-4 text-green-700 dark:text-green-400">{(c.finance.paidAmount || 0).toLocaleString()}</td>
                       <td className="p-4 text-amber-700 dark:text-amber-400">{(c.finance.expenses || 0).toLocaleString()}</td>
                       <td className={`p-4 font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                          {remaining > 0 ? remaining.toLocaleString() : 'خالص'}
                       </td>
                    </tr>
                 )
              })}
           </tbody>
        </table>
     </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Top Nav */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowRight className="w-4 h-4" /> <span>عودة لقائمة الموكلين</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* 2. Sidebar Profile */}
         <div>{renderSidebar()}</div>
         
         {/* 3. Main Content Area */}
         <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex">
               {[
                  { id: 'overview', label: 'نظرة عامة', icon: Briefcase },
                  { id: 'cases', label: 'القضايا', icon: FileText },
                  { id: 'documents', label: 'المستندات', icon: File },
                  { id: 'finance', label: 'الحسابات', icon: Wallet },
               ].map(tab => {
                  const Icon = tab.icon;
                  return (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-800 dark:bg-slate-700 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                     >
                        <Icon className="w-4 h-4" /> {tab.label}
                     </button>
                  )
               })}
            </div>

            <div className="min-h-[400px]">
               {activeTab === 'overview' && renderOverviewTab()}
               {activeTab === 'cases' && renderCasesTab()}
               {activeTab === 'documents' && renderDocumentsTab()}
               {activeTab === 'finance' && renderFinanceTab()}
            </div>
         </div>
      </div>

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">تعديل بيانات الموكل</h3>
              <form onSubmit={handleSaveClient} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع الموكل</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                           <option value={ClientType.INDIVIDUAL}>فرد</option>
                           <option value={ClientType.COMPANY}>شركة</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الحالة</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                           <option value={ClientStatus.ACTIVE}>نشط</option>
                           <option value={ClientStatus.INACTIVE}>موقوف</option>
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الرقم القومي / السجل</label>
                    <input type="text" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="رقم الهاتف" required dir="ltr"/>
                    <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="البريد الإلكتروني" dir="ltr"/>
                 </div>
                 <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="العنوان" />
                 <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="ملاحظات..." rows={3}></textarea>
                 
                 <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg">إلغاء</button>
                    <button type="submit" className="flex-1 bg-primary-600 text-white p-2 rounded-lg">حفظ</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Upload Doc Modal */}
      {isDocModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">إضافة مستند جديد</h3>
               <div className="space-y-3">
                  <select value={newDocData.type} onChange={e => setNewDocData({...newDocData, type: e.target.value as any})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                     <option value="national_id">بطاقة رقم قومي</option>
                     <option value="poa">توكيل</option>
                     <option value="commercial_register">سجل تجاري</option>
                     <option value="contract">عقد</option>
                     <option value="other">أخرى</option>
                  </select>
                  
                  {/* Additional Dates for POA */}
                  {newDocData.type === 'poa' && (
                     <div className="grid grid-cols-2 gap-3 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 animate-in fade-in">
                        <div>
                           <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">تاريخ الإصدار</label>
                           <input 
                              type="date" 
                              className="w-full border p-1.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                              value={newDocData.issueDate || ''}
                              onChange={e => setNewDocData({...newDocData, issueDate: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">تاريخ الانتهاء</label>
                           <input 
                              type="date" 
                              className="w-full border p-1.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                              value={newDocData.expiryDate || ''}
                              onChange={e => setNewDocData({...newDocData, expiryDate: e.target.value})}
                           />
                        </div>
                        <div className="col-span-2 text-[10px] text-amber-600 dark:text-amber-500">
                           * سيتم تفعيل التنبيهات تلقائياً قبل انتهاء التوكيل بأسبوع.
                        </div>
                     </div>
                  )}

                  <input type="text" placeholder="اسم المستند (مثال: توكيل عام 2024)" value={newDocData.name} onChange={e => setNewDocData({...newDocData, name: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  <textarea placeholder="ملاحظات..." value={newDocData.notes || ''} onChange={e => setNewDocData({...newDocData, notes: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={2}></textarea>
                  
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleDocFileSelect} />
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                     {selectedFile ? (
                        <p className="text-primary-600 font-bold">{selectedFile.name}</p>
                     ) : (
                        <div className="text-slate-500">
                           <Upload className="w-6 h-6 mx-auto mb-1" />
                           <span className="text-sm">اضغط لاختيار ملف</span>
                        </div>
                     )}
                  </div>
               </div>
               <div className="flex gap-2 mt-4">
                  <button onClick={() => setIsDocModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg">إلغاء</button>
                  <button onClick={handleSaveDocument} disabled={!selectedFile || !newDocData.name} className="flex-1 bg-primary-600 text-white p-2 rounded-lg disabled:opacity-50">رفع المستند</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ClientDetails;
