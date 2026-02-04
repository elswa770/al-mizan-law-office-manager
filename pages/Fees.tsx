
import React, { useState, useMemo, useEffect } from 'react';
import { Case, Client, Hearing, PaymentMethod, FinancialTransaction } from '../types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownLeft, Filter, Search, Plus, CreditCard, Calendar, FileText, AlertCircle, CheckCircle, Calculator, User, Receipt, X, Building, Smartphone, Banknote, ScrollText, BarChart3 } from 'lucide-react';

interface FeesProps {
  cases: Case[];
  clients: Client[];
  hearings: Hearing[];
  onUpdateCase?: (updatedCase: Case) => void;
  canViewIncome?: boolean; // New prop
  canViewExpenses?: boolean; // New prop
}

const Fees: React.FC<FeesProps> = ({ cases, clients, hearings, onUpdateCase, canViewIncome = true, canViewExpenses = true }) => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'debt'>('all');

  // Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<string | null>(null); // For View History Modal
  const [detailsTab, setDetailsTab] = useState<'payments' | 'expenses'>('payments');

  // Add Transaction Form Data
  const [transactionData, setTransactionData] = useState({
    caseId: '',
    amount: 0,
    type: 'payment' as 'payment' | 'expense',
    description: '',
    method: 'cash' as PaymentMethod,
    category: ''
  });

  // Handle Tab Logic based on Permissions
  useEffect(() => {
    if (!canViewIncome && canViewExpenses) {
      setActiveTab('expenses');
    } else if (canViewIncome) {
      setActiveTab('overview');
    }
  }, [canViewIncome, canViewExpenses]);

  // --- Data Aggregation & Logic ---

  // 1. Financial Stats
  const stats = useMemo(() => {
    let totalAgreed = 0;
    let totalCollected = 0;
    let totalCaseExpenses = 0;
    let totalHearingExpenses = 0;

    cases.forEach(c => {
      if (c.finance) {
        totalAgreed += c.finance.agreedFees || 0;
        
        // حساب المدفوعات من سجل المعاملات لضمان الدقة
        const casePaid = c.finance.history?.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + tx.amount, 0) || 0;
        totalCollected += casePaid;
        
        // حساب المصروفات من سجل المعاملات لضمان الدقة
        const caseExpenses = c.finance.history?.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0) || 0;
        totalCaseExpenses += caseExpenses;
      }
    });

    hearings.forEach(h => {
      if (h.expenses && h.expenses.paidBy === 'lawyer') {
        totalHearingExpenses += h.expenses.amount;
      }
    });

    const totalExpenses = totalCaseExpenses + totalHearingExpenses;
    const totalPending = totalAgreed - totalCollected;
    const netIncome = totalCollected - totalExpenses;
    const collectionRate = totalAgreed > 0 ? Math.round((totalCollected / totalAgreed) * 100) : 0;

    return { totalAgreed, totalCollected, totalPending, totalExpenses, netIncome, collectionRate };
  }, [cases, hearings]);

  // 2. Cases Financial List
  const casesFinancials = useMemo(() => {
    return cases.map(c => {
      const client = clients.find(cl => cl.id === c.clientId);
      const agreed = c.finance?.agreedFees || 0;
      
      // حساب المدفوعات من سجل المعاملات لضمان الدقة
      const paid = c.finance?.history?.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + tx.amount, 0) || 0;
      
      // حساب المصروفات من سجل المعاملات
      const expenses = c.finance?.history?.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0) || 0;
      
      const remaining = agreed - paid;
      const percentage = agreed > 0 ? (paid / agreed) * 100 : 0;
      const netIncome = paid - expenses; // صافي الدخل للقضية
      
      let status: 'completed' | 'partial' | 'unpaid' = 'partial';
      if (paid >= agreed && agreed > 0) status = 'completed';
      else if (paid === 0) status = 'unpaid';

      return {
        ...c,
        clientName: client?.name || 'غير معروف',
        financials: { agreed, paid, remaining, percentage, status, expenses, netIncome }
      };
    }).filter(c => {
      const matchesSearch = c.title.includes(searchTerm) || c.clientName.includes(searchTerm) || c.caseNumber.includes(searchTerm);
      if (!matchesSearch) return false;

      if (filterStatus === 'completed') return c.financials.status === 'completed';
      if (filterStatus === 'pending') return c.financials.status !== 'completed';
      if (filterStatus === 'debt') return c.financials.remaining > 0;
      
      return true;
    });
  }, [cases, clients, searchTerm, filterStatus]);

  // 3. Expenses List (Aggregated)
  const expensesList = useMemo(() => {
    const list: any[] = [];
    
    // A. Hearing Expenses
    hearings.forEach(h => {
      if (h.expenses && h.expenses.amount > 0) {
        const c = cases.find(x => x.id === h.caseId);
        list.push({
          id: `h-${h.id}`,
          date: h.date,
          category: 'مصروفات جلسة',
          description: h.expenses.description || 'مصروفات متنوعة',
          amount: h.expenses.amount,
          caseTitle: c?.title,
          clientName: clients.find(cl => cl.id === c?.clientId)?.name,
          paidBy: h.expenses.paidBy === 'lawyer' ? 'المكتب' : 'الموكل'
        });
      }
    });

    // B. Case Admin Expenses (from Transactions Log if available, else fallback)
    cases.forEach(c => {
      if (c.finance?.history) {
         c.finance.history.filter(t => t.type === 'expense').forEach(t => {
            list.push({
               id: t.id,
               date: t.date,
               category: t.category || 'إدارية',
               description: t.description || 'مصروفات',
               amount: t.amount,
               caseTitle: c.title,
               clientName: clients.find(cl => cl.id === c.clientId)?.name,
               paidBy: 'المكتب'
            });
         });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cases, hearings, clients]);

  // --- Handlers ---

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCase || !transactionData.caseId) return;

    const targetCase = cases.find(c => c.id === transactionData.caseId);
    if (!targetCase) return;

    const currentFinance = targetCase.finance || { agreedFees: 0, paidAmount: 0, expenses: 0, history: [] };
    
    const newTransaction: FinancialTransaction = {
       id: Math.random().toString(36).substring(2, 9),
       date: new Date().toISOString().split('T')[0],
       amount: Number(transactionData.amount),
       type: transactionData.type,
       method: transactionData.type === 'payment' ? transactionData.method : undefined,
       category: transactionData.type === 'expense' ? (transactionData.category || 'نثريات') : undefined,
       description: transactionData.description,
       recordedBy: 'المحامي' // In real app, use current user name
    };

    let newFinance = { 
       ...currentFinance,
       history: [...(currentFinance.history || []), newTransaction]
    };

    if (transactionData.type === 'payment') {
      newFinance.paidAmount += Number(transactionData.amount);
    } else {
      newFinance.expenses += Number(transactionData.amount);
    }

    onUpdateCase({
      ...targetCase,
      finance: newFinance
    });

    setIsTransactionModalOpen(false);
    setTransactionData({ caseId: '', amount: 0, type: 'payment', description: '', method: 'cash', category: '' });
  };

  const openTransactionModal = (caseId?: string) => {
    if (caseId) {
       setTransactionData(prev => ({ ...prev, caseId }));
    }
    // Default to 'expense' if user has no income permission
    if (!canViewIncome) {
       setTransactionData(prev => ({ ...prev, type: 'expense' }));
    }
    setIsTransactionModalOpen(true);
  };

  const getMethodIcon = (method: string) => {
     switch(method) {
        case 'cash': return <Banknote className="w-4 h-4 text-green-600" />;
        case 'instapay': return <Smartphone className="w-4 h-4 text-purple-600" />;
        case 'check': return <ScrollText className="w-4 h-4 text-blue-600" />;
        case 'wallet': return <Wallet className="w-4 h-4 text-amber-600" />;
        case 'bank_transfer': return <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
        default: return <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
     }
  };

  const getMethodLabel = (method: string) => {
     switch(method) {
        case 'cash': return 'نقدي (Cash)';
        case 'instapay': return 'InstaPay';
        case 'check': return 'شيك بنكي';
        case 'wallet': return 'محفظة إلكترونية';
        case 'bank_transfer': return 'تحويل بنكي';
        default: return 'أخرى';
     }
  };

  // --- Render Components ---

  const renderStatCard = (title: string, value: number, icon: any, colorClass: string, subValue?: string) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{value.toLocaleString()} <span className="text-xs text-slate-400">ج.م</span></h3>
        {subValue && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-full ${colorClass.replace('text-', 'bg-').replace('700', '100').replace('600', '100')} ${colorClass}`}>
        {React.createElement(icon, { className: "w-6 h-6" })}
      </div>
    </div>
  );

  const renderCaseFinancialDetails = () => {
     if (!selectedCaseForDetails) return null;
     const c = cases.find(x => x.id === selectedCaseForDetails);
     if (!c) return null;
     
     const transactions = c.finance?.history || [];
     const payments = transactions.filter(t => t.type === 'payment').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     const expenses = transactions.filter(t => t.type === 'expense').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

     // Calculate Net Income for this specific case from transaction history
     const totalPaid = payments.reduce((sum, tx) => sum + tx.amount, 0) || 0;
     const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0) || 0;
     const netIncome = totalPaid - totalExpenses;

     return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{c.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                       <User className="w-4 h-4" /> {c.clientName} | <FileText className="w-4 h-4" /> {c.caseNumber}
                    </p>
                 </div>
                 <button onClick={() => setSelectedCaseForDetails(null)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-red-500">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Summary Cards inside Modal - Show only if income permission exists */}
              {canViewIncome && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">إجمالي الأتعاب</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{c.finance?.agreedFees.toLocaleString()}</p>
                   </div>
                   <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 text-center">
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">المدفوع</p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-200">{totalPaid.toLocaleString()}</p>
                   </div>
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-bl-full"></div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">صافي الدخل</p>
                      <p className="text-lg font-bold text-indigo-900 dark:text-indigo-200">{netIncome.toLocaleString()}</p>
                      <p className="text-[10px] text-indigo-400 mt-1">بعد خصم المصروفات ({totalExpenses.toLocaleString()})</p>
                   </div>
                   <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 text-center">
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">المتبقي</p>
                      <p className="text-lg font-bold text-red-900 dark:text-red-200">{((c.finance?.agreedFees||0) - totalPaid).toLocaleString()}</p>
                   </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                 {canViewIncome && (
                   <button 
                      onClick={() => setDetailsTab('payments')}
                      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${detailsTab === 'payments' ? 'border-b-2 border-green-500 text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                      <ArrowDownLeft className="w-4 h-4" /> سجل الدفعات (الوارد)
                   </button>
                 )}
                 {canViewExpenses && (
                   <button 
                      onClick={() => setDetailsTab('expenses')}
                      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${detailsTab === 'expenses' ? 'border-b-2 border-red-500 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                      <ArrowUpRight className="w-4 h-4" /> سجل المصروفات (الصادر)
                   </button>
                 )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-0">
                 {detailsTab === 'payments' && canViewIncome ? (
                    <table className="w-full text-right text-sm">
                       <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                          <tr>
                             <th className="p-4">التاريخ</th>
                             <th className="p-4">المبلغ</th>
                             <th className="p-4">طريقة الدفع</th>
                             <th className="p-4">البيان</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                          {payments.map(p => (
                             <tr key={p.id} className="hover:bg-green-50/30 dark:hover:bg-green-900/10">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{p.date}</td>
                                <td className="p-4 font-bold text-green-700 dark:text-green-400">{p.amount.toLocaleString()} ج.م</td>
                                <td className="p-4">
                                   <div className="flex items-center gap-2">
                                      {getMethodIcon(p.method || 'cash')}
                                      <span>{getMethodLabel(p.method || 'cash')}</span>
                                   </div>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{p.description}</td>
                             </tr>
                          ))}
                          {payments.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">لا توجد دفعات مسجلة</td></tr>}
                       </tbody>
                    </table>
                 ) : (
                    <table className="w-full text-right text-sm">
                       <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                          <tr>
                             <th className="p-4">التاريخ</th>
                             <th className="p-4">المبلغ</th>
                             <th className="p-4">البند</th>
                             <th className="p-4">البيان</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                          {expenses.map(ex => (
                             <tr key={ex.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{ex.date}</td>
                                <td className="p-4 font-bold text-red-700 dark:text-red-400">-{ex.amount.toLocaleString()} ج.م</td>
                                <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{ex.category}</span></td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{ex.description}</td>
                             </tr>
                          ))}
                          {expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">لا توجد مصروفات مسجلة</td></tr>}
                       </tbody>
                    </table>
                 )}
              </div>
              
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                 <button onClick={() => setSelectedCaseForDetails(null)} className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-600">إغلاق</button>
              </div>
           </div>
        </div>
     );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            الإدارة المالية
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">متابعة دقيقة للأتعاب، المدفوعات، ومصروفات القضايا</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsTransactionModalOpen(true)}
             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
           >
             <Plus className="w-4 h-4" /> تسجيل معاملة
           </button>
           {canViewIncome && (
             <button className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
               تصدير تقرير
             </button>
           )}
        </div>
      </div>

      {/* 2. Dashboard Stats (Hide completely if only Expenses) */}
      {canViewIncome ? (
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
                        {stats.totalAgreed.toLocaleString()}
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
                        {stats.totalCollected.toLocaleString()}
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
                        {stats.totalExpenses.toLocaleString()}
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
                        {stats.totalPending.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">(الأتعاب - المحصل)</p>
                </div>

                {/* البطاقة الخامسة: صافي الدخل لجميع القضايا */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">صافي الدخل</p>
                        <Wallet className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className={`text-xl font-bold ${stats.netIncome >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.netIncome.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">(المحصل - المصروفات)</p>
                </div>
            </div>
        </div>
      ) : (
        /* Only Expense Stats */
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
            <h3 className="font-bold text-lg text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                إجماليات المصروفات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المصروفات</p>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {stats.totalExpenses.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جميع القضايا</p>
                </div>
            </div>
        </div>
      )}

      {/* 3. Main Content (Tabs) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px]">
        {/* Tabs Header */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
           {canViewIncome && (
             <button 
               onClick={() => setActiveTab('overview')} 
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-600 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}
             >
                <FileText className="w-4 h-4" /> سجل أتعاب القضايا
             </button>
           )}
           {canViewExpenses && (
             <button 
               onClick={() => setActiveTab('expenses')} 
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-slate-600 text-red-700 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}
             >
                <ArrowUpRight className="w-4 h-4" /> سجل المصروفات
             </button>
           )}
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                 type="text" 
                 placeholder={activeTab === 'overview' ? "بحث باسم القضية أو الموكل..." : "بحث في المصروفات..."}
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
              />
           </div>
           
           {activeTab === 'overview' && (
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                 >
                    <option value="all">جميع الحالات</option>
                    <option value="completed">خالص السداد</option>
                    <option value="debt">علية مديونية</option>
                 </select>
              </div>
           )}
        </div>

        {/* Tab Content: Cases Financials */}
        {activeTab === 'overview' && canViewIncome && (
           <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                       <th className="p-4">القضية / الموكل</th>
                       <th className="p-4">إجمالي الأتعاب</th>
                       <th className="p-4 w-1/4">موقف السداد</th>
                       <th className="p-4">المدفوع</th>
                       <th className="p-4">المتبقي</th>
                       <th className="p-4">الإجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                    {casesFinancials.map(c => (
                       <tr key={c.id} onClick={() => setSelectedCaseForDetails(c.id)} className="hover:bg-slate-50 dark:hover:bg-slate-700 group cursor-pointer transition-colors">
                          <td className="p-4">
                             <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{c.title}</div>
                             <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> {c.clientName}
                             </div>
                          </td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{c.financials.agreed.toLocaleString()}</td>
                          <td className="p-4">
                             <div className="w-full bg-slate-200 dark:bg-slate-600 h-2.5 rounded-full overflow-hidden mb-1">
                                <div 
                                   className={`h-full rounded-full ${c.financials.status === 'completed' ? 'bg-emerald-500' : c.financials.percentage < 50 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                   style={{ width: `${c.financials.percentage}%` }}
                                ></div>
                             </div>
                             <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                <span>{Math.round(c.financials.percentage)}%</span>
                                <span>{c.financials.status === 'completed' ? 'مكتمل' : 'جاري'}</span>
                             </div>
                          </td>
                          <td className="p-4 text-emerald-700 dark:text-emerald-400 font-bold">{c.financials.paid.toLocaleString()}</td>
                          <td className={`p-4 font-bold ${c.financials.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                             {c.financials.remaining > 0 ? c.financials.remaining.toLocaleString() : '0'}
                          </td>
                          <td className="p-4">
                             <button 
                               onClick={(e) => { e.stopPropagation(); openTransactionModal(c.id); }}
                               className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                             >
                                <Plus className="w-3 h-3" /> إضافة دفعة
                             </button>
                          </td>
                       </tr>
                    ))}
                    {casesFinancials.length === 0 && (
                       <tr><td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">لا توجد سجلات مطابقة</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        )}

        {/* Tab Content: Expenses */}
        {activeTab === 'expenses' && canViewExpenses && (
           <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                       <th className="p-4">التاريخ</th>
                       <th className="p-4">البند / الوصف</th>
                       <th className="p-4">نوع المصروف</th>
                       <th className="p-4">خاص بقضية</th>
                       <th className="p-4">القيمة</th>
                       <th className="p-4">جهة الدفع</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                    {expensesList.map((exp: any) => (
                       <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{exp.date}</td>
                          <td className="p-4 text-slate-800 dark:text-white">{exp.description}</td>
                          <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{exp.category}</span></td>
                          <td className="p-4">
                             {exp.caseTitle ? (
                                <div>
                                   <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{exp.caseTitle}</div>
                                   <div className="text-[10px] text-slate-400">{exp.clientName}</div>
                                </div>
                             ) : '-'}
                          </td>
                          <td className="p-4 font-bold text-red-600 dark:text-red-400">-{exp.amount.toLocaleString()}</td>
                          <td className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400">{exp.paidBy}</td>
                       </tr>
                    ))}
                    {expensesList.length === 0 && (
                       <tr><td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">لا توجد مصروفات مسجلة</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        )}
      </div>

      {/* Transaction Modal (Add New) */}
      {isTransactionModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">تسجيل معاملة مالية</h3>
                  <button onClick={() => setIsTransactionModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
               </div>
               
               <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
                  {/* Transaction Type */}
                  <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg mb-4">
                     {canViewIncome && (
                       <button 
                          type="button" 
                          onClick={() => setTransactionData({...transactionData, type: 'payment'})}
                          className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${transactionData.type === 'payment' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                       >
                          <ArrowDownLeft className="w-4 h-4" /> استلام دفعة
                       </button>
                     )}
                     {canViewExpenses && (
                       <button 
                          type="button" 
                          onClick={() => setTransactionData({...transactionData, type: 'expense'})}
                          className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${transactionData.type === 'expense' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                       >
                          <ArrowUpRight className="w-4 h-4" /> تسجيل مصروف
                       </button>
                     )}
                  </div>

                  {/* Case Selection */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">القضية الخاصة بالمعاملة</label>
                     <select 
                        required
                        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        value={transactionData.caseId}
                        onChange={e => setTransactionData({...transactionData, caseId: e.target.value})}
                     >
                        <option value="">اختر القضية...</option>
                        {cases.map(c => (
                           <option key={c.id} value={c.id}>{c.title} - {clients.find(cl=>cl.id===c.clientId)?.name}</option>
                        ))}
                     </select>
                  </div>

                  {/* Amount */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المبلغ (ج.م)</label>
                     <input 
                        type="number" 
                        required
                        min="0"
                        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        value={transactionData.amount}
                        onChange={e => setTransactionData({...transactionData, amount: Number(e.target.value)})}
                     />
                  </div>

                  {/* Payment Method (If Payment) */}
                  {transactionData.type === 'payment' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">طريقة الدفع</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['cash', 'check', 'instapay', 'wallet', 'bank_transfer'].map(method => (
                              <button
                                 key={method}
                                 type="button"
                                 onClick={() => setTransactionData({...transactionData, method: method as PaymentMethod})}
                                 className={`p-2 rounded border text-xs font-bold flex items-center justify-center gap-2 ${transactionData.method === method ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                              >
                                 {getMethodIcon(method)}
                                 {getMethodLabel(method)}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Category (If Expense) */}
                  {transactionData.type === 'expense' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">بند المصروف</label>
                        <select 
                           className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                           value={transactionData.category}
                           onChange={e => setTransactionData({...transactionData, category: e.target.value})}
                        >
                           <option value="">اختر...</option>
                           <option value="رسوم">رسوم قضائية</option>
                           <option value="انتقالات">انتقالات</option>
                           <option value="إدارية">إدارية / نثريات</option>
                           <option value="تصوير">تصوير</option>
                           <option value="ضيافة">ضيافة</option>
                        </select>
                     </div>
                  )}

                  {/* Description */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات / بيان</label>
                     <input 
                        type="text" 
                        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        placeholder={transactionData.type === 'payment' ? 'دفعة من حساب الأتعاب' : 'تفاصيل المصروف'}
                        value={transactionData.description}
                        onChange={e => setTransactionData({...transactionData, description: e.target.value})}
                     />
                  </div>

                  <button 
                     type="submit" 
                     className={`w-full py-3 rounded-lg text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4 ${transactionData.type === 'payment' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none' : 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'}`}
                  >
                     {transactionData.type === 'payment' ? <Plus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                     {transactionData.type === 'payment' ? 'إضافة الدفعة' : 'تسجيل المصروف'}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Details View Modal */}
      {renderCaseFinancialDetails()}
    </div>
  );
};

export default Fees;
