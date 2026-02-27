import React, { useState, useMemo } from 'react';
import { Case, Client, ArchiveLocation, ArchiveRequest, CaseStatus } from '../types';
import { 
  Archive, Search, Filter, Folder, Box, FileText, Clock, User, 
  MapPin, CheckCircle, XCircle, AlertCircle, ArrowUpRight, ArrowDownLeft,
  Plus, Trash2, Edit3, QrCode, Printer, Shield, Lock, Unlock
} from 'lucide-react';

interface ArchiveProps {
  cases: Case[];
  clients: Client[];
  onUpdateCase?: (updatedCase: Case) => void;
}

const ArchivePage: React.FC<ArchiveProps> = ({ cases, clients, onUpdateCase }) => {
  const [activeTab, setActiveTab] = useState<'digital' | 'physical' | 'requests'>('digital');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'archived' | 'active'>('archived');

  // Mock Archive Locations
  const [locations, setLocations] = useState<ArchiveLocation[]>([
    { id: '1', name: 'غرفة الأرشيف A', type: 'room', fullPath: 'الدور الأرضي - غرفة A', capacity: 1000, occupied: 850 },
    { id: '2', name: 'دولاب العقود 1', type: 'cabinet', fullPath: 'غرفة A - دولاب 1', capacity: 200, occupied: 180 },
    { id: '3', name: 'صندوق قضايا 2023', type: 'box', fullPath: 'غرفة A - دولاب 1 - رف 3', capacity: 50, occupied: 45 },
    { id: '4', name: 'صندوق قضايا 2024', type: 'box', fullPath: 'غرفة A - دولاب 2 - رف 1', capacity: 50, occupied: 12 },
  ]);

  // Mock Requests
  const [requests, setRequests] = useState<ArchiveRequest[]>([
    { id: '1', caseId: '1', requesterId: 'user1', requestDate: '2024-02-20', status: 'pending', notes: 'للاطلاع قبل الاستئناف' },
    { id: '2', caseId: '2', requesterId: 'user2', requestDate: '2024-02-18', status: 'approved', notes: 'مراجعة مستندات' }
  ]);

  // Filtered Data
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = c.title.includes(searchTerm) || c.caseNumber.includes(searchTerm) || c.clientName.includes(searchTerm);
      const isArchived = c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED;
      
      if (filterStatus === 'archived' && !isArchived) return false;
      if (filterStatus === 'active' && isArchived) return false;
      
      return matchesSearch;
    });
  }, [cases, searchTerm, filterStatus]);

  const archivedCount = cases.filter(c => c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED).length;
  const physicalFilesCount = cases.filter(c => c.archiveData).length;

  // --- Render Functions ---

  const renderDigitalArchive = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث في الأرشيف الرقمي (رقم القضية، الموكل، العنوان)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">الكل</option>
            <option value="archived">المؤرشف فقط</option>
            <option value="active">النشط</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
            <Filter className="w-4 h-4" /> تصفية متقدمة
          </button>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group relative">
            <div className={`absolute top-4 left-4 px-2 py-1 rounded text-[10px] font-bold ${c.archiveData ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
              {c.archiveData ? 'مؤرشف فيزيائياً' : 'رقمي فقط'}
            </div>
            
            <div className="flex items-start gap-3 mb-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1" title={c.title}>{c.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{c.caseNumber}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">الموكل:</span>
                <span className="font-bold">{c.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ الإغلاق:</span>
                <span className="font-mono">{c.status === 'مغلقة' ? '2023-12-01' : '-'}</span>
              </div>
              {c.archiveData && (
                <div className="flex justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 flex items-center gap-1"><Box className="w-3 h-3"/> الموقع:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.archiveData.boxNumber}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                عرض الملف
              </button>
              {!c.archiveData && (
                <button className="flex-1 py-1.5 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                  أرشفة فيزيائية
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPhysicalArchive = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي الوحدات</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{locations.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">السعة المستغلة</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">
              {Math.round((locations.reduce((acc, loc) => acc + loc.occupied, 0) / locations.reduce((acc, loc) => acc + loc.capacity, 0)) * 100)}%
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">ماسح الباركود</p>
            <button className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">فتح الماسح</button>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-500" /> وحدات التخزين
          </h3>
          <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-sm">
            <Plus className="w-3 h-3" /> وحدة جديدة
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="p-4">اسم الوحدة</th>
                <th className="p-4">المسار الكامل</th>
                <th className="p-4">النوع</th>
                <th className="p-4">الإشغال</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {locations.map(loc => (
                <tr key={loc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-800 dark:text-slate-200">
                  <td className="p-4 font-bold flex items-center gap-2">
                    {loc.type === 'room' ? <MapPin className="w-4 h-4 text-slate-400"/> : loc.type === 'box' ? <Box className="w-4 h-4 text-amber-500"/> : <Folder className="w-4 h-4 text-blue-500"/>}
                    {loc.name}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">{loc.fullPath}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                      {loc.type === 'room' ? 'غرفة' : loc.type === 'cabinet' ? 'دولاب' : loc.type === 'shelf' ? 'رف' : 'صندوق'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${loc.occupied / loc.capacity > 0.9 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{width: `${(loc.occupied / loc.capacity) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{loc.occupied}/{loc.capacity}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-700 rounded"><Edit3 className="w-4 h-4"/></button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-700 rounded"><Printer className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" /> طلبات استعارة الملفات
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">القضية</th>
                <th className="p-4">مقدم الطلب</th>
                <th className="p-4">تاريخ الطلب</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {requests.map(req => {
                const caseData = cases.find(c => c.id === req.caseId);
                return (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-800 dark:text-slate-200">
                    <td className="p-4 font-mono font-bold">#{req.id}</td>
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{caseData?.title || 'قضية محذوفة'}</td>
                    <td className="p-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">
                        <User className="w-3 h-3" />
                      </div>
                      {req.requesterId}
                    </td>
                    <td className="p-4 font-mono text-xs">{req.requestDate}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        req.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {req.status === 'approved' ? 'تمت الموافقة' : req.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{req.notes}</td>
                    <td className="p-4">
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700">موافقة</button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700">رفض</button>
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3" /> استلام
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Archive className="w-8 h-8 text-amber-600" />
            إدارة الأرشيف المتكامل
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">نظام أرشفة ذكي للملفات الرقمية والفيزيائية مع تتبع كامل</p>
        </div>
        
        <div className="flex gap-4 text-center">
          <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">إجمالي المؤرشف</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{archivedCount}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">ملفات فيزيائية</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{physicalFilesCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-x-auto">
        {[
          { id: 'digital', label: 'الأرشيف الرقمي', icon: Folder },
          { id: 'physical', label: 'وحدات التخزين', icon: Box },
          { id: 'requests', label: 'طلبات الاستعارة', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[120px] py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'digital' && renderDigitalArchive()}
        {activeTab === 'physical' && renderPhysicalArchive()}
        {activeTab === 'requests' && renderRequests()}
      </div>
    </div>
  );
};

export default ArchivePage;
