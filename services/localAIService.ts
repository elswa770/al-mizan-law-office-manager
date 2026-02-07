// Local AI Assistant - Enhanced with Learning Capabilities
import { Case, CaseDocument, LegalReference } from '../types';

// Local Knowledge Base
let localKnowledgeBase = {
  cases: [] as Case[],
  documents: [] as CaseDocument[],
  references: [] as LegalReference[],
  conversations: [] as { question: string; answer: string; timestamp: string }[],
  legalTerms: new Map<string, string>(),
  casePatterns: new Map<string, string[]>()
};

// Initialize Legal Terms Dictionary
const initializeLegalTerms = () => {
  const terms = {
    'بطلان': 'إبطال العقد أو الإجراء القانوني لعدم توافر أركانه',
    'دفوع': 'وسائل قانونية يستخدمها المدعى عليه للدفاع عن نفسه',
    'إثبات': 'إقامة الدليل على صحة ادعاء أمام القضاء',
    'تقادم': 'مضي المدة القانونية على الحق مما يفقده قوته',
    'اختصاص': 'صلاحية المحكمة بنظر الدعوى',
    'إعلان': 'إبلاغ الخصم بصحيفة الدعوى',
    'حكم': 'قرار قضائي نهائي ينهي الخصومة',
    'استئناف': 'الطعن في الحكم أمام محكمة أعلى',
    'نقض': 'الطعن في الحكم أمام محكمة النقض',
    'تنفيذ': 'جعل الحكم القضائي نافذاً',
    'كفالة': 'ضمان مالي لتنفيذ الالتزام',
    'حجز': 'وضع اليد على أموال المدين',
    'إفلاس': 'عجز المدين عن سداد ديونه',
    'صلح': 'اتفاق بين الخصوم لإنهاء النزاع'
  };

  for (const [term, definition] of Object.entries(terms)) {
    localKnowledgeBase.legalTerms.set(term, definition);
  }
};

// Learn from existing cases
export const learnFromCases = (cases: Case[]) => {
  localKnowledgeBase.cases = cases;
  
  // Extract patterns from cases
  cases.forEach(case_ => {
    const keywords = extractKeywords(case_.title + ' ' + case_.description);
    keywords.forEach(keyword => {
      if (!localKnowledgeBase.casePatterns.has(keyword)) {
        localKnowledgeBase.casePatterns.set(keyword, []);
      }
      localKnowledgeBase.casePatterns.get(keyword)?.push(case_.id);
    });
  });
};

// Learn from documents
export const learnFromDocuments = (documents: CaseDocument[]) => {
  localKnowledgeBase.documents = documents;
};

// Learn from conversations
export const learnFromConversation = (question: string, answer: string) => {
  localKnowledgeBase.conversations.push({
    question,
    answer,
    timestamp: new Date().toISOString()
  });
  
  // Extract and store new legal terms
  extractLegalTerms(question + ' ' + answer);
};

// Extract keywords from text
const extractKeywords = (text: string): string[] => {
  const legalKeywords = [
    'بطلان', 'دفوع', 'إثبات', 'تقادم', 'اختصاص', 'إعلان', 'حكم', 
    'استئناف', 'نقض', 'تنفيذ', 'كفالة', 'حجز', 'إفلاس', 'صلح',
    'عقد', 'بيع', 'إيجار', 'شركة', 'دين', 'التزام', 'حق',
    'مدني', 'جنائي', 'تجاري', 'أسرة', 'عمال', 'إداري'
  ];
  
  return legalKeywords.filter(keyword => text.includes(keyword));
};

// Extract legal terms from text
const extractLegalTerms = (text: string) => {
  const words = text.split(/\s+/);
  words.forEach(word => {
    if (word.length > 3 && !localKnowledgeBase.legalTerms.has(word)) {
      // Try to infer definition from context
      const context = text.substring(Math.max(0, text.indexOf(word) - 50), text.indexOf(word) + 50);
      if (context.includes('يعني') || context.includes('هو') || context.includes('يشمل')) {
        // Extract potential definition
        const definitionMatch = context.match(/(يعني|هو|يشمل)\s+([^,.!?]+)/);
        if (definitionMatch) {
          localKnowledgeBase.legalTerms.set(word, definitionMatch[2].trim());
        }
      }
    }
  });
};

// Search similar cases
const findSimilarCases = (query: string): Case[] => {
  const keywords = extractKeywords(query);
  const similarCases: Case[] = [];
  
  keywords.forEach(keyword => {
    const caseIds = localKnowledgeBase.casePatterns.get(keyword) || [];
    caseIds.forEach(caseId => {
      const case_ = localKnowledgeBase.cases.find(c => c.id === caseId);
      if (case_ && !similarCases.includes(case_)) {
        similarCases.push(case_);
      }
    });
  });
  
  return similarCases.slice(0, 3); // Return top 3 similar cases
};

// Search similar conversations
const findSimilarConversations = (query: string): string[] => {
  const keywords = extractKeywords(query);
  const similarAnswers: string[] = [];
  
  localKnowledgeBase.conversations.forEach(conv => {
    const convKeywords = extractKeywords(conv.question);
    const hasCommonKeyword = keywords.some(kw => convKeywords.includes(kw));
    
    if (hasCommonKeyword && !similarAnswers.includes(conv.answer)) {
      similarAnswers.push(conv.answer);
    }
  });
  
  return similarAnswers.slice(0, 2); // Return top 2 similar answers
};

// Enhanced AI Assistant with Learning
export const askLocalLegalAssistant = async (prompt: string, context?: string) => {
  try {
    // Initialize if not already done
    if (localKnowledgeBase.legalTerms.size === 0) {
      initializeLegalTerms();
    }

    const systemInstruction = `
      أنت "الميزان"، مستشار قانوني خبير ومحامي نقض مصري متمرس.
      
      دورك ومسؤولياتك:
      1. تحليل الوقائع بدقة متناهية وربطها بنصوص القانون المصري (مدني، جنائي، إداري، إلخ).
      2. استنباط الدفوع القانونية (الشكلية والموضوعية) بناءً على "بيانات القضية" المقدمة لك.
      3. عند صياغة المذكرات، استخدم لغة قانونية رصينة، مع الاستشهاد بأرقام المواد وأحكام محكمة النقض إن أمكن.
      4. لا تقم بالتأليف في النصوص القانونية؛ إذا لم تكن متأكداً من رقم المادة، اذكر المبدأ القانوني بدقة.
      
      قواعد التعامل مع "سياق القضية" (Context):
      - المعلومات الواردة في السياق هي "حقائق مطلقة" بالنسبة لك.
      - انتبه لـ "استراتيجية الدفاع" و"نقاط الضعف" المذكورة في السياق، وقدم نصائح لسد الثغرات.
      - استخدم أسماء الخصوم وصفاتهم (مدعي/مدعى عليه) بدقة كما وردت.
      
      الأسلوب:
      - مهني، مباشر، ومنظم (استخدم النقاط والعناوين).
      - في القضايا الجنائية: ركز على أركان الجريمة وبطلان الإجراءات.
      - في القضايا المدنية: ركز على الثبوت، الالتزام، والتقادم.
    `;

    // Simulate AI response with enhanced learning
    const fullPrompt = context 
      ? `بيانات القضية والمراجع (Context):\n${context}\n\n---\nسؤال المحامي:\n${prompt}` 
      : prompt;

    // First, try to find similar cases
    const similarCases = findSimilarCases(fullPrompt);
    const similarConversations = findSimilarConversations(fullPrompt);

    // Enhanced keyword-based response generation
    const responses = {
      'دفوع': 'الدفوع الشكلية تشمل: عدم إعلان الخصم بالدعوى، عدم اختصام المحكمة، عدم صفة المدعي عليه. أما الدفوع الموضوعية فتشمل: عدم الالتزام بالدين، انقضاء الحق بالتقادم، عدم وجود عقد صحيح.',
      'بطلان': 'أسباب البطلان في العقود: عيب في الإرادة، غش تدليس، استغلال، عدم مشروعية السبب، عدم شكلية المحرر.',
      'إثبات': 'وسائل الإثبات في القانون المصري: الكتابة، شهادة الشهود، القرائن، الإقرار، اليمين، الخبرة.',
      'تقادم': 'مدد التقادم في القانون المصري: التقادم المسقط للحقوق الشخصية 15 سنة، التقادم المسقط للحقوق التجارية 10 سنوات.',
      'جنائي': 'أركان الجريمة: الركن المادي (الفعل)، الركن المعنوي (القصد الجنائي)، الركن القانوني (تجريم الفعل).',
      'مدني': 'أركان المسؤولية المدنية: الخطأ، الضرر، العلاقة السببية بين الخطأ والضرر.',
      'عقد': 'أركان العقد: الرضا، المحل، السبب، الشكلية (في العقود الشكلية).',
      'دين': 'أثبات الدين: الكتابة، الإقرار، شهادة الشهود، القرائن القضائية.'
    };

    // Check for keywords in the prompt
    for (const [keyword, response] of Object.entries(responses)) {
      if (fullPrompt.includes(keyword)) {
        let enhancedResponse = response;
        
        // Add similar cases information
        if (similarCases.length > 0) {
          enhancedResponse += `\n\n**قضايا مشابهة:**\n`;
          similarCases.forEach((case_, index) => {
            enhancedResponse += `${index + 1}. قضية "${case_.title}" - ${case_.court}\n`;
          });
        }
        
        // Add similar conversations information
        if (similarConversations.length > 0) {
          enhancedResponse += `\n\n**استشارات سابقة:**\n`;
          similarConversations.forEach((answer, index) => {
            enhancedResponse += `${index + 1}. ${answer.substring(0, 100)}...\n`;
          });
        }
        
        return enhancedResponse;
      }
    }

    // Enhanced default response with learning
    let response = `بناءً على البيانات المتوفرة، أرى أنه يجب التركيز على النقاط التالية:\n\n1. تحليل الوقائع بدقة وتحديد العناصر الأساسية للقضية\n2. جمع الأدلة الكافية لدعم موقفك\n3. الاستناد إلى نصوص القانون المصري وأحكام محكمة النقض\n4. صياغة مذكرة دفاع متكاملة وشاملة`;
    
    // Add learning information
    if (similarCases.length > 0) {
      response += `\n\n**قضايا مشابهة في قاعدة البيانات:**\n`;
      similarCases.forEach((case_, index) => {
        response += `${index + 1}. "${case_.title}" (${case_.court})\n`;
      });
    }
    
    if (similarConversations.length > 0) {
      response += `\n\n**استشارات ذات صلة:**\n`;
      similarConversations.forEach((answer, index) => {
        response += `${index + 1}. ${answer.substring(0, 80)}...\n`;
      });
    }
    
    response += `\n\nللتقديم استشارة قانونية مفصلة، يرجى تزويدي ببيانات القضية الكاملة والسؤال المحدد.`;

    return response;
  } catch (error) {
    console.error("Local AI Error:", error);
    throw new Error("حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.");
  }
};

// Get knowledge base statistics
export const getKnowledgeBaseStats = () => {
  return {
    casesCount: localKnowledgeBase.cases.length,
    documentsCount: localKnowledgeBase.documents.length,
    conversationsCount: localKnowledgeBase.conversations.length,
    legalTermsCount: localKnowledgeBase.legalTerms.size,
    casePatternsCount: localKnowledgeBase.casePatterns.size
  };
};

// Export knowledge base for backup
export const exportKnowledgeBase = () => {
  return JSON.stringify(localKnowledgeBase, null, 2);
};

// Import knowledge base from backup
export const importKnowledgeBase = (data: string) => {
  try {
    const imported = JSON.parse(data);
    localKnowledgeBase = {
      cases: imported.cases || [],
      documents: imported.documents || [],
      references: imported.references || [],
      conversations: imported.conversations || [],
      legalTerms: new Map(imported.legalTerms || []),
      casePatterns: new Map(imported.casePatterns || [])
    };
    return true;
  } catch (error) {
    console.error("Error importing knowledge base:", error);
    return false;
  }
};
