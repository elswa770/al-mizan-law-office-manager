# 🖼️ دليل مصور لربط المستودع على Netlify

## الخطوة 1: لوحة تحكم Netlify
```
[Dashboard] → [Sites] → [Add new site] → [Import an existing project]
```

## الخطوة 2: اختيار Git Provider
```
[GitHub] → [Connect to GitHub] → [Authorize Netlify]
```

## الخطوة 3: اختيار المستودع
```
Search: "al-mizan-law-office-manager"
→ [Connect]
```

## الخطوة 4: إعدادات البناء
```
Build command: npm run build
Publish directory: dist
```

## الخطوة 5: المتغيرات البيئية
```
Environment variables → [Edit variables]
→ Add VITE_SUPABASE_URL
→ Add VITE_SUPABASE_ANON_KEY
```

## الخطوة 6: النشر
```
[Deploy site] → انتظر 2-3 دقائق → احصل على الرابط
```

## 🎉 النتيجة
- رابط مباشر للتطبيق
- تحديث تلقائي مع كل push
- SSL مجاني
- نطاق مخصص ممكن
