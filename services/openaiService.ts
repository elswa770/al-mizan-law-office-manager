import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

// Only initialize if API key is available
let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

export const askLegalAssistantOpenAI = async (prompt: string, context?: string) => {
  try {
    if (!openai || !apiKey) {
      throw new Error("المساعد الذكي غير متوفر حالياً. يرجى تفعيل OpenAI API Key.");
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

    const messages = [
      {
        role: "system",
        content: systemInstruction
      },
      {
        role: "user",
        content: context 
          ? `بيانات القضية والمراجع (Context):\n${context}\n\n---\nسؤال المحامي:\n${prompt}` 
          : prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.1,
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content || "عذراً، لم أتمكن من تقديم إجابة في الوقت الحالي.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.");
  }
};
