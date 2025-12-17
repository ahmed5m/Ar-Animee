import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Notification } from '../types';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/api';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  addSystemNotification: (notification: Notification) => void;
  allNotifications: Notification[];
  clearNotifications: () => void;
  unreadCount: number;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children?: ReactNode }) => {
  const [toasts, setToasts] = useState<Notification[]>([]); 
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]); 
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    // Simple beep sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Load stored notifications
  useEffect(() => {
    const stored = notificationService.getStoredNotifications();
    setAllNotifications(stored);
  }, []);

  const playSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play failed interaction required"));
    }
  };

  // === REAL TIME SIMULATION ===
  useEffect(() => {
      // Simulate an incoming notification every 45-90 seconds to make the app feel "Alive"
      const interval = setInterval(async () => {
          const notification = await notificationService.getSimulatedUpdate();
          if (notification) {
              addSystemNotification(notification);
              showNotification(notification.message, 'info');
          }
      }, 45000 + Math.random() * 45000); 

      return () => clearInterval(interval);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    const notification: Notification = { id, message, type, timestamp: Date.now() };
    
    setToasts(prev => [...prev, notification]);

    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const addSystemNotification = useCallback((notification: Notification) => {
      // Add to state
      setAllNotifications(prev => {
          const updated = [notification, ...prev];
          return updated.slice(0, 50);
      });
      // Save to storage
      notificationService.saveNotification(notification);
      // Play Sound
      playSound();
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setAllNotifications([]);
    localStorage.removeItem('animewatcher_notifications');
  };

  const markAllAsRead = () => {
      const updated = allNotifications.map(n => ({ ...n, read: true }));
      setAllNotifications(updated);
      notificationService.markAsRead();
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ showNotification, addSystemNotification, allNotifications, clearNotifications, unreadCount, markAllAsRead }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(n => (
          <div
            key={n.id}
            className={`
              pointer-events-auto min-w-[320px] p-4 rounded-lg shadow-2xl flex items-center text-white animate-slide-up border border-white/10 backdrop-blur-md
              ${n.type === 'success' ? 'bg-green-900/90' : n.type === 'error' ? 'bg-red-900/90' : 'bg-[#222]/90'}
            `}
          >
            <div className="mr-3">
                {n.type === 'success' && <CheckCircle size={20} className="text-green-400" />}
                {n.type === 'error' && <AlertCircle size={20} className="text-red-400" />}
                {n.type === 'info' && <Bell size={20} className="text-primary" />}
            </div>
            <span className="flex-1 text-sm font-medium">{n.message}</span>
            <button onClick={() => removeToast(n.id)} className="ml-4 text-gray-400 hover:text-white transition">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};