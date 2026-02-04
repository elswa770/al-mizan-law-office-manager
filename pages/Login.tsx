
import React, { useState } from 'react';
import { Gavel, Lock, User, ArrowRight, Crown, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, pass: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 600));

    const success = onLogin(username, password);
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      setIsLoading(false);
    }
    // If success, App.tsx handles the redirect/state change
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 relative">
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
           <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
              <Gavel className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900">الميزان</h1>
           <p className="text-sm text-slate-500 mt-1">نظام إدارة مكاتب المحاماة</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           {/* Admin Account Info */}
           <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                 <Crown className="w-5 h-5 text-indigo-600" />
                 <h4 className="font-bold text-indigo-900">حساب مدير النظام</h4>
              </div>
              <div className="text-sm text-indigo-700 space-y-1">
                 <p>• اسم المستخدم: <span className="font-mono bg-indigo-100 px-2 py-1 rounded">admin</span></p>
                 <p>• كلمة المرور: <span className="font-mono bg-indigo-100 px-2 py-1 rounded">admin123</span></p>
                 <p>• صلاحيات كاملة على جميع أجزاء النظام</p>
              </div>
           </div>

           {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                 {error}
              </div>
           )}

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم</label>
              <div className="relative">
                 <User className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                 <input 
                   type="text" 
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                   placeholder="اسم المستخدم (admin)"
                   required
                 />
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
              <div className="relative">
                 <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                   placeholder="••••••••"
                   required
                 />
              </div>
           </div>

           <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
                 <span className="text-slate-600">تذكرني</span>
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-bold hover:underline">نسيت كلمة المرور؟</a>
           </div>

           <button 
             type="submit" 
             disabled={isLoading}
             className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg"
           >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <>
                    تسجيل الدخول <ArrowRight className="w-4 h-4" />
                 </>
              )}
           </button>
        </form>
        
        <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
           <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-3 h-3" />
              <span>نظام آمن ومشفر</span>
           </div>
           جميع الحقوق محفوظة © {new Date().getFullYear()} الميزان
        </div>
      </div>
    </div>
  );
};

export default Login;
