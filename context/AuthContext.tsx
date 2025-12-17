import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService, notificationService } from '../services/api';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, username: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'animewatcher_session';

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification, addSystemNotification } = useNotification();

  useEffect(() => {
    // Check local storage for session
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
        try {
            setUser(JSON.parse(stored));
        } catch (e) {
            localStorage.removeItem(SESSION_KEY);
        }
    }
    setLoading(false);
  }, []);

  // Check for updates periodically if logged in (Polling)
  useEffect(() => {
      // Use any to avoid NodeJS namespace issues in browser environment
      let intervalId: any;

      if (user) {
          const check = async () => {
              try {
                const updates = await notificationService.checkForUpdates(user.id);
                updates.forEach(n => {
                    addSystemNotification(n);
                    showNotification(n.message, 'success'); // Pop toast too
                });
              } catch (e) {
                  console.error("Notification check failed", e);
              }
          };
          
          // Check immediately on mount (delayed slightly)
          setTimeout(check, 3000);

          // Poll every 60 seconds
          intervalId = setInterval(check, 60000); 
      }

      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, [user]);

  const login = async (email: string, pass: string) => {
    try {
      const loggedUser = await authService.login(email, pass);
      setUser(loggedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser));
      showNotification('Signed in successfully', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const signup = async (email: string, username: string, pass: string) => {
      try {
          const newUser = await authService.signup(email, username, pass);
          setUser(newUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
          showNotification('Account created successfully!', 'success');
      } catch (err: any) {
          showNotification(err.message || 'Signup failed', 'error');
          throw err;
      }
  }

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    showNotification('Logged out successfully', 'info');
  };

  const updateUser = async (updatedUser: User) => {
      await authService.updateProfile(updatedUser);
      setUser(updatedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      showNotification('Profile updated', 'success');
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};