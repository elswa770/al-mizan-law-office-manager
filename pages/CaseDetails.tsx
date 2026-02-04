
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Case, Client, Hearing, CaseStatus, CourtType, CaseDocument, CaseNote, CaseMemo, ClientRole, Opponent, CaseStrategy, CaseFinance, CaseRuling, FinancialTransaction, PaymentMethod, HearingAttachment, HearingStatus } from '../types';
import { ArrowRight, User, MapPin, Phone, Calendar, Gavel, AlertCircle, FileText, X, Edit3, Link as LinkIcon, ExternalLink, Save, Upload, Trash2, File, Image as ImageIcon, Plus, MessageSquare, FileType, AlertTriangle, Printer, Clock, Shield, DollarSign, ScrollText, CheckSquare, Search, Lock, Eye, Download, CheckCircle, List, FolderOpen, History, Briefcase, UserCheck, Wallet, TrendingUp, TrendingDown, CreditCard, Banknote, Smartphone, Building, Calculator, Paperclip, ArrowDownLeft, ArrowUpRight, FileCheck, BarChart3 } from 'lucide-react';

interface CaseDetailsProps {
  caseId: string;
  cases: Case[];
  clients: Client[];
  hearings: Hearing[];
  onBack: () => void;
  onAddHearing?: (hearing: Hearing) => void;
  onUpdateCase?: (updatedCase: Case) => void;
  onUpdateHearing?: (hearing: Hearing) => void;
  onClientClick?: (clientId: string) => void;
}

const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId, cases, clients, hearings, onBack, onAddHearing, onUpdateCase, onUpdateHearing, onClientClick }) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'documents' | 'memos' | 'ruling' | 'finance'>('overview');
  const [docSearchTerm, setDocSearchTerm] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null); // For general upload button
  const hearingFileInputRef = useRef<HTMLInputElement>(null); // For hearing attachments
  const rulingFileInputRef = useRef<HTMLInputElement>(null); // For ruling files
  
  // Modals State
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [isEditCaseModalOpen, setIsEditCaseModalOpen] = useState(false);
  const [isOpponentModalOpen, setIsOpponentModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false); // Used for editing Agreed Fees
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false); // New: For adding payments/expenses
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isRulingModalOpen, setIsRulingModalOpen] = useState(false);

  // Forms Data
  const [editCaseData, setEditCaseData] = useState<Partial<Case>>({});
  const [newOpponent, setNewOpponent] = useState<Partial<Opponent>>({ name: '', role: '', lawyer: '', address: '' });
  
  // Hearing State
  const [newHearingData, setNewHearingData] = useState<Partial<Hearing>>({ date: '', time: '', requirements: '', clientRequirements: '' });
  const [hearingFiles, setHearingFiles] = useState<File[]>([]); // New state for hearing files
  const [editingHearingId, setEditingHearingId] = useState<string | null>(null);
  
  const [strategyFormData, setStrategyFormData] = useState<Partial<CaseStrategy>>({ strengthPoints: '', weaknessPoints: '', plan: '', privateNotes: '' });
  
  // Finance State
  const [financeFormData, setFinanceFormData] = useState<Partial<CaseFinance>>({ agreedFees: 0, paidAmount: 0, expenses: 0 });
  const [transactionData, setTransactionData] = useState<{
    type: 'payment' | 'expense';
    amount: number;
    date: string;
    method: PaymentMethod;
    description: string;
    category?: string;
  }>({
    type: 'payment',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    description: '',
    category: ''
  });
  
  // Ruling State
  const [rulingFormData, setRulingFormData] = useState<Partial<CaseRuling>>({ date: new Date().toISOString().split('T')[0], type: 'preliminary', summary: '', isAppealable: true });
  const [selectedRulingFile, setSelectedRulingFile] = useState<File | null>(null);
  const [editingRulingId, setEditingRulingId] = useState<string | null>(null);

  // Document Upload State
  const [newDocData, setNewDocData] = useState<Partial<CaseDocument>>({ name: '', type: 'pdf', category: 'other', isOriginal: false });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Memo State
  const [newMemoData, setNewMemoData] = useState<Partial<CaseMemo>>({ title: '', type: 'defense', submissionDate: new Date().toISOString().split('T')[0] });
  const [selectedMemoFile, setSelectedMemoFile] = useState<File | null>(null);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

  // Data State (Derived)
  const caseData = cases.find(c => c.id === caseId);
  const client = clients.find(c => c.id === caseData?.clientId);
  const caseHearings = hearings
    .filter(h => h.caseId === caseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper: Get Latest Ruling
  const getLatestRuling = () => {
    if (!caseData?.rulings || caseData.rulings.length === 0) {
      // Fallback for legacy 'ruling' object if 'rulings' array is empty
      if (caseData?.ruling) return caseData.ruling;
      return null;
    }
    // Sort by date descending
    return [...caseData.rulings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const latestRuling = getLatestRuling();

  // Next Hearing Logic
  const nextHearing = hearings
    .filter(h => h.caseId === caseId && new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // --- Countdown Timer Logic ---
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!nextHearing) return;
    const calculateTimeLeft = () => {
      const difference = +new Date(nextHearing.date) - +new Date();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        return `${days} يوم و ${hours} ساعة`;
      }
      return 'اليوم';
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [nextHearing]);

  // --- Helper Functions ---
  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.OPEN: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case CaseStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case CaseStatus.DISMISSED: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case CaseStatus.CLOSED: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      case CaseStatus.JUDGMENT: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case CaseStatus.EXECUTION: return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getDocIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-600" />;
      case 'word': return <FileType className="w-6 h-6 text-blue-600" />; 
      case 'image': return <ImageIcon className="w-6 h-6 text-purple-600" />;
      default: return <File className="w-6 h-6 text-slate-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File): 'pdf' | 'image' | 'word' | 'other' => {
    if (file.type.includes('pdf')) return 'pdf';
    else if (file.type.includes('image')) return 'image';
    else if (file.type.includes('word') || file.type.includes('document')) return 'word';
    return 'other';
  };

  // --- Handlers ---
  
  // Case Info
  const handleOpenEditCase = () => {
    if (caseData) {
      setEditCaseData({ ...caseData });
      setIsEditCaseModalOpen(true);
    }
  };

  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseData && onUpdateCase) {
      onUpdateCase({ ...caseData, ...editCaseData } as Case);
      setIsEditCaseModalOpen(false);
    }
  };

  // Opponents
  const handleSaveOpponent = () => {
    if (caseData && onUpdateCase && newOpponent.name) {
      const updatedOpponents = [
        ...(caseData.opponents || []),
        { 
          id: Math.random().toString(36).substring(2, 9),
          name: newOpponent.name,
          role: newOpponent.role || 'خصم',
          lawyer: newOpponent.lawyer,
          address: newOpponent.address
        } as Opponent
      ];
      onUpdateCase({ ...caseData, opponents: updatedOpponents });
      setNewOpponent({ name: '', role: '', lawyer: '', address: '' });
      setIsOpponentModalOpen(false);
    }
  };

  // Hearings Logic
  const handleOpenHearingModal = () => {
    setNewHearingData({ date: '', time: '', requirements: '', clientRequirements: '' });
    setHearingFiles([]); // Reset files
    setEditingHearingId(null);
    setIsHearingModalOpen(true);
  };

  const handleEditHearing = (hearing: Hearing) => {
    setNewHearingData({
        date: hearing.date,
        time: hearing.time,
        requirements: hearing.requirements,
        clientRequirements: hearing.clientRequirements
    });
    setHearingFiles([]); // In edit mode, we currently only support adding NEW files
    setEditingHearingId(hearing.id);
    setIsHearingModalOpen(true);
  };

  const handleHearingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setHearingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeHearingFile = (index: number) => {
    setHearingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveHearing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !newHearingData.date) return;

    // Convert new files to HearingAttachment objects
    const newAttachments: HearingAttachment[] = hearingFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      type: getFileType(file),
      uploadDate: new Date().toISOString().split('T')[0]
    }));

    if (editingHearingId && onUpdateHearing) {
        // Update Existing
        const hearingToUpdate = hearings.find(h => h.id === editingHearingId);
        if (hearingToUpdate) {
            onUpdateHearing({
                ...hearingToUpdate,
                date: newHearingData.date!,
                time: newHearingData.time,
                requirements: newHearingData.requirements,
                clientRequirements: newHearingData.clientRequirements,
                attachments: [...(hearingToUpdate.attachments || []), ...newAttachments]
            });
        }
    } else if (onAddHearing) {
        // Add New
        onAddHearing({
            id: Math.random().toString(36).substring(2, 9),
            caseId: caseData.id,
            date: newHearingData.date!,
            time: newHearingData.time,
            requirements: newHearingData.requirements,
            clientRequirements: newHearingData.clientRequirements,
            type: 'session',
            status: HearingStatus.SCHEDULED,
            attachments: newAttachments
        });
    }
    
    setNewHearingData({ date: '', time: '', requirements: '', clientRequirements: '' });
    setHearingFiles([]);
    setEditingHearingId(null);
    setIsHearingModalOpen(false);
  };

  // Strategy
  const handleOpenStrategy = () => {
     if (caseData) {
        setStrategyFormData(caseData.strategy || { strengthPoints: '', weaknessPoints: '', plan: '', privateNotes: '' });
        setIsStrategyModalOpen(true);
     }
  };

  const handleSaveStrategy = (e: React.FormEvent) => {
     e.preventDefault();
     if (caseData && onUpdateCase) {
        onUpdateCase({ ...caseData, strategy: strategyFormData as CaseStrategy });
        setIsStrategyModalOpen(false);
     }
  };

  // Finance Handlers
  const handleOpenFinance = () => {
     if (caseData) {
        setFinanceFormData({ 
            agreedFees: caseData.finance?.agreedFees || 0,
            paidAmount: caseData.finance?.paidAmount || 0, 
            expenses: caseData.finance?.expenses || 0
        });
        setIsFinanceModalOpen(true);
     }
  };

  const handleSaveFinance = (e: React.FormEvent) => {
     e.preventDefault();
     if (caseData && onUpdateCase) {
        const updatedFinance: CaseFinance = {
            ...caseData.finance!,
            agreedFees: financeFormData.agreedFees || 0,
        };
        onUpdateCase({ ...caseData, finance: updatedFinance });
        setIsFinanceModalOpen(false);
     }
  };

  const handleOpenTransactionModal = (type: 'payment' | 'expense') => {
      setTransactionData({
          type,
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          method: 'cash',
          description: '',
          category: type === 'expense' ? 'إدارية' : ''
      });
      setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!caseData || !onUpdateCase) return;

      const newTx: FinancialTransaction = {
          id: Math.random().toString(36).substring(2, 9),
          date: transactionData.date,
          amount: Number(transactionData.amount),
          type: transactionData.type,
          method: transactionData.type === 'payment' ? transactionData.method : undefined,
          category: transactionData.type === 'expense' ? (transactionData.category || 'نثريات') : undefined,
          description: transactionData.description,
          recordedBy: 'المحامي' 
      };

      const currentFinance = caseData.finance || { agreedFees: 0, paidAmount: 0, expenses: 0, history: [] };
      const newHistory = [...(currentFinance.history || []), newTx];
      
      const newPaid = transactionData.type === 'payment' ? currentFinance.paidAmount + newTx.amount : currentFinance.paidAmount;
      const newExpenses = transactionData.type === 'expense' ? currentFinance.expenses + newTx.amount : currentFinance.expenses;

      onUpdateCase({
          ...caseData,
          finance: {
              ...currentFinance,
              paidAmount: newPaid,
              expenses: newExpenses,
              history: newHistory
          }
      });

      setIsTransactionModalOpen(false);
      setTransactionData({
        type: 'payment',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        description: '',
        category: ''
      });
  };

  // Ruling Handlers
  const handleOpenRulingModal = (ruling?: CaseRuling) => {
    if (ruling) {
      setRulingFormData(ruling);
      setEditingRulingId(ruling.id);
      setSelectedRulingFile(null); 
    } else {
      setRulingFormData({
         date: new Date().toISOString().split('T')[0],
         type: 'final',
         summary: '',
         details: '',
         isAppealable: true
      });
      setEditingRulingId(null);
      setSelectedRulingFile(null);
    }
    setIsRulingModalOpen(true);
  };

  const handleRulingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedRulingFile(e.target.files[0]);
    }
  };

  const handleSaveRuling = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseData && onUpdateCase && rulingFormData.summary) {
      const fileUrl = selectedRulingFile ? URL.createObjectURL(selectedRulingFile) : (editingRulingId ? rulingFormData.url : undefined);
      const fileName = selectedRulingFile ? selectedRulingFile.name : (editingRulingId ? rulingFormData.documentName : undefined);

      let updatedRulings = [...(caseData.rulings || [])];
      let updatedDocuments = [...(caseData.documents || [])];

      if (selectedRulingFile && fileUrl) {
         updatedDocuments.push({
            id: Math.random().toString(36).substring(2, 9),
            name: selectedRulingFile.name,
            type: getFileType(selectedRulingFile),
            category: 'ruling',
            url: fileUrl,
            size: formatFileSize(selectedRulingFile.size),
            uploadDate: new Date().toISOString().split('T')[0],
            isOriginal: true 
         });
      }

      if (editingRulingId) {
         updatedRulings = updatedRulings.map(r => {
            if (r.id === editingRulingId) {
               return {
                  ...r,
                  date: rulingFormData.date!,
                  type: rulingFormData.type as any,
                  summary: rulingFormData.summary!,
                  details: rulingFormData.details,
                  isAppealable: rulingFormData.isAppealable!,
                  url: fileUrl,
                  documentName: fileName
               };
            }
            return r;
         });
      } else {
         const newRuling: CaseRuling = {
            id: Math.random().toString(36).substring(2, 9),
            date: rulingFormData.date || '',
            type: rulingFormData.type as any,
            summary: rulingFormData.summary || '',
            details: rulingFormData.details,
            isAppealable: rulingFormData.isAppealable || false,
            url: fileUrl,
            documentName: fileName
         };
         updatedRulings.push(newRuling);
      }
      
      onUpdateCase({ 
        ...caseData, 
        rulings: updatedRulings,
        documents: updatedDocuments,
        status: rulingFormData.type === 'final' ? CaseStatus.JUDGMENT : caseData.status 
      });
      setIsRulingModalOpen(false);
    }
  };

  // Documents Logic
  const handleOpenDocumentModal = () => {
    setNewDocData({ name: '', type: 'pdf', category: 'other', isOriginal: false });
    setSelectedFile(null);
    setIsDocumentModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const type = getFileType(file);
      setNewDocData(prev => ({ ...prev, type: type, name: prev.name || file.name }));
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
     e.preventDefault();
     if (caseData && onUpdateCase && newDocData.name && selectedFile) {
        const newDoc: CaseDocument = {
           id: Math.random().toString(36).substring(2, 9),
           name: newDocData.name,
           type: newDocData.type as any,
           category: newDocData.category as any,
           url: URL.createObjectURL(selectedFile), 
           size: formatFileSize(selectedFile.size), 
           uploadDate: new Date().toISOString().split('T')[0],
           isOriginal: newDocData.isOriginal
        };
        onUpdateCase({ ...caseData, documents: [...(caseData.documents || []), newDoc] });
        setIsDocumentModalOpen(false);
        setNewDocData({ name: '', type: 'pdf', category: 'other' });
        setSelectedFile(null);
     }
  };

  // Memos Logic
  const handleOpenMemoModal = () => {
    setNewMemoData({ title: '', type: 'defense', submissionDate: new Date().toISOString().split('T')[0] });
    setSelectedMemoFile(null);
    setEditingMemoId(null);
    setIsMemoModalOpen(true);
  };

  const handleEditMemo = (memo: CaseMemo) => {
    setNewMemoData({
      title: memo.title,
      type: memo.type,
      submissionDate: memo.submissionDate,
      sessionDate: memo.sessionDate,
      notes: memo.notes
    });
    setEditingMemoId(memo.id);
    setSelectedMemoFile(null); 
    setIsMemoModalOpen(true);
  };

  const handleMemoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedMemoFile(e.target.files[0]);
    }
  };

  const handleSaveMemo = (e: React.FormEvent) => {
     e.preventDefault();
     if (caseData && onUpdateCase && newMemoData.title) {
        const fileUrl = selectedMemoFile ? URL.createObjectURL(selectedMemoFile) : undefined;
        
        let updatedMemos = [...(caseData.memos || [])];
        let updatedDocuments = [...(caseData.documents || [])];

        if (selectedMemoFile && fileUrl) {
           updatedDocuments.push({
              id: Math.random().toString(36).substring(2, 9),
              name: `مذكرة: ${newMemoData.title}`,
              type: getFileType(selectedMemoFile),
              category: 'minutes',
              url: fileUrl,
              size: formatFileSize(selectedMemoFile.size),
              uploadDate: new Date().toISOString().split('T')[0],
              isOriginal: false
           });
        }

        if (editingMemoId) {
          updatedMemos = updatedMemos.map(m => {
            if (m.id === editingMemoId) {
              return {
                ...m,
                title: newMemoData.title!,
                type: newMemoData.type as any,
                submissionDate: newMemoData.submissionDate!,
                sessionDate: newMemoData.sessionDate,
                notes: newMemoData.notes,
                url: fileUrl || m.url
              };
            }
            return m;
          });
        } else {
          const newMemo: CaseMemo = {
             id: Math.random().toString(36).substring(2, 9),
             title: newMemoData.title || '',
             type: newMemoData.type as any,
             submissionDate: newMemoData.submissionDate || '',
             sessionDate: newMemoData.sessionDate,
             notes: newMemoData.notes,
             url: fileUrl
          };
          updatedMemos.push(newMemo);
        }

        onUpdateCase({ ...caseData, memos: updatedMemos, documents: updatedDocuments });
        setIsMemoModalOpen(false);
        setNewMemoData({ title: '', type: 'defense', submissionDate: new Date().toISOString().split('T')[0] });
        setSelectedMemoFile(null);
        setEditingMemoId(null);
     }
  };

  const handlePrintSummary = () => {
      window.print();
  };

  if (!caseData) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">القضية غير موجودة</div>;

  // --- RENDER SECTIONS ---

  const renderHeader = () => (
    <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm px-6 py-4 -mx-6 -mt-6 mb-6 transition-colors">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
              <ArrowRight className="w-5 h-5" />
           </button>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-xl font-bold text-slate-900 dark:text-white">{caseData.title}</h1>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(caseData.status)}`}>
                    {caseData.status}
                 </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                 <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                    {caseData.caseNumber} / {caseData.year}
                 </span>
                 <span className="flex items-center gap-1">
                    <Gavel className="w-3 h-3" /> {caseData.court}
                 </span>
              </div>
           </div>
        </div>

        {/* Center: Next Hearing Timer */}
        {nextHearing ? (
          <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-lg border border-primary-100 dark:border-primary-800 flex items-center gap-3">
             <div className="bg-white dark:bg-slate-700 p-2 rounded-full text-primary-600 dark:text-primary-400 shadow-sm">
                <Clock className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mb-0.5">الجلسة القادمة</p>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-slate-800 dark:text-white">{new Date(nextHearing.date).toLocaleDateString('ar-EG')}</span>
                   <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-primary-700 dark:text-primary-300 font-medium shadow-sm border border-primary-100 dark:border-slate-600">
                      {timeLeft}
                   </span>
                </div>
             </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm flex items-center gap-2">
             <CheckSquare className="w-4 h-4" /> لا توجد جلسات مجدولة
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
           <button onClick={handleOpenHearingModal} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
              <Calendar className="w-4 h-4" /> <span>إضافة جلسة</span>
           </button>
           <button onClick={handleOpenDocumentModal} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
              <Upload className="w-4 h-4" /> <span>مستند</span>
           </button>
           <button onClick={handleOpenMemoModal} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
              <ScrollText className="w-4 h-4" /> <span>مذكرة</span>
           </button>
           <button onClick={handlePrintSummary} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="طباعة ملخص">
              <Printer className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 mt-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
         {[
           { id: 'overview', label: 'نظرة عامة', icon: FileText },
           { id: 'timeline', label: 'جدول الجلسات', icon: Calendar },
           { id: 'documents', label: 'المستندات', icon: File },
           { id: 'memos', label: 'المذكرات والمرافعات', icon: ScrollText },
           { id: 'ruling', label: 'الأحكام والتنفيذ', icon: Gavel },
           { id: 'finance', label: 'المصروفات والأتعاب', icon: DollarSign },
         ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-primary-600 text-primary-700 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-900/10' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}
               >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                  {tab.label}
               </button>
            )
         })}
      </div>
    </div>
  );

  const renderOverviewTab = () => (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
        {/* Left Col: Case Info + Parties */}
        <div className="lg:col-span-2 space-y-6">
           {latestRuling && (
              <div className="bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900 border-r-4 border-r-indigo-500">
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <Gavel className="w-5 h-5" />
                      آخر حكم صادر ({latestRuling.date})
                   </h3>
                   <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-medium">
                      {latestRuling.type === 'final' ? 'حكم نهائي' : latestRuling.type === 'preliminary' ? 'حكم تمهيدي' : 'إشكال/تنفيذ'}
                   </span>
                 </div>
                 <p className="text-indigo-900 dark:text-indigo-100 font-medium leading-relaxed">{latestRuling.summary}</p>
                 <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-800 flex gap-4 text-xs">
                    <span className="text-indigo-700 dark:text-indigo-300">قابل للاستئناف: <span className="font-bold">{latestRuling.isAppealable ? 'نعم' : 'لا'}</span></span>
                    {latestRuling.url && (
                        <a href={latestRuling.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline">
                           <LinkIcon className="w-3 h-3" /> عرض ملف الحكم
                        </a>
                    )}
                 </div>
              </div>
           )}

           {/* Case Info Card */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    بيانات القضية الأساسية
                 </h3>
                 <button onClick={handleOpenEditCase} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit3 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">رقم القضية</label>
                    <p className="font-medium text-slate-900 dark:text-white font-mono">{caseData.caseNumber} / {caseData.year}</p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">المحكمة</label>
                    <p className="font-medium text-slate-900 dark:text-white">{caseData.court}</p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الدائرة / الفرع</label>
                    <p className="font-medium text-slate-900 dark:text-white">{caseData.courtBranch || '---'}</p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">مرحلة التقاضي</label>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {caseData.stage === 'primary' ? 'درجة أولى' : caseData.stage === 'appeal' ? 'استئناف' : 'نقض'}
                    </p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">تاريخ القيد</label>
                    <p className="font-medium text-slate-900 dark:text-white font-mono">{caseData.openDate}</p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">القاضي</label>
                    <p className="font-medium text-slate-900 dark:text-white">{caseData.judgeName || '---'}</p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">المحامي المسئول</label>
                    <p className="font-medium text-slate-900 dark:text-white">{caseData.responsibleLawyer || '---'}</p>
                 </div>
              </div>
           </div>

           {/* Parties Section */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                 <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                 أطراف الدعوى
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Client */}
                 <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 relative">
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                       {caseData.clientRole || 'الموكل'}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-700 dark:text-green-300 text-sm">
                          {client?.name.charAt(0)}
                       </div>
                       {client?.name}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                       <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client?.phone}</p>
                       <p className="font-mono text-slate-500 dark:text-slate-400">ID: {client?.nationalId}</p>
                       {client?.poaNumber && (
                         <div className="mt-2 pt-2 border-t border-green-100 dark:border-green-800/50">
                           <p className="font-bold text-green-800 dark:text-green-200 mb-1">بيانات التوكيل:</p>
                           <p>رقم: {client.poaNumber} ({client.poaType})</p>
                         </div>
                       )}
                       <button onClick={() => client && onClientClick && onClientClick(client.id)} className="mt-3 text-xs text-green-700 dark:text-green-400 font-bold hover:underline flex items-center gap-1">
                          عرض الملف الكامل <ArrowUpRight className="w-3 h-3" />
                       </button>
                    </div>
                 </div>

                 {/* Opponent */}
                 <div className="p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 relative">
                    <button onClick={() => setIsOpponentModalOpen(true)} className="absolute top-3 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Edit3 className="w-4 h-4"/></button>
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                       {caseData.opponents && caseData.opponents.length > 0 ? caseData.opponents[0].role : 'الخصم'}
                    </span>
                    <div className="mt-6">
                       {caseData.opponents && caseData.opponents.length > 0 ? (
                          <>
                             <h4 className="font-bold text-slate-800 dark:text-white mb-2">{caseData.opponents[0].name}</h4>
                             <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {caseData.opponents[0].address || 'العنوان غير مسجل'}</p>
                                <p className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> محامي الخصم: {caseData.opponents[0].lawyer || 'غير مسجل'}</p>
                             </div>
                          </>
                       ) : (
                          <div className="text-center py-4 text-slate-400 dark:text-slate-500 cursor-pointer" onClick={() => setIsOpponentModalOpen(true)}>
                             <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                             <p className="text-xs">اضغط لإضافة بيانات الخصم</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Col: Strategy & Notes */}
        <div className="space-y-6">
           {/* Strategy Card */}
           <div className="bg-slate-900 dark:bg-black p-6 rounded-xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-opacity group-hover:opacity-30"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                 <h3 className="font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    استراتيجية الدفاع
                 </h3>
                 <button onClick={handleOpenStrategy} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"><Edit3 className="w-4 h-4 text-indigo-300" /></button>
              </div>
              
              <div className="space-y-4 relative z-10 text-sm">
                 <div>
                    <p className="text-indigo-300 text-xs font-bold uppercase mb-1">نقاط القوة</p>
                    <p className="leading-relaxed opacity-90">{caseData.strategy?.strengthPoints || 'لم يتم التحديد'}</p>
                 </div>
                 <div>
                    <p className="text-red-300 text-xs font-bold uppercase mb-1">نقاط الضعف / الثغرات</p>
                    <p className="leading-relaxed opacity-90">{caseData.strategy?.weaknessPoints || 'لم يتم التحديد'}</p>
                 </div>
                 <div className="pt-3 border-t border-white/10">
                    <p className="text-emerald-300 text-xs font-bold uppercase mb-1">خطة العمل</p>
                    <p className="leading-relaxed opacity-90">{caseData.strategy?.plan || 'لم يتم التحديد'}</p>
                 </div>
              </div>
           </div>

           {/* Notes */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-amber-500" />
                 ملاحظات سريعة
              </h3>
              <div className="space-y-3">
                 {caseData.notes && caseData.notes.length > 0 ? (
                    caseData.notes.slice(0, 3).map(note => (
                       <div key={note.id} className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                          <p>{note.content}</p>
                          <span className="text-[10px] text-amber-600/70 dark:text-amber-500 block mt-1 text-left font-mono">{note.date}</span>
                       </div>
                    ))
                 ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-4">لا توجد ملاحظات</p>
                 )}
              </div>
           </div>
        </div>
     </div>
  );

  const renderTimelineTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">سجل الجلسات ({caseHearings.length})</h3>
            <button onClick={handleOpenHearingModal} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> جلسة جديدة
            </button>
        </div>
        <div className="relative border-r-2 border-slate-200 dark:border-slate-700 space-y-8 mr-4">
            {caseHearings.map(h => {
                const hDate = new Date(h.date);
                const isPast = hDate < new Date();
                return (
                    <div key={h.id} className="relative pr-6">
                        <div className={`absolute -right-[9px] top-0 w-4 h-4 rounded-full border-2 ${isPast ? 'bg-slate-400 border-slate-200 dark:bg-slate-600 dark:border-slate-500' : 'bg-primary-600 border-primary-200 dark:border-primary-800'}`}></div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{h.date}</span>
                                        {h.time && <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">{h.time}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${h.status === 'تمت' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{h.status}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleEditHearing(h)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit3 className="w-4 h-4"/></button>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                                {h.decision ? (
                                    <p className="flex gap-2"><Gavel className="w-4 h-4 text-slate-400"/> <span className="font-bold">القرار:</span> {h.decision}</p>
                                ) : (
                                    <p className="flex gap-2"><AlertCircle className="w-4 h-4 text-amber-500"/> <span className="font-bold">المطلوب:</span> {h.requirements || '---'}</p>
                                )}
                            </div>
                            {h.attachments && h.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                                    {h.attachments.map(att => (
                                        <a key={att.id} href={att.url} target="_blank" className="text-xs flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">
                                            <Paperclip className="w-3 h-3"/> {att.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            {caseHearings.length === 0 && <p className="pr-6 text-slate-500 dark:text-slate-400">لا توجد جلسات مسجلة لهذه القضية.</p>}
        </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">مستندات القضية</h3>
            <button onClick={handleOpenDocumentModal} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600">
                <Upload className="w-4 h-4" /> رفع مستند
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {caseData?.documents?.map(doc => (
                <div key={doc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                            {getDocIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{doc.name}</p>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">{doc.category || 'عام'}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <span className="text-slate-400">{doc.uploadDate}</span>
                        <a href={doc.url} target="_blank" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline">
                            <Eye className="w-3 h-3"/> معاينة
                        </a>
                    </div>
                </div>
            ))}
            {(!caseData?.documents || caseData.documents.length === 0) && (
                <div className="col-span-full py-10 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    <File className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                    <p>لا توجد مستندات مرفقة</p>
                </div>
            )}
        </div>
    </div>
  );

  const renderMemosTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">المذكرات القانونية</h3>
            <button onClick={handleOpenMemoModal} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-700">
                <Plus className="w-4 h-4" /> مذكرة جديدة
            </button>
        </div>
        <div className="space-y-3">
            {caseData?.memos?.map(memo => (
                <div key={memo.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <ScrollText className="w-5 h-5 text-indigo-500"/>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">{memo.title}</p>
                            <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span>تاريخ التقديم: {memo.submissionDate}</span>
                                {memo.sessionDate && <span>جلسة: {memo.sessionDate}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {memo.url && (
                            <a href={memo.url} target="_blank" className="p-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:text-primary-600">
                                <Download className="w-4 h-4"/>
                            </a>
                        )}
                        <button onClick={() => handleEditMemo(memo)} className="p-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                            <Edit3 className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            ))}
            {(!caseData?.memos || caseData.memos.length === 0) && <p className="text-center text-slate-400 py-8">لا توجد مذكرات مسجلة</p>}
        </div>
    </div>
  );

  const renderRulingTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Gavel className="w-5 h-5"/> الأحكام والقرارات</h3>
                <button onClick={() => handleOpenRulingModal()} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2">
                    <Plus className="w-4 h-4"/> تسجيل حكم
                </button>
            </div>
            {caseData?.rulings && caseData.rulings.length > 0 ? (
                <div className="space-y-4">
                    {caseData.rulings.map(r => (
                        <div key={r.id} className="border-r-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-r-lg group relative">
                            {/* Actions for ruling */}
                            <div className="absolute top-2 left-2 flex gap-2">
                                <button onClick={() => handleOpenRulingModal(r)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 p-1">
                                    <Edit3 className="w-4 h-4"/>
                                </button>
                            </div>

                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-indigo-900 dark:text-indigo-200">{r.type === 'final' ? 'حكم نهائي' : r.type === 'preliminary' ? 'حكم تمهيدي' : 'إشكال/تنفيذ'}</span>
                                <span className="text-xs text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">{r.date}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 mb-2 leading-relaxed whitespace-pre-wrap">{r.summary}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-indigo-100 dark:border-indigo-800 pt-2">
                                <span>قابل للاستئناف: <strong>{r.isAppealable ? 'نعم' : 'لا'}</strong></span>
                                {r.url && (
                                    <a href={r.url} target="_blank" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline">
                                        <FileText className="w-3 h-3"/> {r.documentName || 'عرض ملف الحكم'}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <Gavel className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                    <p>لم يصدر أي أحكام في هذه الدعوى بعد</p>
                </div>
            )}
        </div>
    </div>
  );

  const renderFinanceTab = () => {
    // حساب القيم المطلوبة للقضية الحالية
    const totalFees = caseData?.finance?.agreedFees || 0;
    
    // حساب المدفوعات من سجل المعاملات لضمان الدقة
    const totalPaid = caseData?.finance?.history?.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + tx.amount, 0) || 0;
    
    // حساب المصروفات من سجل المعاملات لضمان الدقة
    const totalExpenses = caseData?.finance?.history?.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0) || 0;
    
    const remainingFees = totalFees - totalPaid; // المتبقي من الأتعاب
    const netFees = totalPaid - totalExpenses; // صافي الأتعاب بعد خصم المصروفات

    // حساب الإجماليات لجميع القضايا
    const allCasesTotalFees = cases.reduce((sum, c) => sum + (c.finance?.agreedFees || 0), 0);
    const allCasesTotalCollected = cases.reduce((sum, c) => {
      const casePaid = c.finance?.history?.filter(tx => tx.type === 'payment').reduce((caseSum, tx) => caseSum + tx.amount, 0) || 0;
      return sum + casePaid;
    }, 0);
    const allCasesTotalExpenses = cases.reduce((sum, c) => {
      const caseExpenses = c.finance?.history?.filter(tx => tx.type === 'expense').reduce((caseSum, tx) => caseSum + tx.amount, 0) || 0;
      return sum + caseExpenses;
    }, 0);
    const allCasesReceivables = allCasesTotalFees - allCasesTotalCollected; // مستحقات (ديون)
    const allCasesNetIncome = allCasesTotalCollected - allCasesTotalExpenses; // صافي الدخل

    return (
      <div className="space-y-6 animate-in fade-in">
          {/* الإجماليات لجميع القضايا */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  إجماليات جميع القضايا
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* البطاقة الأولى: إجمالي الأتعاب المتفق عليها لجميع القضايا */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي الأتعاب المتفق عليها</p>
                          <DollarSign className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {allCasesTotalFees.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جميع القضايا</p>
                  </div>

                  {/* البطاقة الثانية: إجمالي المحصل لجميع القضايا */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المحصل</p>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {allCasesTotalCollected.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جميع القضايا</p>
                  </div>

                  {/* البطاقة الثالثة: إجمالي المصروفات لجميع القضايا */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المصروفات</p>
                          <TrendingDown className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {allCasesTotalExpenses.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جميع القضايا</p>
                  </div>

                  {/* البطاقة الرابعة: مستحقات (ديون) لجميع القضايا */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">مستحقات (ديون)</p>
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {allCasesReceivables.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">(الأتعاب - المحصل)</p>
                  </div>

                  {/* البطاقة الخامسة: صافي الدخل لجميع القضايا */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">صافي الدخل</p>
                          <Wallet className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className={`text-xl font-bold ${allCasesNetIncome >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                          {allCasesNetIncome.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">(المحصل - المصروفات)</p>
                  </div>
              </div>
          </div>

          {/* تفاصيل القضية الحالية */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  تفاصيل القضية الحالية: {caseData?.caseNumber}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* البطاقة الأولى: إجمالي الأتعاب */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي الأتعاب</p>
                      <DollarSign className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-white flex justify-between items-center">
                      {totalFees.toLocaleString()}
                      <button onClick={handleOpenFinance} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                          <Edit3 className="w-4 h-4 text-slate-400"/>
                      </button>
                  </p>
              </div>

              {/* البطاقة الثانية: إجمالي المدفوع */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المدفوع</p>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {totalPaid.toLocaleString()}
                  </p>
              </div>

              {/* البطاقة الثالثة: إجمالي المصروفات الخاصة بالقضية */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المصروفات</p>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {totalExpenses.toLocaleString()}
                  </p>
              </div>

              {/* البطاقة الرابعة: المتبقي من الأتعاب */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">المتبقي من الأتعاب</p>
                      <Calculator className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {remainingFees.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      (إجمالي الأتعاب - المدفوع)
                  </p>
              </div>

              {/* البطاقة الخامسة: صافي الأتعاب */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">صافي الأتعاب</p>
                      <Wallet className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className={`text-xl font-bold ${netFees >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                      {netFees.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      (المدفوع - المصروفات)
                  </p>
              </div>
          </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white">سجل المعاملات</h3>
                <div className="flex gap-2">
                    <button onClick={() => handleOpenTransactionModal('payment')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-bold">استلام دفعة</button>
                    <button onClick={() => handleOpenTransactionModal('expense')} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 font-bold">تسجيل مصروف</button>
                </div>
            </div>
            <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">النوع</th>
                        <th className="p-3">المبلغ</th>
                        <th className="p-3">البيان</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {caseData?.finance?.history?.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200">
                            <td className="p-3 font-mono">{tx.date}</td>
                            <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'payment' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {tx.type === 'payment' ? 'دفعة واردة' : 'مصروفات'}
                                </span>
                            </td>
                            <td className="p-3 font-bold">{tx.amount.toLocaleString()}</td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">{tx.description}</td>
                        </tr>
                    ))}
                    {(!caseData?.finance?.history || caseData.finance.history.length === 0) && (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا توجد معاملات مسجلة</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
    </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {renderHeader()}
      
      {/* Tab Contents */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'timeline' && renderTimelineTab()}
      {activeTab === 'documents' && renderDocumentsTab()}
      {activeTab === 'memos' && renderMemosTab()}
      {activeTab === 'ruling' && renderRulingTab()}
      {activeTab === 'finance' && renderFinanceTab()}
      
      {/* Edit Case Modal */}
      {isEditCaseModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white">تعديل بيانات القضية</h3>
                 <button onClick={() => setIsEditCaseModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSaveCase} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم القضية</label>
                       <input type="text" value={editCaseData.caseNumber} onChange={e => setEditCaseData({...editCaseData, caseNumber: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">السنة</label>
                       <input type="number" value={editCaseData.year} onChange={e => setEditCaseData({...editCaseData, year: parseInt(e.target.value)})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">موضوع الدعوى</label>
                    <input type="text" value={editCaseData.title} onChange={e => setEditCaseData({...editCaseData, title: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المحكمة</label>
                       <input type="text" value={editCaseData.court} onChange={e => setEditCaseData({...editCaseData, court: e.target.value as CourtType})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الدائرة</label>
                       <input type="text" value={editCaseData.circle || ''} onChange={e => setEditCaseData({...editCaseData, circle: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">حالة القضية</label>
                    <select value={editCaseData.status} onChange={e => setEditCaseData({...editCaseData, status: e.target.value as CaseStatus})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                       {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المحامي المسئول</label>
                    <input type="text" value={editCaseData.responsibleLawyer || ''} onChange={e => setEditCaseData({...editCaseData, responsibleLawyer: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="أدخل اسم المحامي المسئول" />
                 </div>
                 <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => setIsEditCaseModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-lg">إلغاء</button>
                    <button type="submit" className="flex-1 bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700">حفظ التعديلات</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Opponent Modal */}
      {isOpponentModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">بيانات الخصم</h3>
               <div className="space-y-3">
                  <input type="text" placeholder="اسم الخصم" value={newOpponent.name} onChange={e => setNewOpponent({...newOpponent, name: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  <input type="text" placeholder="صفته (مدعى عليه / مدعي...)" value={newOpponent.role} onChange={e => setNewOpponent({...newOpponent, role: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  <input type="text" placeholder="اسم المحامي (اختياري)" value={newOpponent.lawyer} onChange={e => setNewOpponent({...newOpponent, lawyer: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  <input type="text" placeholder="العنوان (اختياري)" value={newOpponent.address} onChange={e => setNewOpponent({...newOpponent, address: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  <button onClick={handleSaveOpponent} className="w-full bg-primary-600 text-white p-2 rounded-lg mt-2">حفظ</button>
               </div>
            </div>
         </div>
      )}

      {/* Strategy Modal */}
      {isStrategyModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">تطوير استراتيجية الدفاع</h3>
                  <button onClick={() => setIsStrategyModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               <form onSubmit={handleSaveStrategy} className="space-y-6">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نقاط القوة</label>
                     <textarea rows={3} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="ما هي الأدلة والمستندات التي تدعم موقفنا؟" value={strategyFormData.strengthPoints} onChange={e => setStrategyFormData({...strategyFormData, strengthPoints: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نقاط الضعف / الثغرات</label>
                     <textarea rows={3} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" placeholder="ما هي نقاط ضعف الخصم أو الثغرات في قضيتنا؟" value={strategyFormData.weaknessPoints} onChange={e => setStrategyFormData({...strategyFormData, weaknessPoints: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">خطة العمل</label>
                     <textarea rows={3} className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="الخطوات الإجرائية القادمة..." value={strategyFormData.plan} onChange={e => setStrategyFormData({...strategyFormData, plan: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl shadow-lg transition-transform active:scale-95">حفظ الاستراتيجية</button>
               </form>
            </div>
         </div>
      )}

      {/* Hearing Modal */}
      {isHearingModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">{editingHearingId ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}</h3>
               <form onSubmit={handleSaveHearing} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <input type="date" required value={newHearingData.date} onChange={e => setNewHearingData({...newHearingData, date: e.target.value})} className="border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                     <input type="time" value={newHearingData.time} onChange={e => setNewHearingData({...newHearingData, time: e.target.value})} className="border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  </div>
                  <textarea placeholder="المطلوب للجلسة..." value={newHearingData.requirements} onChange={e => setNewHearingData({...newHearingData, requirements: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3}></textarea>
                  
                  {/* File Upload for Hearing */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">مرفقات الجلسة</label>
                     <input type="file" multiple ref={hearingFileInputRef} className="hidden" onChange={handleHearingFileSelect} />
                     <div onClick={() => hearingFileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 text-center rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400">اضغط لرفع ملفات</span>
                     </div>
                     {hearingFiles.length > 0 && (
                        <div className="mt-2 space-y-2">
                           {hearingFiles.map((file, i) => (
                              <div key={i} className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded">
                                 <span className="truncate dark:text-white">{file.name}</span>
                                 <button type="button" onClick={() => removeHearingFile(i)} className="text-red-500"><X className="w-4 h-4" /></button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={() => setIsHearingModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-lg">إلغاء</button>
                     <button type="submit" className="flex-1 bg-primary-600 text-white p-2 rounded-lg">حفظ</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Finance Modals (Transaction & Edit) */}
      {isFinanceModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">تعديل الأتعاب المتفق عليها</h3>
               <form onSubmit={handleSaveFinance} className="space-y-4">
                  <input 
                     type="number" 
                     value={financeFormData.agreedFees} 
                     onChange={e => setFinanceFormData({...financeFormData, agreedFees: Number(e.target.value)})}
                     className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                     placeholder="المبلغ الإجمالي"
                  />
                  <button type="submit" className="w-full bg-primary-600 text-white p-2 rounded-lg">حفظ</button>
               </form>
            </div>
         </div>
      )}

      {isTransactionModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
                  {transactionData.type === 'payment' ? 'استلام دفعة' : 'تسجيل مصروف'}
               </h3>
               <form onSubmit={handleSaveTransaction} className="space-y-4">
                  <input 
                     type="number" 
                     value={transactionData.amount} 
                     onChange={e => setTransactionData({...transactionData, amount: Number(e.target.value)})}
                     className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                     placeholder="المبلغ"
                  />
                  <input 
                     type="text" 
                     value={transactionData.description} 
                     onChange={e => setTransactionData({...transactionData, description: e.target.value})}
                     className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                     placeholder="البيان / الوصف"
                  />
                  <button type="submit" className={`w-full text-white p-2 rounded-lg ${transactionData.type === 'payment' ? 'bg-green-600' : 'bg-red-600'}`}>
                     حفظ المعاملة
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Document Modal */}
      {isDocumentModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">رفع مستند جديد</h3>
               <form onSubmit={handleSaveDocument} className="space-y-4">
                  <input type="text" value={newDocData.name} onChange={e => setNewDocData({...newDocData, name: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="اسم المستند" />
                  <select value={newDocData.category} onChange={e => setNewDocData({...newDocData, category: e.target.value as any})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                     <option value="contract">عقد</option>
                     <option value="ruling">حكم</option>
                     <option value="notice">إعلان/إنذار</option>
                     <option value="minutes">محضر</option>
                     <option value="other">أخرى</option>
                  </select>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 text-center rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                     <span className="text-slate-500 dark:text-slate-400">{selectedFile ? selectedFile.name : 'اضغط لرفع ملف'}</span>
                  </div>
                  <button type="submit" className="w-full bg-primary-600 text-white p-2 rounded-lg">حفظ المستند</button>
               </form>
            </div>
         </div>
      )}

      {/* Ruling Modal (Enhanced) */}
      {isRulingModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                     <Gavel className="w-5 h-5 text-indigo-600" />
                     {editingRulingId ? 'تعديل الحكم' : 'تسجيل حكم جديد'}
                  </h3>
                  <button onClick={() => setIsRulingModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
               </div>
               
               <form onSubmit={handleSaveRuling} className="space-y-5">
                  {/* File Upload Section */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نسخة الحكم (PDF, Word, صورة)</label>
                     <input 
                        type="file" 
                        ref={rulingFileInputRef}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden" 
                        onChange={handleRulingFileSelect} 
                     />
                     
                     <div 
                        onClick={() => rulingFileInputRef.current?.click()} 
                        className="border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-lg p-6 text-center cursor-pointer hover:bg-white dark:hover:bg-slate-600 hover:border-indigo-400 transition-all group"
                     >
                        {selectedRulingFile ? (
                           <div className="flex flex-col items-center gap-2 text-green-600 dark:text-green-400">
                              <FileCheck className="w-8 h-8" />
                              <span className="text-sm font-bold">{selectedRulingFile.name}</span>
                              <span className="text-xs text-slate-400">اضغط للتغيير</span>
                           </div>
                        ) : editingRulingId && rulingFormData.url ? (
                           <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                              <FileText className="w-8 h-8" />
                              <span className="text-sm font-bold">يوجد ملف مرفق حالياً</span>
                              <span className="text-xs text-slate-400">{rulingFormData.documentName || 'عرض الملف الحالي'}</span>
                              <span className="text-[10px] text-slate-500 mt-1 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">اضغط لاستبدال الملف</span>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                              <Upload className="w-8 h-8" />
                              <span className="text-sm font-medium">اضغط لرفع ملف الحكم</span>
                              <span className="text-[10px]">يدعم PDF, Word, Images</span>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Data Fields */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الحكم</label>
                        <input type="date" required value={rulingFormData.date} onChange={e => setRulingFormData({...rulingFormData, date: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع الحكم</label>
                        <select value={rulingFormData.type} onChange={e => setRulingFormData({...rulingFormData, type: e.target.value as any})} className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                           <option value="preliminary">حكم تمهيدي</option>
                           <option value="final">حكم نهائي</option>
                           <option value="execution">إشكال / تنفيذ</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">منطوق الحكم (الملخص)</label>
                     <textarea required value={rulingFormData.summary} onChange={e => setRulingFormData({...rulingFormData, summary: e.target.value})} className="w-full border p-3 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="نص الحكم المختصر..." rows={4}></textarea>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                     <label className="flex items-center gap-3 text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={rulingFormData.isAppealable} onChange={e => setRulingFormData({...rulingFormData, isAppealable: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                        <span className="font-bold text-sm">الحكم قابل للطعن / الاستئناف</span>
                     </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsRulingModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-300 dark:bg-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">إلغاء</button>
                     <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-colors flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" /> حفظ الحكم
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Memo Modal */}
      {isMemoModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">مذكرة جديدة</h3>
               <form onSubmit={handleSaveMemo} className="space-y-4">
                  <input type="text" value={newMemoData.title} onChange={e => setNewMemoData({...newMemoData, title: e.target.value})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="عنوان المذكرة" />
                  <div className="grid grid-cols-2 gap-4">
                     <input type="date" value={newMemoData.submissionDate} onChange={e => setNewMemoData({...newMemoData, submissionDate: e.target.value})} className="border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                     <select value={newMemoData.type} onChange={e => setNewMemoData({...newMemoData, type: e.target.value as any})} className="border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="defense">دفاع</option>
                        <option value="reply">رد</option>
                        <option value="closing">ختامية</option>
                        <option value="other">أخرى</option>
                     </select>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleMemoFileSelect} />
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 text-center rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                     <span className="text-slate-500 dark:text-slate-400">{selectedMemoFile ? selectedMemoFile.name : 'اضغط لرفع ملف المذكرة'}</span>
                  </div>
                  <button type="submit" className="w-full bg-primary-600 text-white p-2 rounded-lg">حفظ المذكرة</button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default CaseDetails;
