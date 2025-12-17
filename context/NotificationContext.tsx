import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '../types';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  addSystemNotification: (notification: Notification) => void;
  allNotifications: Notification[];
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children?: ReactNode }) => {
  const [toasts, setToasts] = useState<Notification[]>([]); // For transient popups
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]); // For history panel

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    const notification: Notification = { id, message, type };
    
    setToasts(prev => [...prev, notification]);

    // Only add simple toasts to history if they aren't duplicates within 5 seconds
    // Simplified logic: Just add to history if not generic
    if (type !== 'info') {
        setAllNotifications(prev => [notification, ...prev]);
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const addSystemNotification = useCallback((notification: Notification) => {
      setAllNotifications(prev => [notification, ...prev]);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setAllNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, addSystemNotification, allNotifications, clearNotifications }}>
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
                {n.type === 'info' && <Info size={20} className="text-blue-400" />}
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