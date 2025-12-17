import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User as UserIcon, LogOut, Menu, X, Clock, Heart, PlayCircle, Info, CheckCircle, AlertCircle, Newspaper, Star, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchAnime } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Anime } from '../types';

export const Layout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { allNotifications, clearNotifications, unreadCount, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const results = await searchAnime(searchQuery);
          setSuggestions(results.slice(0, 5));
          setShowSuggestions(true);
        } catch (error) {
          console.error("Auto-suggest failed", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if(searchQuery.trim()) {
        setShowSuggestions(false);
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        setMobileMenuOpen(false);
    }
  }

  const handleSuggestionClick = (animeId: string) => {
      setSearchQuery('');
      setShowSuggestions(false);
      setMobileMenuOpen(false);
  };

  const handleNotificationClick = () => {
      setShowNotifications(!showNotifications);
      if (!showNotifications && unreadCount > 0) {
          markAllAsRead();
      }
  };

  const navLinks = [
      { name: 'الرئيسية', path: '/' },
      { name: 'الترتيب العربي', path: '/arab-ranking' },
      { name: 'الأعلى تقييماً', path: '/top-rated' },
      { name: 'الأخبار', path: '/news' },
      { name: 'أحدث الحلقات', path: '/recent' },
      { name: 'قائمتي', path: '/my-list' },
  ];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans overflow-x-hidden" dir="rtl">
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled ? 'bg-black/95 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-gradient-to-b from-black/90 to-transparent'
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-10">
            <button className="lg:hidden text-white focus:outline-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu size={26} />
            </button>

            <Link to="/" className="text-primary text-2xl md:text-3xl font-black tracking-tighter hover:scale-105 transition-transform truncate">
                ANIME<span className="text-white">WATCHER</span>
            </Link>
            <nav className="hidden lg:flex gap-6 text-sm font-medium text-gray-400">
              {navLinks.map(link => (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    className={`hover:text-white transition hover:scale-105 ${location.pathname === link.path ? 'text-white font-bold border-b-2 border-primary' : ''} py-1`}
                  >
                      {link.name}
                  </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Desktop Search */}
            <div className="hidden md:block relative" ref={searchContainerRef}>
                <form onSubmit={handleSearch} className="flex items-center bg-black/40 border border-white/10 px-3 py-2 rounded-full focus-within:border-primary/50 focus-within:bg-black/60 transition-all duration-300 w-48 lg:w-64 hover:border-white/20">
                    <button type="submit" className="text-gray-400 hover:text-white transition">
                       <Search size={18} />
                    </button>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                        placeholder="بحث..." 
                        className="bg-transparent border-none outline-none text-sm mr-2 w-full text-white placeholder-gray-500"
                    />
                    {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </form>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-72 bg-[#18181b] border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl z-50 animate-fade-in text-right">
                        {suggestions.map((anime) => (
                            <Link 
                                key={anime.id} 
                                to={`/watch/${anime.id}`} 
                                onClick={() => handleSuggestionClick(anime.id)}
                                className="flex items-center gap-3 p-3 hover:bg-white/10 transition border-b border-white/5 last:border-0"
                            >
                                <img src={anime.image} alt={anime.title} className="w-10 h-14 object-cover rounded bg-gray-800" />
                                <div className="overflow-hidden">
                                    <h4 className="text-sm font-bold text-gray-200 truncate">{anime.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{anime.releaseDate?.split(' ')[0] || 'N/A'}</span>
                                        {anime.rating && (
                                            <span className="text-green-400">{anime.rating}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            
            <button className="md:hidden text-gray-300" onClick={() => setMobileMenuOpen(true)}>
                <Search size={22} />
            </button>

            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={handleNotificationClick}
                    className="text-gray-300 hover:text-white relative transition hover:scale-110 pt-1"
                >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-black animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute left-[-60px] md:left-0 top-full mt-4 w-72 md:w-80 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in origin-top-left text-right">
                        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40">
                            <h3 className="text-sm font-bold text-white">الإشعارات</h3>
                            {allNotifications.length > 0 && (
                                <button onClick={clearNotifications} className="text-xs text-gray-400 hover:text-white">مسح الكل</button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scroll">
                            {allNotifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    <Bell size={24} className="mx-auto mb-2 opacity-50"/>
                                    لا توجد إشعارات جديدة
                                </div>
                            ) : (
                                allNotifications.map((n, i) => (
                                    <Link 
                                        to={n.link || '#'} 
                                        key={`${n.id}-${i}`} 
                                        onClick={() => setShowNotifications(false)}
                                        className={`block p-3 border-b border-white/5 hover:bg-white/5 transition flex gap-3 ${!n.read ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {n.type === 'success' && <CheckCircle size={16} className="text-green-400" />}
                                            {n.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
                                            {n.type === 'info' || n.type === 'update' && <Bell size={16} className="text-primary" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm break-words ${!n.read ? 'text-white font-semibold' : 'text-gray-400'}`}>{n.message}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">{n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {user && (
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-transparent group-hover:ring-white/20 transition-all">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute left-0 top-full mt-4 w-56 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible transform origin-top-left z-50 text-right">
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                        <p className="text-sm font-bold text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-3">
                        <UserIcon size={16}/> الملف الشخصي
                    </Link>
                     <Link to="/my-list" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-3">
                        <Heart size={16}/> قائمتي
                    </Link>
                    <Link to="/history" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-3">
                        <Clock size={16}/> السجل
                    </Link>
                    <button onClick={logout} className="w-full text-right px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition flex items-center gap-3">
                        <LogOut size={16}/> تسجيل خروج
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {mobileMenuOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-fade-in flex flex-col h-screen overflow-y-auto text-right">
                <div className="p-4 flex justify-between items-center border-b border-white/10">
                    <span className="text-primary font-black text-xl">القائمة</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2 bg-white/10 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 px-6 pb-8 pt-6">
                     <form onSubmit={handleSearch} className="flex items-center bg-white/5 px-4 py-3 rounded-xl border border-white/10 mb-8 focus-within:border-primary transition">
                        <Search size={20} className="text-gray-400"/>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن انمي..." 
                            className="bg-transparent border-none outline-none text-white mr-3 flex-1 text-base"
                        />
                    </form>

                    <div className="space-y-4">
                        {navLinks.map(link => (
                            <Link 
                                key={link.path}
                                to={link.path} 
                                className={`block text-xl font-bold py-3 border-b border-white/5 ${location.pathname === link.path ? 'text-primary' : 'text-gray-300'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    
                    <div className="my-8"></div>

                    {user && (
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg font-bold truncate text-white">{user.username}</div>
                                    <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3 mb-4">
                                <Link to="/profile" className="flex flex-col items-center justify-center gap-2 bg-black/40 p-3 rounded-xl text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                                    <UserIcon size={20} /> <span className="text-xs">الملف</span>
                                </Link>
                                <Link to="/my-list" className="flex flex-col items-center justify-center gap-2 bg-black/40 p-3 rounded-xl text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                                    <Heart size={20} /> <span className="text-xs">قائمتي</span>
                                </Link>
                             </div>
                             <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 bg-red-900/20 text-red-500 py-3 rounded-xl font-bold hover:bg-red-900/30">
                                <LogOut size={18} /> خروج
                             </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </header>

      <main className="flex-grow w-full overflow-hidden">
        <Outlet />
      </main>

      <footer className="bg-black text-gray-500 py-12 px-6 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
           <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <Link to="/" className="text-2xl font-black text-gray-700 hover:text-primary transition">ANIMEWATCHER</Link>
                <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
                    <a href="#" className="hover:text-white transition">شروط الخدمة</a>
                    <a href="#" className="hover:text-white transition">سياسة الخصوصية</a>
                    <a href="#" className="hover:text-white transition">حقوق النشر</a>
                    <Link to="/news" className="hover:text-white transition">الأخبار</Link>
                </div>
           </div>
           <div className="text-center md:text-right text-xs text-gray-700 leading-relaxed">
               © {new Date().getFullYear()} AnimeWatcher. جميع الحقوق محفوظة. <br className="md:hidden"/>
               هذا الموقع لا يخزن أي ملفات على خوادمه. المحتوى مقدم من أطراف ثالثة غير تابعة لنا.
           </div>
        </div>
      </footer>
    </div>
  );
};