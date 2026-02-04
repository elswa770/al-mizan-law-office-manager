import React, { useState, useEffect } from 'react';
import { HybridDataService } from '../services/hybridService';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

interface SyncStatus {
  lastSync: Date | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export const SyncStatusIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    pendingChanges: 0,
    isOnline: false,
    isSyncing: false
  });

  useEffect(() => {
    const updateStatus = () => {
      const status = HybridDataService.getSyncStatus();
      setSyncStatus({
        ...status,
        lastSync: status.lastSync ? new Date(status.lastSync) : null,
        isOnline: HybridDataService.isOnline(),
        isSyncing: false
      });
    };

    // تحديث الحالة فوراً
    updateStatus();

    // تحديث كل ثانية
    const interval = setInterval(updateStatus, 1000);

    // مستمع حالة الاتصال
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true, isSyncing: true }));
      setTimeout(() => {
        updateStatus();
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      }, 2000); // المزامنة تستغرق 2 ثانية تقريباً
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'لم تتم مزامنة بعد';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  const getStatusColor = () => {
    if (syncStatus.isSyncing) return 'text-blue-600';
    if (!syncStatus.isOnline) return 'text-red-600';
    if (syncStatus.pendingChanges > 0) return 'text-amber-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (!syncStatus.isOnline) return <WifiOff className="w-4 h-4" />;
    if (syncStatus.pendingChanges > 0) return <RefreshCw className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) return 'جاري المزامنة...';
    if (!syncStatus.isOnline) return 'غير متصل';
    if (syncStatus.pendingChanges > 0) return `بانتظار المزامنة (${syncStatus.pendingChanges})`;
    return 'متصل ومزامن';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
      {syncStatus.lastSync && (
        <span className="text-xs opacity-75">
          آخر مزامنة: {formatLastSync(syncStatus.lastSync)}
        </span>
      )}
    </div>
  );
};
