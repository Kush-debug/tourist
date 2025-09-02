import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported]);

  const sendNotification = useCallback(async (config: NotificationConfig) => {
    // Always show toast notification
    toast(config.title, {
      description: config.body,
      duration: 5000,
    });

    // Send browser notification if permission granted
    if (permission === 'granted' && isSupported) {
      try {
        const notification = new Notification(config.title, {
          body: config.body,
          icon: config.icon || '/favicon.ico',
          tag: config.tag,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }, [permission, isSupported]);

  const sendEmergencyAlert = useCallback((touristName: string, location: string) => {
    sendNotification({
      title: '🚨 Emergency Alert',
      body: `${touristName} has triggered an emergency alert in ${location}`,
      tag: 'emergency',
    });
  }, [sendNotification]);

  const sendAnomalyAlert = useCallback((message: string) => {
    sendNotification({
      title: '⚠️ Safety Alert',
      body: message,
      tag: 'anomaly',
    });
  }, [sendNotification]);

  const sendSafetyScoreUpdate = useCallback((touristName: string, score: number, status: string) => {
    const emoji = status === 'safe' ? '✅' : status === 'caution' ? '⚠️' : '🚨';
    sendNotification({
      title: `${emoji} Safety Score Update`,
      body: `${touristName}'s safety score is now ${score}/100 (${status})`,
      tag: 'safety-score',
    });
  }, [sendNotification]);

  // Auto-request permission on first use
  useEffect(() => {
    if (isSupported && permission === 'default') {
      // Don't auto-request, let user trigger it
    }
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendEmergencyAlert,
    sendAnomalyAlert,
    sendSafetyScoreUpdate
  };
};