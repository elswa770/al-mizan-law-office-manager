
import React, { useState } from 'react';
import { Case, Client, CaseStatus, CourtType } from '../types';
import { Briefcase, Search, Plus, Filter, User, Calendar, MapPin, ArrowUpRight, X, Save, Gavel, LayoutGrid, List, Users } from 'lucide-react';

interface CasesProps {
  cases: Case[];
  clients: Client[];
  onCaseClick: (caseId: string) => void;
  onAddCase?: (newCase: Case) => void;
  readOnly?: boolean;
}

const Cases: React.FC<CasesProps> = ({ cases, clients, onCaseClick, onAddCase, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Case Form State
  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    caseNumber: '',
    year: new Date().getFullYear(),
    court: '',
    status: CaseStatus.OPEN,
    clientId: '',
    clientRole: 'مدعي',
    courtBranch: '',
    circle: '',
    judgeName: '',
    description: ''
  });

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.caseNumber.includes(searchTerm) || 
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCase) return;
    
    const client = clients.find(c => c.id === formData.clientId);
    const newCase: Case = {
      id: Math.random().toString(36).substring(2, 9),
      title: formData.title || '',
      caseNumber: formData.caseNumber || '',
      year: formData.year || new Date().getFullYear(),
      court: formData.court || '',
      courtBranch: formData.courtBranch,
      circle: formData.circle,
      judgeName: formData.judgeName,
      status: formData.status as CaseStatus,
      clientId: formData.clientId || '',
      clientName: client?.name || '',
      clientRole: formData.clientRole,
      description: formData.description,
      finance: { agreedFees: 0, paidAmount: 0, expenses: 0, history: [] }
    };

    onAddCase(newCase);
    setIsAddModalOpen(false);
    setFormData({
      title: '', caseNumber: '', year: new Date().getFullYear(), court: '', 
      status: CaseStatus.OPEN, clientId: '', clientRole: 'مدعي'
    });
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.OPEN: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900';
      case CaseStatus.CLOSED: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600';
      case CaseStatus.ARCHIVED: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      case CaseStatus.JUDGMENT: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case CaseStatus.EXECUTION: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
      {filteredCases.map(c => {
        const opponent = c.opponents && c.opponents.length > 0 ? c.opponents[0] : null;
        return (
          <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group overflow-hidden flex flex-col relative">
            <div className={`h-1.5 w-full ${
              c.status === CaseStatus.OPEN ? 'bg-green-500' :
              c.status === CaseStatus.CLOSED ? 'bg-slate-400' : 'bg-amber-500'
            }`}></div>
            
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold border border-slate-200 dark:border-slate-600">
                  {c.caseNumber} / {c.year}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getStatusColor(c.status)}`}>
                  {c.status}
                </span>
              </div>
              
              <h3 
                onClick={() => onCaseClick(c.id)}
                className="text-lg font-bold text-slate-800 dark:text-white mb-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1"
              >
                {c.title}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <User className="w-3 h-3" />
                  <span className="truncate">{c.clientName} ({c.clientRole})</span>
                </div>
                {opponent && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Users className="w-3 h-3 text-red-500" />
                    <span className="truncate text-red-600 dark:text-red-400 font-medium">ضد: {opponent.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{c.courtBranch || c.court}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono">ID: {c.id}</span>
              <button 
                onClick={() => onCaseClick(c.id)}
                className="text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center gap-1 hover:underline"
              >
                التفاصيل <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="p-4 w-[30%]">عنوان الدعوى</th>
              <th className="p-4">رقم الدعوى</th>
              <th className="p-4">الخصوم (الموكل/الخصم)</th>
              <th className="p-4">المحكمة / الدائرة</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredCases.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-800 dark:text-slate-200 group">
                <td className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        c.status === CaseStatus.OPEN ? 'bg-green-500' :
                        c.status === CaseStatus.CLOSED ? 'bg-slate-400' : 'bg-amber-500'
                    }`}></div>
                    <div>
                        <div 
                            onClick={() => onCaseClick(c.id)}
                            className="font-bold cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-base"
                        >
                            {c.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.description || 'لا يوجد وصف'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                   <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-600 whitespace-nowrap">
                      {c.caseNumber} / {c.year}
                   </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-2">
                    {/* Client */}
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-full text-indigo-600 dark:text-indigo-400">
                         <User className="w-3 h-3" />
                      </div>
                      <div className="flex flex-col">
                          <span className="font-bold text-xs">{c.clientName}</span>
                          <span className="text-[10px] text-slate-400">{c.clientRole}</span>
                      </div>
                    </div>
                    {/* Opponent */}
                    {c.opponents && c.opponents.length > 0 && (
                      <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-1">
                        <div className="bg-red-50 dark:bg-red-900/30 p-1.5 rounded-full text-red-600 dark:text-red-400">
                            <Users className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">ضد: {c.opponents[0].name}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                   <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{c.court}</span>
                      {c.courtBranch && <span className="text-xs text-slate-500 dark:text-slate-400">{c.courtBranch}</span>}
                      {c.circle && <span className="text-[10px] text-slate-400">دائرة: {c.circle}</span>}
                   </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => onCaseClick(c.id)}
                    className="group-hover:bg-white dark:group-hover:bg-slate-800 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-600 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-lg transition-all"
                    title="فتح الملف"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            سجل القضايا
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">إدارة ومتابعة جميع ملفات القضايا ({cases.length} قضية)</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {!readOnly && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> قضية جديدة
            </button>
          )}
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث برقم القضية، اسم الموكل، أو العنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 flex-1 md:flex-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-300 focus:outline-none w-full cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              {Object.values(CaseStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shrink-0">
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="عرض بطاقات"
             >
                <LayoutGrid className="w-5 h-5" />
             </button>
             <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="عرض جدول"
             >
                <List className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Cases List */}
      {viewMode === 'grid' ? renderGridView() : renderTableView()}
      
      {filteredCases.length === 0 && (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold">لا توجد قضايا مطابقة للبحث</p>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 sticky top-0">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">إضافة قضية جديدة</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان الدعوى <span className="text-red-500">*</span></label>
                  <input type="text" required className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: دعوى تعويض عن حادث سيارة" />
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الدعوى <span className="text-red-500">*</span></label>
                   <input type="text" required className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.caseNumber} onChange={e => setFormData({...formData, caseNumber: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">السنة</label>
                   <input type="number" className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">المحكمة المختصة <span className="text-red-500">*</span></label>
                   <select required className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.court} onChange={e => setFormData({...formData, court: e.target.value})}>
                      <option value="">اختر...</option>
                      {Object.values(CourtType).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسم/مقر المحكمة</label>
                   <input type="text" className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.courtBranch} onChange={e => setFormData({...formData, courtBranch: e.target.value})} placeholder="مثال: مجمع محاكم زنانيري" />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الدائرة</label>
                   <input type="text" className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.circle} onChange={e => setFormData({...formData, circle: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسم القاضي</label>
                   <input type="text" className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.judgeName} onChange={e => setFormData({...formData, judgeName: e.target.value})} />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الموكل <span className="text-red-500">*</span></label>
                   <select required className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                      <option value="">اختر الموكل...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">صفة الموكل</label>
                   <input type="text" className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.clientRole} onChange={e => setFormData({...formData, clientRole: e.target.value})} placeholder="مدعي / مدعى عليه" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">إلغاء</button>
                 <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> حفظ القضية
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
