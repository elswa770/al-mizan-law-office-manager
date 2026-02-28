import React from 'react';
import { Lawyer, Case, LawyerStatus, BarLevel } from '../types';
import { 
  User, Phone, Mail, MapPin, Briefcase, Award, DollarSign, Calendar, 
  ArrowRight, FileText, CheckCircle, Clock, AlertCircle 
} from 'lucide-react';

interface LawyerDetailsProps {
  lawyerId: string;
  lawyers: Lawyer[];
  cases: Case[];
  onBack: () => void;
  onUpdateLawyer: (lawyer: Lawyer) => void;
  readOnly?: boolean;
}

const LawyerDetails: React.FC<LawyerDetailsProps> = ({ 
  lawyerId, lawyers, cases, onBack, onUpdateLawyer, readOnly = false 
}) => {
  const lawyer = lawyers.find(l => l.id === lawyerId);
  
  if (!lawyer) return <div>Lawyer not found</div>;

  const assignedCases = cases.filter(c => c.assignedLawyerId === lawyer.id);
  const activeCasesCount = assignedCases.filter(c => c.status !== 'مغلقة').length;
  const closedCasesCount = assignedCases.filter(c => c.status === 'مغلقة').length;

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{lawyer.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${lawyer.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
            {lawyer.status === 'active' ? 'نشط' : 'غير نشط'} • {lawyer.barNumber || 'غير محدد'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            درجة القيد: {lawyer.barLevel || 'غير محدد'}
          </p>
          {lawyer.barRegistrationNumber && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              القيد في النقابة: {lawyer.barRegistrationNumber}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-3xl mb-4">
                {lawyer.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{lawyer.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{lawyer.specialization}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">رقم الهاتف</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">البريد الإلكتروني</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">الموقع</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.officeLocation || 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">الساعة بالجنيه</p>
                  <p className="font-bold text-slate-800 dark:text-white">{(lawyer.hourlyRate || 0).toLocaleString()} EGP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Cases */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي القضايا</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{assignedCases.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">قضايا نشطة</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{activeCasesCount}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-full">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">قضايا مغلقة</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{closedCasesCount}</p>
              </div>
            </div>
          </div>

          {/* Assigned Cases List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-slate-500" /> القضايا المسندة
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {assignedCases.length > 0 ? assignedCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.caseNumber} • {c.court}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    c.status === 'مغلقة' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد قضايا مسندة حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDetails;
