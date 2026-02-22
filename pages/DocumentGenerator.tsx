import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PenTool, FileText, Download, Printer, User, Briefcase, ChevronDown, Check, RefreshCw, Upload, Plus } from 'lucide-react';
import { Case, Client } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import mammoth from "mammoth";

interface DocumentGeneratorProps {
  cases: Case[];
  clients: Client[];
}

interface Template {
  id: string;
  title: string;
  type: 'contract' | 'poa' | 'notice' | 'other';
  content: string; // Using simple placeholder syntax: {{key}}
  placeholders: string[];
}

// Mock Templates (In a real app, these would be in a DB or external file)
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'lease_agreement',
    title: 'عقد إيجار (سكني/تجاري)',
    type: 'contract',
    placeholders: ['DATE', 'CLIENT_NAME', 'CLIENT_ID', 'CLIENT_ADDRESS', 'SECOND_PARTY_NAME', 'SECOND_PARTY_ID', 'SECOND_PARTY_ADDRESS', 'UNIT_ADDRESS', 'UNIT_DETAILS', 'RENT_AMOUNT', 'SECURITY_DEPOSIT', 'START_DATE', 'DURATION', 'PURPOSE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد إيجار أملاك</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: السيد/ {{CLIENT_NAME}}</strong> المقيم في: {{CLIENT_ADDRESS}} ويحمل رقم قومي: {{CLIENT_ID}} (طرف أول - مؤجر)</p>
      <p><strong>ثانياً: السيد/ {{SECOND_PARTY_NAME}}</strong> المقيم في: {{SECOND_PARTY_ADDRESS}} ويحمل رقم قومي: {{SECOND_PARTY_ID}} (طرف ثاني - مستأجر)</p>
      <br/>
      <h3 style="text-align: center;">التمهيد</h3>
      <p>يقر الطرفان بأهليتهما للتعاقد والتصرف، وقد اتفقا على ما يلي:</p>
      <p><strong>البند الأول:</strong> أجر الطرف الأول للطرف الثاني الشقة/الوحدة الكائنة في: {{UNIT_ADDRESS}} والمكونة من: {{UNIT_DETAILS}} بقصد استعمالها ({{PURPOSE}}).</p>
      <p><strong>البند الثاني:</strong> مدة هذا العقد هي <strong>{{DURATION}}</strong> تبدأ من تاريخ {{START_DATE}} وتنتهي في تاريخ ....................... ولا يجدد هذا العقد إلا بعقد جديد واتفاق جديد.</p>
      <p><strong>البند الثالث:</strong> القيمة الإيجارية الشهرية هي <strong>{{RENT_AMOUNT}} جنيه مصري</strong> تدفع مقدماً أول كل شهر للطرف الأول، وفي حالة التأخير عن الدفع لمدة ............ يعتبر العقد مفسوخاً من تلقاء نفسه دون حاجة إلى تنبيه أو إنذار.</p>
      <p><strong>البند الرابع:</strong> دفع الطرف الثاني للطرف الأول مبلغ وقدره <strong>{{SECURITY_DEPOSIT}} جنيه مصري</strong> كتأمين، يرد عند انتهاء العقد وتسليم العين بالحالة التي كانت عليها وقت التعاقد.</p>
      <p><strong>البند الخامس:</strong> يقر الطرف الثاني بأنه عاين العين المؤجرة المعاينة التامة النافية للجهالة وقبلها بحالتها الحالية، ويتعهد بالمحافظة عليها وصيانتها.</p>
      <p><strong>البند السادس:</strong> لا يجوز للمستأجر تأجير العين من الباطن أو التنازل عنها للغير دون موافقة كتابية من المؤجر.</p>
      <p><strong>البند السابع:</strong> تختص محكمة ............ بالنظر في أي نزاع ينشأ عن هذا العقد.</p>
      <p><strong>البند الثامن:</strong> تحرر هذا العقد من نسختين، بيد كل طرف نسخة للعمل بموجبها.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (المؤجر)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (المستأجر)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'employment_contract',
    title: 'عقد عمل (محدد المدة)',
    type: 'contract',
    placeholders: ['DATE', 'EMPLOYER_NAME', 'EMPLOYER_ADDRESS', 'EMPLOYEE_NAME', 'EMPLOYEE_ID', 'EMPLOYEE_ADDRESS', 'JOB_TITLE', 'SALARY', 'START_DATE', 'CONTRACT_DURATION', 'PROBATION_PERIOD'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد عمل محدد المدة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: شركة/السيد: {{EMPLOYER_NAME}}</strong> ومقرها: {{EMPLOYER_ADDRESS}} (طرف أول - صاحب العمل)</p>
      <p><strong>ثانياً: السيد/ {{EMPLOYEE_NAME}}</strong> المقيم في: {{EMPLOYEE_ADDRESS}} ويحمل رقم قومي: {{EMPLOYEE_ID}} (طرف ثاني - عامل)</p>
      <br/>
      <h3 style="text-align: center;">بنود العقد</h3>
      <p><strong>البند الأول:</strong> يعين الطرف الأول الطرف الثاني للعمل لديه في وظيفة <strong>{{JOB_TITLE}}</strong>، ويتعهد الطرف الثاني بأداء واجبات وظيفته بأمانة وإخلاص.</p>
      <p><strong>البند الثاني:</strong> مدة هذا العقد هي <strong>{{CONTRACT_DURATION}}</strong> تبدأ من تاريخ {{START_DATE}} وتنتهي في .......................، ويجوز تجديدها باتفاق الطرفين.</p>
      <p><strong>البند الثالث:</strong> يخضع الطرف الثاني لفترة اختبار مدتها <strong>{{PROBATION_PERIOD}}</strong>، ويجوز للطرف الأول إنهاء العقد خلال هذه الفترة دون إنذار أو تعويض إذا ثبت عدم صلاحية الطرف الثاني للعمل.</p>
      <p><strong>البند الرابع:</strong> يتقاضى الطرف الثاني راتباً شهرياً شاملاً قدره <strong>{{SALARY}} جنيه مصري</strong>، يصرف في نهاية كل شهر.</p>
      <p><strong>البند الخامس:</strong> يلتزم الطرف الثاني بمواعيد العمل الرسمية المحددة من قبل الشركة، وكذلك بتنفيذ تعليمات الرؤساء والمحافظة على أسرار العمل.</p>
      <p><strong>البند السادس:</strong> يستحق الطرف الثاني إجازة سنوية مدفوعة الأجر مدتها 21 يوماً بعد مرور سنة كاملة في الخدمة، وتزداد إلى 30 يوماً بعد مرور 10 سنوات أو تجاوز سن الخمسين.</p>
      <p><strong>البند السابع:</strong> تختص المحكمة العمالية بنظر أي نزاع ينشأ عن هذا العقد.</p>
      <p><strong>البند الثامن:</strong> تحرر هذا العقد من ثلاث نسخ، بيد كل طرف نسخة وأودعت النسخة الثالثة بمكتب التأمينات الاجتماعية المختص.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (صاحب العمل)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (العامل)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'apartment_sale_contract',
    title: 'عقد بيع شقة سكنية (نهائي)',
    type: 'contract',
    placeholders: ['DATE', 'SELLER_NAME', 'SELLER_ID', 'SELLER_ADDRESS', 'BUYER_NAME', 'BUYER_ID', 'BUYER_ADDRESS', 'APARTMENT_ADDRESS', 'APARTMENT_AREA', 'FLOOR_NUMBER', 'TOTAL_PRICE', 'PAID_AMOUNT', 'REMAINING_AMOUNT'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد بيع شقة سكنية</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: السيد/ {{SELLER_NAME}}</strong> المقيم في: {{SELLER_ADDRESS}} ويحمل رقم قومي: {{SELLER_ID}} (طرف أول - بائع)</p>
      <p><strong>ثانياً: السيد/ {{BUYER_NAME}}</strong> المقيم في: {{BUYER_ADDRESS}} ويحمل رقم قومي: {{BUYER_ID}} (طرف ثاني - مشتري)</p>
      <br/>
      <h3 style="text-align: center;">التمهيد</h3>
      <p>يمتلك الطرف الأول الشقة السكنية الكائنة في: {{APARTMENT_ADDRESS}} بالدور {{FLOOR_NUMBER}} والبالغ مساحتها {{APARTMENT_AREA}} متر مربع تقريباً، ورغب الطرف الأول في بيعها للطرف الثاني الذي قبل شراءها وفقاً للبنود التالية:</p>
      <p><strong>البند الأول:</strong> يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.</p>
      <p><strong>البند الثاني:</strong> باع وأسقط وتنازل الطرف الأول بكافة الضمانات الفعلية والقانونية للطرف الثاني القابل لذلك الشقة الموضحة بالتمهيد.</p>
      <p><strong>البند الثالث:</strong> تم هذا البيع نظير ثمن إجمالي قدره <strong>{{TOTAL_PRICE}} جنيه مصري</strong>.</p>
      <p><strong>البند الرابع:</strong> دفع الطرف الثاني للطرف الأول مبلغ وقدره <strong>{{PAID_AMOUNT}} جنيه مصري</strong> عند التوقيع على هذا العقد، والباقي وقدره <strong>{{REMAINING_AMOUNT}} جنيه مصري</strong> يسدد على النحو التالي: ........................................................</p>
      <p><strong>البند الخامس:</strong> يقر الطرف الثاني بأنه عاين الشقة المبيعة المعاينة التامة النافية للجهالة وقبلها بحالتها الراهنة.</p>
      <p><strong>البند السادس:</strong> يلتزم الطرف الأول بتسليم الشقة للطرف الثاني خالية من الأشخاص والشواغل في موعد أقصاه .......................، كما يلتزم بتقديم كافة المستندات اللازمة لنقل الملكية وتسجيل العقد.</p>
      <p><strong>البند السابع:</strong> يقر الطرف الأول بخلو الشقة من كافة الحقوق العينية الأصلية والتبعية كالرهن والاختصاص والامتياز، وأنها ليست موقوفة ولا محكورة.</p>
      <p><strong>البند الثامن:</strong> تختص محكمة ............ بنظر أي نزاع ينشأ حول تنفيذ أو تفسير بنود هذا العقد.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (البائع)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (المشتري)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'car_sale_contract',
    title: 'عقد بيع سيارة',
    type: 'contract',
    placeholders: ['DATE', 'SELLER_NAME', 'SELLER_ID', 'SELLER_ADDRESS', 'BUYER_NAME', 'BUYER_ID', 'BUYER_ADDRESS', 'CAR_MAKE', 'CAR_MODEL', 'CAR_YEAR', 'CAR_PLATE', 'CAR_CHASSIS', 'CAR_MOTOR', 'CAR_COLOR', 'PRICE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد بيع سيارة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: السيد/ {{SELLER_NAME}}</strong> المقيم في: {{SELLER_ADDRESS}} ويحمل رقم قومي: {{SELLER_ID}} (طرف أول - بائع)</p>
      <p><strong>ثانياً: السيد/ {{BUYER_NAME}}</strong> المقيم في: {{BUYER_ADDRESS}} ويحمل رقم قومي: {{BUYER_ID}} (طرف ثاني - مشتري)</p>
      <br/>
      <h3 style="text-align: center;">البنود</h3>
      <p><strong>البند الأول:</strong> باع الطرف الأول للطرف الثاني السيارة رقم ({{CAR_PLATE}}) ماركة ({{CAR_MAKE}}) موديل ({{CAR_MODEL}}) سنة الصنع ({{CAR_YEAR}}) شاسيه رقم ({{CAR_CHASSIS}}) موتور رقم ({{CAR_MOTOR}}) لون ({{CAR_COLOR}}).</p>
      <p><strong>البند الثاني:</strong> تم هذا البيع نظير ثمن إجمالي قدره <strong>{{PRICE}} جنيه مصري</strong>، دفعه الطرف الثاني للطرف الأول عداً ونقداً بمجلس العقد، ويعتبر توقيع الطرف الأول على هذا العقد بمثابة مخالصة تامة بالثمن.</p>
      <p><strong>البند الثالث:</strong> يقر الطرف الثاني بأنه عاين السيارة المبيعة المعاينة التامة النافية للجهالة وقبلها بحالتها الراهنة (كما هي) وتحت مسؤوليته.</p>
      <p><strong>البند الرابع:</strong> يقر الطرف الأول بأن السيارة المبيعة ملك خالص له، وأنه لا يوجد عليها أي حظر بيع أو أقساط أو مستحقات للغير أو للجمارك أو للضرائب حتى تاريخ تحرير هذا العقد.</p>
      <p><strong>البند الخامس:</strong> يلتزم الطرف الأول بعمل توكيل رسمي بالبيع للنفس والغير للطرف الثاني أو الحضور أمام الشهر العقاري لنقل الملكية خلال مدة أقصاه ............ يوم من تاريخه.</p>
      <p><strong>البند السادس:</strong> يتحمل الطرف الثاني كافة المخالفات المرورية والرسوم والضرائب المتعلقة بالسيارة اعتباراً من تاريخ وساعة استلام السيارة وتحرير هذا العقد.</p>
      <p><strong>البند السابع:</strong> تحرر هذا العقد من نسختين، بيد كل طرف نسخة للعمل بموجبها.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (البائع)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (المشتري)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'general_poa',
    title: 'توكيل رسمي عام قضايا',
    type: 'poa',
    placeholders: ['CLIENT_NAME', 'CLIENT_ID', 'CLIENT_ADDRESS', 'LAWYER_NAME'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">توكيل رسمي عام في القضايا</h2>
      <p>أقر أنا الموقع أدناه:</p>
      <p>الاسم: <strong>{{CLIENT_NAME}}</strong></p>
      <p>الجنسية: مصري - الديانة: مسلم</p>
      <p>الثابت الشخصية بموجب رقم قومي: <strong>{{CLIENT_ID}}</strong></p>
      <p>المقيم في: {{CLIENT_ADDRESS}}</p>
      <br/>
      <p>أنني قد وكلت الأستاذ/ <strong>{{LAWYER_NAME}}</strong> المحامي.</p>
      <br/>
      <p>في الحضور والمرافعة عني أمام جميع المحاكم بجميع أنواعها ودرجاتها (الجزئية والابتدائية والاستئناف والنقض) ومحاكم القضاء الإداري ومجلس الدولة، وفي تقديم المذكرات والطعون واستلام الأحكام وتنفيذها.</p>
      <p>كما وكلته في الصلح والإقرار والإنكار والإبراء والتحكيم والطعن بالتزوير، وفي استلام الأوراق والمستندات، وفي التوقيع نيابة عني على كافة الأوراق اللازمة لذلك.</p>
      <br/><br/>
      <p style="text-align: left;">توقيع الموكل: .......................</p>
    `
  },
  {
    id: 'warning_notice',
    title: 'إنذار على يد محضر',
    type: 'notice',
    placeholders: ['DATE', 'CLIENT_NAME', 'LAWYER_NAME', 'OPPONENT_NAME', 'OPPONENT_ADDRESS', 'AMOUNT', 'REASON', 'DEADLINE_DAYS'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">إنذار على يد محضر</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>بناءً على طلب السيد/ <strong>{{CLIENT_NAME}}</strong></p>
      <p>ومحله المختار مكتب الأستاذ/ <strong>{{LAWYER_NAME}}</strong> المحامي.</p>
      <br/>
      <p>أنا ............ محضر محكمة ............ قد انتقلت وأعلنت:</p>
      <p>السيد/ <strong>{{OPPONENT_NAME}}</strong> المقيم في: {{OPPONENT_ADDRESS}}</p>
      <br/>
      <h3 style="text-align: center;">الموضوع</h3>
      <p>ينذر الطالب المعلن إليه بضرورة سداد مبلغ وقدره <strong>{{AMOUNT}}</strong> وذلك قيمة {{REASON}}.</p>
      <p>حيث أن الطالب قد طالب المعلن إليه مراراً وتكراراً بالطرق الودية إلا أنه امتنع دون وجه حق.</p>
      <p>لذا، ينبه الطالب على المعلن إليه بضرورة السداد خلال <strong>({{DEADLINE_DAYS}}) يوماً</strong> من تاريخ استلام هذا الإنذار، وإلا سيضطر الطالب لاتخاذ كافة الإجراءات القانونية القبلية والمدنية والجنائية ضده، مع تحميله كافة المصروفات والأتعاب.</p>
      <br/>
      <h3 style="text-align: center;">بناءً عليه</h3>
      <p>أنا المحضر سالف الذكر قد انتقلت وسلمت صورة من هذا الإنذار للمعلن إليه للعلم بما جاء به ونفاذ مفعوله في مواجهته.</p>
      <p>ولأجل العلم....</p>
    `
  }
];

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ cases, clients }) => {
  // State for Custom Templates (Imported)
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [selectedContext, setSelectedContext] = useState<{type: 'client' | 'case', id: string} | null>(null);
  
  // Combine Default and Custom Templates
  const allTemplates = useMemo(() => [...DEFAULT_TEMPLATES, ...customTemplates], [customTemplates]);

  // Dynamic Form Data
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');
  
  const printRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  // 1. Auto-Fill Logic
  useEffect(() => {
    const template = allTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let newData: Record<string, string> = { ...formData };
    
    // Fill based on context
    if (selectedContext) {
       if (selectedContext.type === 'client') {
          const client = clients.find(c => c.id === selectedContext.id);
          if (client) {
             newData['CLIENT_NAME'] = client.name;
             newData['CLIENT_ID'] = client.nationalId;
             newData['CLIENT_ADDRESS'] = client.address || '';
          }
       } else if (selectedContext.type === 'case') {
          const kase = cases.find(c => c.id === selectedContext.id);
          if (kase) {
             newData['CLIENT_NAME'] = kase.clientName;
             const client = clients.find(c => c.id === kase.clientId);
             if (client) {
                newData['CLIENT_ID'] = client.nationalId;
                newData['CLIENT_ADDRESS'] = client.address || '';
             }
             if (kase.opponents && kase.opponents.length > 0) {
                newData['SECOND_PARTY_NAME'] = kase.opponents[0].name;
                newData['OPPONENT_NAME'] = kase.opponents[0].name;
             }
          }
       }
    }
    
    // Set Defaults
    if (!newData['DATE']) newData['DATE'] = new Date().toLocaleDateString('ar-EG');
    if (!newData['LAWYER_NAME']) newData['LAWYER_NAME'] = 'اسم المحامي (تلقائي)'; 

    setFormData(newData);
  }, [selectedTemplateId, selectedContext, clients, cases, allTemplates]);

  // 2. Generate Preview
  useEffect(() => {
    const template = allTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let html = template.content;
    
    // Replace all placeholders found in formData
    Object.keys(formData).forEach(key => {
       const value = formData[key] || '................';
       const regex = new RegExp(`{{${key}}}`, 'g');
       html = html.replace(regex, value);
    });

    // Replace remaining placeholders with dots/highlight
    template.placeholders.forEach(key => {
       if (!formData[key]) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, `<span style="color:red; background:#fee;">[${key}]</span>`);
       }
    });

    setPreviewContent(html);
  }, [formData, selectedTemplateId, allTemplates]);

  const handleInputChange = (key: string, value: string) => {
     setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Convert Word to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Extract placeholders {{KEY}}
      const matches: string[] = html.match(/{{(.*?)}}/g) || [];
      // Clean up placeholders (remove brackets and duplicates)
      const placeholders: string[] = Array.from(new Set(matches.map((m: string) => m.replace(/{{|}}/g, '').trim())));

      const newTemplate: Template = {
        id: `custom_${Date.now()}`,
        title: file.name.replace('.docx', ''),
        type: 'other',
        content: html,
        placeholders: placeholders
      };

      setCustomTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplateId(newTemplate.id);
      alert('تم استيراد النموذج بنجاح! يمكنك الآن ملء البيانات.');

    } catch (error) {
      console.error("Error importing docx:", error);
      alert('حدث خطأ أثناء قراءة ملف Word. تأكد أنه ملف .docx صالح.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
     if (printRef.current) {
        const win = window.open('', '', 'height=700,width=900');
        if (win) {
           win.document.write('<html><head><title>طباعة مستند</title>');
           win.document.write('<style>body { font-family: "Cairo", sans-serif; direction: rtl; padding: 40px; } </style>');
           win.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">');
           win.document.write('</head><body>');
           win.document.write(printRef.current.innerHTML);
           win.document.write('</body></html>');
           win.document.close();
           win.focus();
           setTimeout(() => {
              win.print();
              win.close();
           }, 500);
        }
     }
  };

  const handleDownloadPDF = async () => {
     if (!printRef.current) return;
     try {
        const canvas = await html2canvas(printRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save('document.pdf');
     } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء تحميل الملف');
     }
  };

  const handleDownloadWord = () => {
     if (!previewContent) return;
     
     const header = `
       <html xmlns:o='urn:schemas-microsoft-com:office:office' 
             xmlns:w='urn:schemas-microsoft-com:office:word' 
             xmlns='http://www.w3.org/TR/REC-html40'>
       <head>
         <meta charset='utf-8'>
         <style>
           body { font-family: Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.5; }
           h2, h3 { text-align: center; }
           p { margin-bottom: 10px; }
         </style>
       </head>
       <body>`;
     const footer = "</body></html>";
     const html = header + previewContent + footer;

     const blob = new Blob(['\ufeff', html], {
       type: 'application/msword'
     });
     
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `${currentTemplate?.title || 'document'}.doc`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
  };

  const currentTemplate = allTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
       
       {/* 1. Header */}
       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <PenTool className="w-6 h-6 text-primary-600" />
                إدارة العقود والمحررات
             </h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                صياغة قانونية آلية دقيقة وسريعة
             </p>
          </div>
          
          <div className="flex gap-2">
             <button onClick={handleDownloadWord} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                <FileText className="w-4 h-4 text-blue-600" /> Word
             </button>
             <button onClick={handleDownloadPDF} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                <Download className="w-4 h-4" /> PDF
             </button>
             <button onClick={handlePrint} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> طباعة
             </button>
          </div>
       </div>

       {/* 2. Controls Bar */}
       <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl flex flex-col md:flex-row gap-4 border border-slate-200 dark:border-slate-700 shrink-0 items-end">
          <div className="flex-1 w-full">
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اختر النموذج</label>
             <div className="relative">
                <select 
                  value={selectedTemplateId} 
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white py-2 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                >
                   <optgroup label="نماذج النظام">
                      {DEFAULT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                   </optgroup>
                   {customTemplates.length > 0 && (
                      <optgroup label="نماذج مستوردة">
                         {customTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </optgroup>
                   )}
                </select>
                <ChevronDown className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
             </div>
          </div>

          <div className="flex-1 w-full">
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مصدر البيانات (اختياري)</label>
             <div className="relative">
                <select 
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white py-2 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => {
                     const [type, id] = e.target.value.split(':');
                     if (type && id) setSelectedContext({ type: type as any, id });
                     else setSelectedContext(null);
                  }}
                >
                   <option value="">-- ملء يدوي --</option>
                   <optgroup label="الموكلين">
                      {clients.map(c => <option key={c.id} value={`client:${c.id}`}>{c.name}</option>)}
                   </optgroup>
                   <optgroup label="القضايا">
                      {cases.map(c => <option key={c.id} value={`case:${c.id}`}>{c.title}</option>)}
                   </optgroup>
                </select>
                <ChevronDown className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
             </div>
          </div>

          {/* Import Button */}
          <div>
             <input type="file" ref={importInputRef} accept=".docx" className="hidden" onChange={handleImportWord} />
             <button 
               onClick={() => importInputRef.current?.click()}
               className="h-[42px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
               title="استيراد ملف Word (.docx) وتحديد المتغيرات تلقائياً {{KEY}}"
             >
                <Upload className="w-4 h-4" /> استيراد Word
             </button>
          </div>
       </div>

       {/* 3. Main Workspace (Split View) */}
       <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          
          {/* Left: Input Form */}
          <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <FileText className="w-4 h-4 text-indigo-500" /> البيانات المطلوبة
                </h3>
                <button 
                  onClick={() => setFormData({})} 
                  className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
                  title="مسح جميع الحقول"
                >
                   <RefreshCw className="w-3 h-3" /> إعادة تعيين
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentTemplate?.placeholders && currentTemplate.placeholders.length > 0 ? (
                   currentTemplate.placeholders.map(field => (
                      <div key={field}>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                            {field.replace(/_/g, ' ')}
                         </label>
                         <input 
                           type="text" 
                           value={formData[field] || ''}
                           onChange={(e) => handleInputChange(field, e.target.value)}
                           className="w-full border p-2 rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                           placeholder={`أدخل ${field.toLowerCase()}...`}
                         />
                      </div>
                   ))
                ) : (
                   <div className="text-center text-slate-400 py-8">
                      <p className="text-sm">لا توجد حقول متغيرة (Placeholders) في هذا النموذج.</p>
                      <p className="text-xs mt-2">لاستيراد نموذج، استخدم صيغة {'{{KEY}}'} داخل ملف Word.</p>
                   </div>
                )}
             </div>
          </div>

          {/* Right: Preview (A4 Paper Style) */}
          <div className="flex-1 bg-slate-200 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto p-8 flex justify-center shadow-inner">
             <div 
               ref={printRef}
               className="bg-white text-black shadow-lg p-12 w-full max-w-[210mm] min-h-[297mm] transition-all"
               style={{ fontFamily: "'Cairo', sans-serif", fontSize: '14px', lineHeight: '1.8' }}
             >
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
             </div>
          </div>

       </div>
    </div>
  );
};

export default DocumentGenerator;