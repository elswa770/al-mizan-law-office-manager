@echo off
echo 🚀 إعداد المشروع للنشر على Netlify
echo.

echo � تعريف هوية Git...
git config --global user.email "elswa770@gmail.com"
git config --global user.name "elswa770"

echo �📦 تهيئة Git...
git init

echo 📝 إضافة الملفات...
git add .

echo 💾 أول commit...
git commit -m "Initial commit - Al Mizan Law Office Manager"

echo 🌿 إنشاء فرع main...
git branch -M main

echo 🔗 ربط بـ GitHub...
git remote add origin https://github.com/elswa770/al-mizan-law-office-manager.git

echo 📤 رفع إلى GitHub...
git push -u origin main

echo.
echo ✅ اكتملت جميع الخطوات!
echo 🎉 المشروع جاهز للنشر على Netlify
pause
