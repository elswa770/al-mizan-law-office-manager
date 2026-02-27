import React, { useState, useMemo, useEffect } from 'react';
import { Case, Client, ArchiveLocation, ArchiveRequest, CaseStatus, ArchiveLocationType, ArchiveRequestStatus } from '../types';
import { 
  Archive, Search, Filter, Folder, Box, FileText, Clock, User, 
  MapPin, CheckCircle, XCircle, AlertCircle, ArrowUpRight, ArrowDownLeft,
  Plus, Trash2, Edit3, QrCode, Printer, Shield, Lock, Unlock, X, Save
} from 'lucide-react';
import { 
  doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, 
  query, where, getDocs, onSnapshot, orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface ArchiveProps {
  cases: Case[];
  clients: Client[];
  onUpdateCase?: (updatedCase: Case) => void;
}

const ArchivePage: React.FC<ArchiveProps> = ({ cases, clients, onUpdateCase }) => {
  const [activeTab, setActiveTab] = useState<'digital' | 'physical' | 'requests'>('digital');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'archived' | 'active'>('archived');

  // Firebase Data States
  const [locations, setLocations] = useState<ArchiveLocation[]>([]);
  const [requests, setRequests] = useState<ArchiveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ArchiveLocation | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Form States
  const [locationForm, setLocationForm] = useState({
    name: '',
    type: ArchiveLocationType.BOX,
    fullPath: '',
    capacity: 100,
    description: ''
  });

  const [requestForm, setRequestForm] = useState({
    caseId: '',
    notes: ''
  });

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load locations
        const locationsQuery = query(collection(db, 'archiveLocations'), orderBy('createdAt', 'desc'));
        const locationsSnapshot = await getDocs(locationsQuery);
        const locationsData = locationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ArchiveLocation));
        setLocations(locationsData);

        // Load requests
        const requestsQuery = query(collection(db, 'archiveRequests'), orderBy('requestDate', 'desc'));
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ArchiveRequest));
        setRequests(requestsData);
      } catch (error) {
        console.error('Error loading archive data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Firebase Operations ---
  const addLocation = async () => {
    // Validate form
    if (!locationForm.name.trim()) {
      alert('يرجى إدخال اسم الوحدة');
      return;
    }
    if (locationForm.capacity < 1) {
      alert('السعة يجب أن تكون أكبر من صفر');
      return;
    }

    try {
      const newLocation: Omit<ArchiveLocation, 'id'> = {
        name: locationForm.name.trim(),
        type: locationForm.type,
        fullPath: locationForm.fullPath.trim(),
        capacity: locationForm.capacity,
        description: locationForm.description.trim(),
        occupied: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Adding location:', newLocation);
      const docRef = await addDoc(collection(db, 'archiveLocations'), newLocation);
      console.log('Location added with ID:', docRef.id);
      
      setLocations(prev => [...prev, { id: docRef.id, ...newLocation }]);
      setIsLocationModalOpen(false);
      setLocationForm({ name: '', type: ArchiveLocationType.BOX, fullPath: '', capacity: 100, description: '' });
      alert('تم إضافة وحدة التخزين بنجاح');
    } catch (error) {
      console.error('Error adding location:', error);
      alert('حدث خطأ أثناء إضافة وحدة التخزين: ' + (error as Error).message);
    }
  };

  const updateLocation = async () => {
    if (!editingLocation) return;

    try {
      const updatedLocation = {
        ...locationForm,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'archiveLocations', editingLocation.id), updatedLocation);
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...updatedLocation } : loc
      ));
      setIsLocationModalOpen(false);
      setEditingLocation(null);
      setLocationForm({ name: '', type: 'box', fullPath: '', capacity: 100, description: '' });
      alert('تم تحديث وحدة التخزين بنجاح');
    } catch (error) {
      console.error('Error updating location:', error);
      alert('حدث خطأ أثناء تحديث وحدة التخزين');
    }
  };

  const deleteLocation = async (locationId: string) => {
    if (!confirm('هل أنت متأكد من حذف وحدة التخزين؟')) return;

    try {
      await deleteDoc(doc(db, 'archiveLocations', locationId));
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      alert('تم حذف وحدة التخزين بنجاح');
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('حدث خطأ أثناء حذف وحدة التخزين');
    }
  };

  const addRequest = async () => {
    try {
      const newRequest: Omit<ArchiveRequest, 'id'> = {
        caseId: requestForm.caseId,
        requesterId: 'current-user', // Should come from auth context
        requestDate: new Date().toISOString(),
        status: ArchiveRequestStatus.PENDING,
        notes: requestForm.notes
      };

      const docRef = await addDoc(collection(db, 'archiveRequests'), newRequest);
      setRequests(prev => [...prev, { id: docRef.id, ...newRequest }]);
      setIsRequestModalOpen(false);
      setRequestForm({ caseId: '', notes: '' });
      setSelectedCase(null);
      alert('تم إرسال طلب الاستعارة بنجاح');
    } catch (error) {
      console.error('Error adding request:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    }
  };

  const updateRequestStatus = async (requestId: string, status: ArchiveRequestStatus) => {
    try {
      const updateData = {
        status,
        approvedBy: 'current-user', // Should come from auth context
        approvedDate: new Date().toISOString()
      };

      await updateDoc(doc(db, 'archiveRequests', requestId), updateData);
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, ...updateData } : req
      ));
      alert('تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      console.error('Error updating request:', error);
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const archiveCasePhysically = async (caseId: string) => {
    const caseData = cases.find(c => c.id === caseId);
    if (!caseData) return;

    const locationId = prompt('اختر وحدة التخزين (أدخل معرف الوحدة):');
    if (!locationId) return;

    const boxNumber = prompt('رقم الصندوق:');
    if (!boxNumber) return;

    try {
      const archiveData = {
        locationId,
        boxNumber,
        archivedDate: new Date().toISOString(),
        archivedBy: 'current-user',
        physicalCondition: 'good' as const
      };

      await updateDoc(doc(db, 'cases', caseId), { 
        archiveData,
        status: CaseStatus.ARCHIVED 
      });

      if (onUpdateCase) {
        onUpdateCase({ ...caseData, archiveData, status: CaseStatus.ARCHIVED });
      }

      // Update location occupancy
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        await updateDoc(doc(db, 'archiveLocations', locationId), {
          occupied: location.occupied + 1
        });
        setLocations(prev => prev.map(loc => 
          loc.id === locationId ? { ...loc, occupied: loc.occupied + 1 } : loc
        ));
      }

      alert('تم أرشفة القضية فيزيائياً بنجاح');
    } catch (error) {
      console.error('Error archiving case:', error);
      alert('حدث خطأ أثناء أرشفة القضية');
    }
  };

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
              <button 
                onClick={() => window.open(`/cases/${c.id}`, '_blank')}
                className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                عرض الملف
              </button>
              {!c.archiveData && (
                <button 
                  onClick={() => archiveCasePhysically(c.id)}
                  className="flex-1 py-1.5 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
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
          <button 
            onClick={() => {
              setEditingLocation(null);
              setLocationForm({ name: '', type: ArchiveLocationType.BOX, fullPath: '', capacity: 100, description: '' });
              setIsLocationModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
          >
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
                      <button 
                        onClick={() => {
                          setEditingLocation(loc);
                          setLocationForm({
                            name: loc.name,
                            type: loc.type,
                            fullPath: loc.fullPath,
                            capacity: loc.capacity,
                            description: loc.description || ''
                          });
                          setIsLocationModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-700 rounded"
                        title="تعديل الوحدة"
                      >
                        <Edit3 className="w-4 h-4"/>
                      </button>
                      <button 
                        onClick={() => deleteLocation(loc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-700 rounded"
                        title="حذف الوحدة"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-700 rounded"
                        title="طباعة الباركود"
                      >
                        <Printer className="w-4 h-4"/>
                      </button>
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
                          <button 
                            onClick={() => updateRequestStatus(req.id, ArchiveRequestStatus.APPROVED)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                          >
                            موافقة
                          </button>
                          <button 
                            onClick={() => updateRequestStatus(req.id, ArchiveRequestStatus.REJECTED)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <button 
                          onClick={() => {
                            // Mark as returned
                            updateDoc(doc(db, 'archiveRequests', req.id), {
                              actualReturnDate: new Date().toISOString()
                            });
                            alert('تم تسجيل استلام الملف بنجاح');
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
                        >
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

  // --- Modals ---
  const renderLocationModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {editingLocation ? 'تعديل وحدة التخزين' : 'إضافة وحدة تخزين جديدة'}
          </h3>
          <button onClick={() => setIsLocationModalOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          if (editingLocation) {
            updateLocation();
          } else {
            addLocation();
          }
        }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              اسم الوحدة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              placeholder="مثال: صندوق قضايا 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              النوع <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={locationForm.type}
              onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value as ArchiveLocationType })}
            >
              <option value={ArchiveLocationType.ROOM}>غرفة</option>
              <option value={ArchiveLocationType.CABINET}>دولاب</option>
              <option value={ArchiveLocationType.SHELF}>رف</option>
              <option value={ArchiveLocationType.BOX}>صندوق</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              المسار الكامل
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={locationForm.fullPath}
              onChange={(e) => setLocationForm({ ...locationForm, fullPath: e.target.value })}
              placeholder="مثال: الدور الأرضي - غرفة A - دولاب 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              السعة <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={locationForm.capacity}
              onChange={(e) => setLocationForm({ ...locationForm, capacity: parseInt(e.target.value) })}
              placeholder="عدد الملفات"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              وصف (اختياري)
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={locationForm.description}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingLocation ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
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

      {/* Modals */}
      {isLocationModalOpen && renderLocationModal()}
    </div>
  );
};

export default ArchivePage;
