'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InventoryAlert } from '@/domains/inventory/types';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Clock,
  X,
  Bell,
  BellOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertNotificationProps {
  alerts: InventoryAlert[];
  onAcknowledge: (alertId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  autoHideDuration?: number;
  enableSound?: boolean;
  enableToast?: boolean;
  maxToastCount?: number;
}

interface ToastAlert {
  id: string;
  alert: InventoryAlert;
  showTime: Date;
}

const alertIcons = {
  LOW_STOCK: TrendingDown,
  EXPIRY: Clock,
  OVERSTOCK: Package,
  REORDER: AlertTriangle,
};

const alertColors = {
  INFO: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  WARNING: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  CRITICAL: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export function AlertNotification({
  alerts,
  onAcknowledge,
  position = 'top-right',
  autoHide = false,
  autoHideDuration = 5000,
  enableSound = true,
  enableToast = true,
  maxToastCount = 3,
}: AlertNotificationProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<InventoryAlert[]>([]);
  const [mutedAlerts, setMutedAlerts] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);

  // 알림 소리 재생
  const playNotificationSound = useCallback((severity: InventoryAlert['severity']) => {
    if (!soundEnabled) return;

    try {
      const audio = new Audio();
      switch (severity) {
        case 'CRITICAL':
          audio.src = '/sounds/alert-critical.wav';
          break;
        case 'WARNING':
          audio.src = '/sounds/alert-warning.wav';
          break;
        default:
          audio.src = '/sounds/alert-info.wav';
      }
      audio.volume = 0.3;
      audio.play().catch(() => {
        // 소리 재생 실패 시 무시
      });
    } catch (error) {
      // 소리 재생 실패 시 무시
    }
  }, [soundEnabled]);

  // 토스트 알림 추가
  const addToastAlert = useCallback((alert: InventoryAlert) => {
    if (!enableToast) return;

    const newToast: ToastAlert = {
      id: `toast-${alert.id}-${Date.now()}`,
      alert,
      showTime: new Date(),
    };

    setToastAlerts(prev => {
      const updated = [...prev, newToast];
      // 최대 개수 제한
      return updated.slice(-maxToastCount);
    });

    // 토스트 자동 제거
    setTimeout(() => {
      setToastAlerts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  }, [enableToast, maxToastCount]);

  useEffect(() => {
    // 새로운 알림만 표시
    const newAlerts = alerts.filter(
      alert => !mutedAlerts.has(alert.id) && !alert.acknowledgedAt
    );
    
    // 새로 추가된 알림 확인
    const previousAlertIds = new Set(visibleAlerts.map(a => a.id));
    const reallyNewAlerts = newAlerts.filter(alert => !previousAlertIds.has(alert.id));
    
    // 새 알림에 대해 소리 및 토스트 처리
    reallyNewAlerts.forEach(alert => {
      playNotificationSound(alert.severity);
      addToastAlert(alert);
    });

    setVisibleAlerts(newAlerts);

    // 자동 숨김
    if (autoHide && newAlerts.length > 0) {
      const timer = setTimeout(() => {
        setVisibleAlerts([]);
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [alerts, mutedAlerts, autoHide, autoHideDuration, visibleAlerts, playNotificationSound, addToastAlert]);

  const handleMute = (alertId: string) => {
    setMutedAlerts(prev => new Set(prev).add(alertId));
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcknowledge = (alertId: string) => {
    onAcknowledge(alertId);
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const unreadCount = visibleAlerts.length;

  return (
    <>
      {/* 최소화된 상태 */}
      <AnimatePresence>
        {isMinimized && unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={cn(
              'fixed z-50',
              positionClasses[position]
            )}
          >
            <Button
              size="icon"
              variant="destructive"
              className="relative"
              onClick={() => setIsMinimized(false)}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-xs font-bold text-red-600 flex items-center justify-center">
                {unreadCount}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 알림 목록 */}
      <AnimatePresence>
        {!isMinimized && visibleAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed z-50 max-w-md w-full space-y-2',
              positionClasses[position]
            )}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                재고 알림 ({unreadCount})
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? '소리 끄기' : '소리 켜기'}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3 w-3" />
                  ) : (
                    <VolumeX className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setIsMinimized(true)}
                  title="최소화"
                >
                  <BellOff className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 알림 아이템 */}
            {visibleAlerts.slice(0, 5).map((alert, index) => {
              const Icon = alertIcons[alert.type];
              const colorClass = alertColors[alert.severity];

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Alert className={cn('relative', colorClass)}>
                    <Icon className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{alert.type.replace('_', ' ')}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => handleMute(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </AlertTitle>
                    <AlertDescription className="pr-8">
                      {alert.message}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          확인
                        </Button>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              );
            })}

            {visibleAlerts.length > 5 && (
              <p className="text-sm text-center text-gray-500">
                +{visibleAlerts.length - 5}개의 추가 알림
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 토스트 알림 */}
      <AnimatePresence>
        {toastAlerts.map((toast) => {
          const Icon = alertIcons[toast.alert.type];
          const colorClass = alertColors[toast.alert.severity];
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.3 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={cn(
                'fixed z-[60] w-80 p-4 rounded-lg shadow-lg border backdrop-blur-sm',
                colorClass,
                position === 'top-right' && 'top-4 right-4',
                position === 'top-left' && 'top-4 left-4',
                position === 'bottom-right' && 'bottom-4 right-4',
                position === 'bottom-left' && 'bottom-4 left-4'
              )}
              style={{
                marginTop: position.includes('top') ? `${toastAlerts.indexOf(toast) * 90}px` : 'auto',
                marginBottom: position.includes('bottom') ? `${toastAlerts.indexOf(toast) * 90}px` : 'auto',
              }}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">
                    {toast.alert.type.replace('_', ' ')}
                  </h4>
                  <p className="text-sm opacity-90 mt-1 line-clamp-2">
                    {toast.alert.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">
                      {toast.showTime.toLocaleTimeString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        onAcknowledge(toast.alert.id);
                        setToastAlerts(prev => prev.filter(t => t.id !== toast.id));
                      }}
                    >
                      확인
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 opacity-70 hover:opacity-100"
                  onClick={() => setToastAlerts(prev => prev.filter(t => t.id !== toast.id))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}