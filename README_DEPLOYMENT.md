# 🚀 دليل نشر التطبيق على Netlify

## 📋 المتطلبات
- حساب Netlify مجاني
- حساب GitHub
- مشروع Supabase جاهز

## 🛠️ الخطوات

### 1. إعداد المتغيرات البيئية
```bash
# إنشاء ملف .env
cp .env.example .env

# تعديل القيم
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. ربط المشروع بـ GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/al-mizan-law-office-manager.git
git push -u origin main
```

### 3. نشر على Netlify
1. تسجيل الدخول إلى [netlify.com](https://netlify.com)
2. النقر على "New site from Git"
3. اختيار GitHub
4. اختيار المستودع (repository)
5. إعدادات البناء:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. إضافة المتغيرات البيئية في Environment Variables
7. النقر على "Deploy site"

### 4. إعدادات Supabase
تأكد من أن:
- RLS معطل للاختبار
- CORS مُعد للسماح بنطاق Netlify
- الصلاحيات صحيحة

## 🔗 بعد النشر
- ستحصل على رابط مثل: `https://amazing-tesla-123456.netlify.app`
- يمكنك إضافة نطاق مخصص
- يمكن إضافة SSL مجاني

## 📱 مشاركة الرابط
1. انسخ الرابط من لوحة تحكم Netlify
2. شاركه مع الفريق
3. يمكن للفريق تسجيل الدخول واستخدام التطبيق

## 🔄 التحديثات
- كل دفعة إلى GitHub = تحديث تلقائي
- يمكن إعادة النشر يدوياً
- سجل التغييرات متاح
