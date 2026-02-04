# 🚀 خطوات النشر على Netlify

## الخطوة 2: ربط المشروع بـ GitHub

### إذا لم يكن المشروع على GitHub:

1. **فتح Git Bash في مجلد المشروع**
2. **تنفيذ الأوامر التالية:**

```bash
# تهيئة Git
git init

# إضافة جميع الملفات
git add .

# أول commit
git commit -m "Initial commit - Al Mizan Law Office Manager"

# إنشاء فرع main
git branch -M main

# ربط بـ GitHub (استبدل username)
git remote add origin https://github.com/username/al-mizan-law-office-manager.git

# رفع إلى GitHub
git push -u origin main
```

### إذا كان المشروع بالفعل على GitHub:
تأكد من أن آخر التغييرات مرفوعة:
```bash
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

## الخطوة 3: النشر على Netlify

### 1. تسجيل الدخول لـ Netlify
- اذهب إلى [netlify.com](https://netlify.com)
- سجل الدخول بحساب GitHub

### 2. إنشاء موقع جديد
- انقر على **"New site from Git"**
- اختر **GitHub**
- ابحث عن مستودع `al-mizan-law-office-manager`
- انقر **"Connect"**

### 3. إعدادات البناء
```
Build command: npm run build
Publish directory: dist
```

### 4. المتغيرات البيئية
في قسم **"Environment variables"** أضف:
```
VITE_SUPABASE_URL = https://mlbwhlocvbdjfwjnwscs.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYndobG9jdmJkamZ3am53c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzAzMTQsImV4cCI6MjA4NTgwNjMxNH0.QH9G22byPWvtPWa_WxmxHQPWDHmgDRiGnnrOJLlTOnU
```

### 5. النشر
- انقر **"Deploy site"**
- انتظر حتى انتهاء البناء (2-3 دقائق)

## الخطوة 4: الحصول على الرابط

### بعد النشر الناجح:
1. **نسخ الرابط:** سيكون مثل `https://amazing-tesla-123456.netlify.app`
2. **اختبار الرابط:** افتحه في المتصفح
3. **تسجيل الدخول:** باسم مستخدم وكلمة مرور

## الخطوة 5: مشاركة الرابط مع الفريق

### طرق المشاركة:
1. **مباشر:** إرسال الرابط عبر WhatsApp/Email
2. **مختصر:** استخدام bit.ly لتقصير الرابط
3. **نطاق مخصص:** لاحقاً يمكن إضافة نطاق خاص

### بيانات دخول الفريق:
- **المدير:** admin / admin123
- **موظف:** employee / employee123
- **مشاهد:** viewer / viewer123

## الخطوة 6: إعدادات Supabase الإضافية

### إضافة CORS للسماح بالنطاق الجديد:
1. اذهب إلى لوحة تحكم Supabase
2. Settings → API → CORS
3. أضف رابط Netlify:
   ```
   https://your-site-name.netlify.app
   ```

## الخطوة 7: التحديثات المستقبلية

### تحديث التطبيق:
1. **تعديل الكود**
2. **رفع إلى GitHub:**
   ```bash
   git add .
   git commit -m "Update description"
   git push origin main
   ```
3. **التحديث التلقائي:** Netlify سينشر التغييرات تلقائياً

## 🎉 النتيجة النهائية

- **رابط مباشر** للتطبيق
- **مزامنة تلقائية** للبيانات
- **وصول من أي جهاز**
- **عمل بدون إنترنت**
- **نسخ احتياطي تلقائي**
