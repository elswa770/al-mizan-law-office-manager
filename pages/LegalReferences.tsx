
import React, { useState, useMemo, useRef } from 'react';
import { LegalReference, ReferenceType, LawBranch } from '../types';
import { searchLegalReferences, fetchDetailedReferenceContent } from '../services/geminiService';
import { Search, Book, Scale, FileText, Library, Filter, Plus, X, Tag, Gavel, Bookmark, ArrowRight, ExternalLink, Sparkles, Loader2, Globe, Calendar, User, Hash, Download, Check, Link as LinkIcon, Upload, FileSearch, AlertTriangle } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface LegalReferencesProps {
  references: LegalReference[];
  onAddReference?: (ref: LegalReference) => void;
  readOnly?: boolean;
}

const LegalReferences: React.FC<LegalReferencesProps> = ({ references, onAddReference, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'article'>('keyword');
  const [selectedBranch, setSelectedBranch] = useState<LawBranch | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ReferenceType | 'all'>('all');
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<LegalReference | null>(null); // State for viewing details

  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<LegalReference[]>([]);
  const [showAiResults, setShowAiResults] = useState(false);
  
  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null); // ID of item being generated
  const [pdfContent, setPdfContent] = useState<string>(''); // Content to render in hidden div
  const pdfPrintRef = useRef<HTMLDivElement>(null);

  // File Import Refs
  const importFileRef = useRef<HTMLInputElement>(null);

  // New Reference Form State
  const [newRef, setNewRef] = useState<Partial<LegalReference>>({
    title: '',
    type: 'law',
    branch: 'civil',
    description: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  // --- Filtering Logic ---
  const filteredRefs = useMemo(() => {
    return references.filter(ref => {
      // 1. Category Filters
      if (selectedBranch !== 'all' && ref.branch !== selectedBranch) return false;
      if (selectedType !== 'all' && ref.type !== selectedType) return false;

      // 2. Search Logic
      const term = searchTerm.toLowerCase();
      if (!term) return true;

      if (searchMode === 'article') {
        return ref.articleNumber?.toLowerCase().includes(term);
      } else {
        return (
          ref.title.toLowerCase().includes(term) ||
          ref.description?.toLowerCase().includes(term) ||
          ref.tags?.some(t => t.toLowerCase().includes(term))
        );
      }
    });
  }, [references, searchTerm, searchMode, selectedBranch, selectedType]);

  // --- Handlers ---
  const handleAddTag = () => {
    if (tagInput.trim()) {
      setNewRef(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddReference && newRef.title) {
      onAddReference({
        ...newRef,
        id: Math.random().toString(36).substring(2, 9),
      } as LegalReference);
      setIsAddModalOpen(false);
      // Reset form
      setNewRef({ title: '', type: 'law', branch: 'civil', description: '', tags: [] });
    }
  };

  // --- PDF Import Handler ---
  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddReference) return;

    if (file.type !== 'application/pdf') {
      alert('الرجاء اختيار ملف PDF فقط.');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    
    // بدلاً من الحفظ المباشر، نفتح نافذة التعديل مع تعبئة البيانات
    setNewRef({
      title: file.name.replace('.pdf', ''),
      type: 'encyclopedia', // افتراضي
      branch: 'other',
      description: 'ملف PDF تم استيراده محلياً.',
      url: fileUrl, // Save the blob URL
      tags: ['مستورد', 'PDF'],
      year: new Date().getFullYear()
    });

    setIsAddModalOpen(true);
    
    // Reset input
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleAiSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsAiSearching(true);
    setShowAiResults(true);
    setAiResults([]); // Clear previous results

    try {
      const results = await searchLegalReferences(searchTerm);
      // Add temporary IDs to results
      const processedResults = results.map((r: any) => ({
        ...r,
        id: `ai-${Math.random().toString(36).substring(2, 9)}`
      }));
      setAiResults(processedResults);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء البحث الذكي. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSaveToLibrary = async (res: LegalReference) => {
    if (!onAddReference) return;

    // Case 1: External URL already exists (Real PDF found by AI)
    if (res.url) {
       onAddReference({
          ...res,
          id: Math.random().toString(36).substring(2, 9),
          // Keep description as is
       });
       alert('تم حفظ رابط المرجع في المكتبة بنجاح.');
       return;
    }

    // Case 2: Generate PDF from Content (AI Generation)
    setIsGeneratingPdf(res.id);

    try {
      // 1. Fetch detailed content text
      const content = await fetchDetailedReferenceContent(res.title, res.description || '');
      setPdfContent(content);

      // 2. Wait for state update and DOM rendering of hidden div
      setTimeout(async () => {
        if (!pdfPrintRef.current) return;

        // 3. Capture hidden div as image (handles Arabic correctly)
        const canvas = await html2canvas(pdfPrintRef.current, {
           scale: 2,
           useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');

        // 4. Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // 5. Add to library with PDF URL
        onAddReference({
          ...res,
          id: Math.random().toString(36).substring(2, 9),
          description: content.substring(0, 300) + '...', // Store summary
          url: pdfUrl // This makes it viewable later as a "Generated PDF"
        });

        setIsGeneratingPdf(null);
        setPdfContent(''); // Clear memory
        alert('تم توليد المرجع الكامل وحفظه كملف PDF في المكتبة بنجاح!');
      }, 800); // Increased timeout for rendering

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert('حدث خطأ أثناء تحميل الملف.');
      setIsGeneratingPdf(null);
    }
  };

  // --- Styling Helpers ---
  const getTypeColor = (type: ReferenceType) => {
    switch (type) {
      case 'law': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'ruling': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'encyclopedia': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'regulation': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBranchLabel = (branch: LawBranch) => {
    switch (branch) {
      case 'civil': return 'مدني';
      case 'criminal': return 'جنائي';
      case 'administrative': return 'مجلس دولة';
      case 'commercial': return 'تجاري/شركات';
      case 'family': return 'أسرة';
      case 'labor': return 'عمالي';
      default: return 'أخرى';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      
      {/* Hidden PDF Generation Container */}
      <div 
        ref={pdfPrintRef} 
        className="fixed top-0 left-0 bg-white p-16 text-slate-900 font-serif leading-loose z-[-50]"
        style={{ width: '210mm', minHeight: '297mm', direction: 'rtl', left: isGeneratingPdf ? '0' : '-9999px', visibility: isGeneratingPdf ? 'visible' : 'hidden' }}
      >
         <div className="border-b-2 border-slate-800 pb-4 mb-8">
            <h1 className="text-3xl font-bold text-center mb-2">الميزان - مرجع قانوني</h1>
            <p className="text-center text-slate-500 text-sm">تم الاستخراج والتوليد بواسطة الذكاء الاصطناعي</p>
         </div>
         <div className="whitespace-pre-wrap text-lg text-justify">
            {pdfContent}
         </div>
         <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>هذه الوثيقة تم إنشاؤها آلياً لأغراض البحث القانوني.</p>
         </div>
      </div>

      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={importFileRef} 
        className="hidden" 
        accept="application/pdf" 
        onChange={handleFileChange} 
      />

      {/* 1. Header & Search Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Library className="w-6 h-6 text-primary-600" />
              المكتبة والمراجع القانونية
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">قاعدة بيانات شاملة للقوانين، الأحكام، والموسوعات</p>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
               <button 
                onClick={handleImportClick}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                <Upload className="w-4 h-4" /> استيراد PDF
              </button>
              <button 
                onClick={() => {
                   setNewRef({ title: '', type: 'law', branch: 'civil', description: '', tags: [] });
                   setIsAddModalOpen(true);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> إضافة مرجع يدوياً
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={searchMode === 'article' ? "ابحث برقم المادة..." : "ابحث باسم القانون، الحكم، أو الكلمات المفتاحية..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white transition-all"
              />
            </div>
            
            {/* AI Search Button */}
            <button
              onClick={handleAiSearch}
              disabled={isAiSearching || !searchTerm}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAiSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>بحث ذكي (شامل)</span>
            </button>
          </div>

          {/* Search Options */}
          <div className="flex justify-between items-center">
             <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setSearchMode('keyword')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${searchMode === 'keyword' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                كلمات مفتاحية
              </button>
              <button
                onClick={() => setSearchMode('article')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${searchMode === 'article' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                رقم المادة
              </button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 ml-2">
                <Filter className="w-4 h-4" /> تصفية:
              </div>
              
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value as any)}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-1.5 px-3 rounded-lg text-sm outline-none"
              >
                <option value="all">كل الفروع</option>
                <option value="civil">مدني</option>
                <option value="criminal">جنائي</option>
                <option value="administrative">مجلس دولة</option>
                <option value="commercial">تجاري</option>
                <option value="family">أسرة</option>
              </select>

              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-1.5 px-3 rounded-lg text-sm outline-none"
              >
                <option value="all">كل الأنواع</option>
                <option value="law">قوانين</option>
                <option value="ruling">أحكام قضائية</option>
                <option value="encyclopedia">كتب وموسوعات</option>
                <option value="regulation">لوائح</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* AI Results Section */}
      {showAiResults && (
        <div className="bg-indigo-50 dark:bg-slate-800/50 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-6 animate-in slide-in-from-top-4">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                 <Globe className="w-5 h-5" /> نتائج البحث من الإنترنت (AI)
              </h3>
              <button onClick={() => setShowAiResults(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
           </div>
           
           {isAiSearching ? (
              <div className="py-8 text-center text-indigo-600 dark:text-indigo-400 flex flex-col items-center gap-3">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <p className="text-sm font-medium">جاري البحث عن مراجع وملفات PDF...</p>
              </div>
           ) : aiResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {aiResults.map(res => (
                    <div key={res.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col relative overflow-hidden group">
                       {res.url && (
                          <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-br-lg font-bold z-10">
                             رابط مباشر
                          </div>
                       )}
                       
                       <div className="flex justify-between items-start mb-2 pt-2">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${getTypeColor(res.type)}`}>
                             {res.type === 'law' ? 'قانون' : res.type === 'ruling' ? 'حكم' : 'مرجع'}
                          </span>
                          <button 
                             onClick={() => handleSaveToLibrary(res)}
                             disabled={!!isGeneratingPdf}
                             className={`text-xs px-3 py-1.5 rounded-md font-bold flex items-center gap-1 transition-colors ${
                                isGeneratingPdf === res.id 
                                  ? 'bg-slate-100 text-slate-500 cursor-wait' 
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                             }`}
                          >
                             {isGeneratingPdf === res.id ? (
                                <>
                                   <Loader2 className="w-3 h-3 animate-spin" /> جاري التوليد...
                                </>
                             ) : (
                                <>
                                   {res.url ? <LinkIcon className="w-3 h-3"/> : <Download className="w-3 h-3"/>}
                                   {res.url ? 'حفظ الرابط' : 'توليد PDF كامل'}
                                </>
                             )}
                          </button>
                       </div>
                       
                       <h4 className="font-bold text-slate-800 dark:text-white mb-1 leading-snug">{res.title}</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{res.description}</p>
                       
                       <div className="mt-auto flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex gap-2">
                             {res.articleNumber && <span>مادة: {res.articleNumber}</span>}
                             {res.year && <span>سنة: {res.year}</span>}
                          </div>
                          {res.url && (
                             <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> معاينة المصدر
                             </a>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           ) : (
              <p className="text-center text-slate-500 text-sm py-4">لم يتم العثور على نتائج مباشرة. حاول تغيير كلمات البحث.</p>
           )}
        </div>
      )}

      {/* 2. Local Results Grid */}
      <h3 className="font-bold text-slate-800 dark:text-white text-lg px-2">مراجع المكتبة المحلية</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRefs.map(ref => (
          <div key={ref.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all group flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${getTypeColor(ref.type)}`}>
                  {ref.type === 'law' ? 'قانون' : ref.type === 'ruling' ? 'حكم محكمة' : ref.type === 'encyclopedia' ? 'موسوعة' : 'لائحة'}
                </span>
                <span className="text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded">
                  {getBranchLabel(ref.branch)}
                </span>
              </div>
              
              <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {ref.title}
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                {ref.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {ref.tags?.map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
               <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  {ref.articleNumber && <span className="font-mono bg-white dark:bg-slate-700 px-1.5 rounded border border-slate-200 dark:border-slate-600">مادة {ref.articleNumber}</span>}
                  {ref.year && <span>سنة {ref.year}</span>}
               </div>
               
               <button 
                 onClick={() => setSelectedReference(ref)}
                 className="text-primary-600 dark:text-primary-400 hover:underline font-bold flex items-center gap-1"
               >
                  عرض التفاصيل <ArrowRight className="w-3 h-3" />
               </button>
            </div>
          </div>
        ))}
        
        {filteredRefs.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
            <Book className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium">لا توجد مراجع مطابقة للبحث</p>
            <p className="text-sm">حاول تغيير كلمات البحث أو التصنيفات</p>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedReference && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
           <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${selectedReference.url ? 'max-w-6xl h-[90vh]' : 'max-w-3xl max-h-[90vh]'} p-6 animate-in zoom-in-95 relative flex flex-col`}>
              {/* Header */}
              <div className="flex justify-between items-start mb-4 shrink-0">
                 <div>
                    <div className="flex gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getTypeColor(selectedReference.type)}`}>
                           {selectedReference.type === 'law' ? 'قانون' : selectedReference.type === 'ruling' ? 'حكم قضائي' : selectedReference.type === 'encyclopedia' ? 'مرجع / موسوعة' : 'لائحة'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                           {getBranchLabel(selectedReference.branch)}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">{selectedReference.title}</h2>
                 </div>
                 <button 
                   onClick={() => setSelectedReference(null)} 
                   className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-red-500 dark:text-slate-400 transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-6">
                 {/* PDF Viewer / Content Area */}
                 {selectedReference.url ? (
                    <div className="flex-1 flex flex-col min-h-[500px]">
                       <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg mb-2 text-sm flex items-center gap-2">
                          <FileSearch className="w-5 h-5" />
                          <span>للبحث داخل الملف، استخدم شريط أدوات العارض أو اضغط <b>Ctrl+F</b>.</span>
                       </div>
                       
                       {/* Safe fallback link for Edge/Browsers blocking local blobs in iframes */}
                       <div className="bg-amber-50 dark:bg-amber-900/20 p-2 text-center text-xs text-amber-800 dark:text-amber-300 border-b border-amber-100 dark:border-amber-800 flex justify-between items-center px-4 mb-2 rounded-lg">
                          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> هل تواجه مشكلة في العرض؟ (Blocked by Edge/Chrome)</span>
                          <a href={selectedReference.url} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-900 dark:hover:text-amber-200">
                             اضغط هنا لفتح الملف في نافذة مستقلة
                          </a>
                       </div>

                       {/* Using Object instead of Iframe for better PDF handling */}
                       <object 
                          data={`${selectedReference.url}#toolbar=1&navpanes=1`} 
                          type="application/pdf"
                          className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-700 flex-1"
                       >
                          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                             <p className="mb-2">لا يمكن عرض الملف مباشرة داخل المتصفح.</p>
                             <a href={selectedReference.url} target="_blank" rel="noopener noreferrer" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
                                تحميل / فتح الملف
                             </a>
                          </div>
                       </object>
                    </div>
                 ) : (
                    <>
                       {/* Grid Metadata (Only if no PDF or complementary) */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                          {selectedReference.articleNumber && (
                             <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> رقم المادة</p>
                                <p className="font-bold text-slate-800 dark:text-white font-mono">{selectedReference.articleNumber}</p>
                             </div>
                          )}
                          {selectedReference.year && (
                             <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> السنة</p>
                                <p className="font-bold text-slate-800 dark:text-white font-mono">{selectedReference.year}</p>
                             </div>
                          )}
                          {selectedReference.courtName && (
                             <div className="col-span-2 md:col-span-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Gavel className="w-3 h-3" /> المحكمة</p>
                                <p className="font-bold text-slate-800 dark:text-white truncate">{selectedReference.courtName}</p>
                             </div>
                          )}
                          {selectedReference.author && (
                             <div className="col-span-2 md:col-span-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> المؤلف</p>
                                <p className="font-bold text-slate-800 dark:text-white truncate">{selectedReference.author}</p>
                             </div>
                          )}
                       </div>

                       {/* Description */}
                       <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                             <FileText className="w-4 h-4" /> المحتوى / الملخص
                          </h4>
                          <div className="text-slate-600 dark:text-slate-300 leading-loose text-justify bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                             {selectedReference.description}
                          </div>
                       </div>
                    </>
                 )}

                 {/* Tags */}
                 {selectedReference.tags && selectedReference.tags.length > 0 && (
                    <div>
                       <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Tag className="w-4 h-4" /> الكلمات المفتاحية
                       </h4>
                       <div className="flex flex-wrap gap-2">
                          {selectedReference.tags.map((tag, idx) => (
                             <span key={idx} className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                                #{tag}
                             </span>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-700 shrink-0">
                 {selectedReference.url && (
                    <a 
                      href={selectedReference.url} 
                      download={`${selectedReference.title}.pdf`}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-200 dark:shadow-none transition-all"
                    >
                       <Download className="w-5 h-5" /> تحميل الملف
                    </a>
                 )}
                 <button 
                   className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                 >
                    <Bookmark className="w-5 h-5" /> حفظ في المفضلة
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" /> {newRef.url ? 'استكمال بيانات المرجع المستورد' : 'إضافة مرجع جديد'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {newRef.url && (
                 <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex items-center gap-2 text-sm text-green-800 dark:text-green-300 mb-4 border border-green-100 dark:border-green-800">
                    <Check className="w-4 h-4" /> تم تحميل ملف PDF بنجاح. يرجى استكمال البيانات.
                 </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">عنوان المرجع <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={newRef.title}
                  onChange={e => setNewRef({...newRef, title: e.target.value})}
                  className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="مثال: القانون المدني المصري"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">النوع</label>
                  <select 
                    value={newRef.type}
                    onChange={e => setNewRef({...newRef, type: e.target.value as ReferenceType})}
                    className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="law">قانون</option>
                    <option value="ruling">حكم محكمة</option>
                    <option value="encyclopedia">موسوعة / كتاب</option>
                    <option value="regulation">لائحة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الفرع</label>
                  <select 
                    value={newRef.branch}
                    onChange={e => setNewRef({...newRef, branch: e.target.value as LawBranch})}
                    className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="civil">مدني</option>
                    <option value="criminal">جنائي</option>
                    <option value="administrative">مجلس دولة</option>
                    <option value="commercial">تجاري</option>
                    <option value="family">أسرة</option>
                    <option value="labor">عمالي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {newRef.type === 'law' && (
                    <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم المادة</label>
                       <input 
                         type="text" 
                         value={newRef.articleNumber || ''}
                         onChange={e => setNewRef({...newRef, articleNumber: e.target.value})}
                         className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                       />
                    </div>
                 )}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سنة الإصدار</label>
                    <input 
                      type="number" 
                      value={newRef.year || ''}
                      onChange={e => setNewRef({...newRef, year: parseInt(e.target.value)})}
                      className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                 </div>
              </div>

              {newRef.type === 'ruling' && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المحكمة المصدرة</label>
                    <input 
                      type="text" 
                      value={newRef.courtName || ''}
                      onChange={e => setNewRef({...newRef, courtName: e.target.value})}
                      className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="مثال: محكمة النقض"
                    />
                 </div>
              )}

              {newRef.type === 'encyclopedia' && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المؤلف</label>
                    <input 
                      type="text" 
                      value={newRef.author || ''}
                      onChange={e => setNewRef({...newRef, author: e.target.value})}
                      className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                 </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوصف / المحتوى المختصر</label>
                <textarea 
                  rows={3}
                  value={newRef.description}
                  onChange={e => setNewRef({...newRef, description: e.target.value})}
                  className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="اكتب وصفاً مختصراً أو المبدأ القانوني..."
                />
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الكلمات المفتاحية (Tags)</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="اكتب واضغط Enter"
                    />
                    <button type="button" onClick={handleAddTag} className="bg-slate-200 dark:bg-slate-600 px-3 rounded-lg font-bold">+</button>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-2">
                    {newRef.tags?.map((tag, i) => (
                       <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded flex items-center gap-1">
                          {tag} <button type="button" onClick={() => setNewRef(prev => ({...prev, tags: prev.tags?.filter((_, idx) => idx !== i)}))} className="hover:text-red-500"><X className="w-3 h-3"/></button>
                       </span>
                    ))}
                 </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300">إلغاء</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold">حفظ المرجع</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalReferences;
