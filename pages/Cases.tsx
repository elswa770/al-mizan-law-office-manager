
import React, { useState } from 'react';
import { Case, CaseStatus, CourtType, Client } from '../types';
import { Plus, Search, Filter, FileText, X, Briefcase, User, Shield, Gavel, MoreHorizontal, ArrowUpRight } from 'lucide-react';

interface CasesProps {
  cases: Case[];
  clients: Client[];
  onCaseClick?: (caseId: string) => void;
  onAddCase?: (newCase: Case) => void;
  readOnly?: boolean;
}

const Cases: React.FC<CasesProps> = ({ cases, clients, onCaseClick, onAddCase, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    caseNumber: '',
    year: new Date().getFullYear(),
    court: CourtType.CIVIL,
    courtBranch: '',
    circle: '',
    judgeName: '',
    clientId: '',
    description: '',
    status: CaseStatus.OPEN
  });

  const filteredCases = cases.filter(c => {
    // Enhanced search to include opponent name
    const opponentNames = c.opponents?.map(o => o.name).join(' ') || '';
    const matchesSearch = c.title.includes(searchTerm) || 
                          c.caseNumber.includes(searchTerm) || 
                          c.clientName?.includes(searchTerm) ||
                          opponentNames.includes(searchTerm);
                          
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCase) return;

    if (!formData.title || !formData.caseNumber || !formData.clientId) {
      alert('يرجى ملء البيانات الأساسية (العنوان، الرقم، الموكل)');
      return;
    }

    const client = clients.find(c => c.id === formData.clientId);

    const newCase: Case = {
      id: Math.random().toString(36).substring(2, 9),
      title: formData.title || '',
      caseNumber: formData.caseNumber || '',
      year: formData.year || new Date().getFullYear(),
      court: formData.court as CourtType,
      courtBranch: formData.courtBranch,
      circle: formData.circle,
      judgeName: formData.judgeName,
      status: formData.status as CaseStatus,
      clientId: formData.clientId || '',
      clientName: client?.name || '',
      description: formData.description,
      openDate: new Date().toISOString().split('T')[0],
      documents: [],
      notes: []
    };

    onAddCase(newCase);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      title: '',
      caseNumber: '',
      year: new Date().getFullYear(),
      court: CourtType.CIVIL,
      courtBranch: '',
      circle: '',
      judgeName: '',
      clientId: '',
      description: '',
      status: CaseStatus.OPEN
    });
  };

  const getStatusStyle = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.OPEN: return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case CaseStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case CaseStatus.DISMISSED: return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case CaseStatus.CLOSED: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      case CaseStatus.JUDGMENT: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary-600" />
              سجل القضايا
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة ومتابعة ملفات القضايا ({filteredCases.length} قضية)</p>
        </div>
        {!readOnly && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قضية جديدة</span>
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث برقم القضية، الموكل، الخصم، أو الموضوع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="px-3 text-slate-400 border-l border-slate-100 dark:border-slate-700">
              <Filter className="w-5 h-5" />
           </div>
           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="bg-transparent text-slate-700 dark:text-slate-300 py-2 px-2 outline-none font-medium text-sm min-w-[150px] cursor-pointer dark:bg-slate-800"
           >
             <option value="all">كل الحالات</option>
             {Object.values(CaseStatus).map(status => (
               <option key={status} value={status}>{status}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">رقم الدعوى</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">موضوع الدعوى</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">الأطراف (الموكل / الخصم)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">المحكمة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">المحامي المسئول</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredCases.map((c) => (
                <tr key={c.id} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-slate-700 transition-colors group border-b border-slate-100 dark:border-slate-700 last:border-0">
                  {/* Case Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                           <span className="block font-bold text-slate-900 dark:text-white text-sm font-mono">{c.caseNumber}</span>
                           <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{c.year}</span>
                        </div>
                     </div>
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                     <p className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1" title={c.title}>{c.title}</p>
                     {c.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[200px]">{c.description}</p>}
                  </td>

                  {/* Parties (Client & Opponent Combined for better layout) */}
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-2">
                        {/* Client */}
                        <div className="flex items-center gap-2 text-sm">
                           <User className="w-3.5 h-3.5 text-emerald-600" />
                           <span className="font-medium text-slate-700 dark:text-slate-300">{c.clientName}</span>
                        </div>
                        {/* Opponent */}
                        <div className="flex items-center gap-2 text-sm">
                           <Shield className="w-3.5 h-3.5 text-red-500" />
                           {c.opponents && c.opponents.length > 0 ? (
                              <div className="flex items-center gap-1">
                                 <span className="text-slate-600 dark:text-slate-400">{c.opponents[0].name}</span>
                                 {c.opponents.length > 1 && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                       +{c.opponents.length - 1}
                                    </span>
                                 )}
                              </div>
                           ) : (
                              <span className="text-slate-400 italic text-xs">لا يوجد خصم</span>
                           )}
                        </div>
                     </div>
                  </td>

                  {/* Court */}
                  <td className="px-6 py-4">
                     <div className="flex items-start gap-2">
                        <Gavel className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.court}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{c.courtBranch || '-'}</p>
                           {c.circle && <span className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 rounded text-slate-500 dark:text-slate-400 mt-1 inline-block">{c.circle}</span>}
                        </div>
                     </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusStyle(c.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                      {c.status}
                    </span>
                  </td>

                  {/* Responsible Lawyer */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {c.responsibleLawyer || '---'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onCaseClick && onCaseClick(c.id)}
                      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-700 border border-primary-100 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-slate-600 hover:text-primary-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <span>عرض</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                    <Briefcase className="w-12 h-12 mb-3 opacity-20" />
                    <p>لا توجد قضايا مطابقة للبحث</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Case Modal */}
      {isModalOpen && !readOnly && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                 <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary-600" /> إضافة قضية جديدة
                 </h3>
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-all"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 {/* Basic Info */}
                 <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 mb-2">البيانات الأساسية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">موضوع الدعوى (العنوان) <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="مثال: دعوى صحة ونفاذ عقد بيع"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-slate-800 dark:text-white"
                          />
                       </div>
                       
                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">رقم القضية <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            required
                            value={formData.caseNumber}
                            onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
                            placeholder="مثال: 1234"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-slate-800 dark:text-white"
                          />
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">السنة <span className="text-red-500">*</span></label>
                          <input 
                            type="number"
                            required
                            value={formData.year}
                            onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-slate-800 dark:text-white"
                          />
                       </div>
                    </div>
                 </div>

                 {/* Court & Client */}
                 <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 mb-2">تفاصيل المحكمة والأطراف</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">درجة التقاضي/النوع <span className="text-red-500">*</span></label>
                          <select 
                            required
                            value={formData.court}
                            onChange={(e) => setFormData({...formData, court: e.target.value as CourtType})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                          >
                            {Object.values(CourtType).map(court => (
                              <option key={court} value={court}>{court}</option>
                            ))}
                          </select>
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اسم المحكمة (الفرع)</label>
                          <input 
                            type="text"
                            value={formData.courtBranch || ''}
                            onChange={(e) => setFormData({...formData, courtBranch: e.target.value})}
                            placeholder="مثال: محكمة جنوب القاهرة الابتدائية"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-slate-800 dark:text-white"
                          />
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الدائرة (اختياري)</label>
                          <input 
                            type="text"
                            value={formData.circle || ''}
                            onChange={(e) => setFormData({...formData, circle: e.target.value})}
                            placeholder="مثال: الدائرة الأولى مدني"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-slate-800 dark:text-white"
                          />
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">رئيس المحكمة/الدائرة</label>
                          <input 
                            type="text"
                            value={formData.judgeName || ''}
                            onChange={(e) => setFormData({...formData, judgeName: e.target.value})}
                            placeholder="مثال: المستشار/ محمد حسين"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-slate-800 dark:text-white"
                          />
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الموكل <span className="text-red-500">*</span></label>
                          <select 
                            required
                            value={formData.clientId}
                            onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                          >
                            <option value="">اختر الموكل...</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                          </select>
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">حالة القضية</label>
                          <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as CaseStatus})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                          >
                            {Object.values(CaseStatus).map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* Description */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظات / وصف الدعوى</label>
                    <textarea 
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="اكتب أي تفاصيل إضافية هنا..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none dark:bg-slate-800 dark:text-white"
                    />
                 </div>

                 {/* Actions */}
                 <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold transition-colors shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> حفظ القضية
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
