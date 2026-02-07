// Knowledge Base Statistics Component
import React from 'react';
import { getKnowledgeBaseStats } from '../services/localAIService';
import { BookOpen, FileText, MessageSquare, Scale, Brain } from 'lucide-react';

const KnowledgeBaseStats: React.FC = () => {
  const stats = getKnowledgeBaseStats();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
      <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5" />
        إحصائيات قاعدة المعرفة
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-3 text-center">
          <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-900">{stats.casesCount}</div>
          <div className="text-xs text-gray-600">قضية</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-900">{stats.documentsCount}</div>
          <div className="text-xs text-gray-600">مستند</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-purple-900">{stats.conversationsCount}</div>
          <div className="text-xs text-gray-600">محادثة</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <Scale className="w-6 h-6 text-orange-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-orange-900">{stats.legalTermsCount}</div>
          <div className="text-xs text-gray-600">مصطلح قانوني</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <Brain className="w-6 h-6 text-pink-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-pink-900">{stats.casePatternsCount}</div>
          <div className="text-xs text-gray-600">نمط قضية</div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>🤖 المساعد الذكي يتعلم من كل محادثة وقضية جديدة!</p>
        <p>📚 قاعدة المعرفة تتوسع مع كل استخدام.</p>
      </div>
    </div>
  );
};

export default KnowledgeBaseStats;
