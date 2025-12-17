import React, { useState, useEffect, useCallback } from 'react';
import { Anime } from '../types';
import { Play, Info, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { watchlistService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const Hero = ({ items }: { items: Anime[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    const fetchList = async () => {
        if (user) {
            const ids = await watchlistService.getWatchlistIds(user.id);
            setWatchlistIds(ids);
        }
    }
    fetchList();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, [items.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const toggleWatchlist = async (anime: Anime) => {
    if (!user) {
        showNotification('يرجى تسجيل الدخول للإضافة إلى القائمة', 'info');
        return;
    }

    const isAdded = watchlistIds.includes(anime.id);

    if (isAdded) {
        setWatchlistIds(prev => prev.filter(id => id !== anime.id));
    } else {
        setWatchlistIds(prev => [...prev, anime.id]);
    }

    try {
        if (isAdded) {
          await watchlistService.removeFromWatchlist(anime.id, user.id);
          showNotification('تم الحذف من القائمة', 'info');
        } else {
          await watchlistService.addToWatchlist(anime, user.id);
          showNotification('تمت الإضافة إلى القائمة', 'success');
        }
    } catch (e) {
        if (isAdded) setWatchlistIds(prev => [...prev, anime.id]);
        else setWatchlistIds(prev => prev.filter(id => id !== anime.id));
        showNotification('فشل تحديث القائمة', 'error');
    }
  };

  if (!items || items.length === 0) return <div className="h-[70vh] md:h-[85vh] bg-surface animate-pulse"></div>;

  const currentAnime = items[currentIndex];

  return (
    <div className="relative w-full h-[85vh] md:h-[95vh] group/hero overflow-hidden bg-black" dir="rtl">
      
      {items.map((anime, index) => (
          <div 
            key={anime.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div className="absolute inset-0 bg-black/20 z-10"></div>
            <img
                src={anime.cover || anime.image}
                alt={anime.title}
                className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-20" />
            <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-20" />
          </div>
      ))}

      <div className="absolute inset-0 z-30 flex items-end pb-20 md:pb-32 px-4 md:px-12 pointer-events-none">
          <div className="w-full max-w-4xl pointer-events-auto">
             <div key={currentAnime.id} className="animate-slide-up space-y-4 md:space-y-6">
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 bg-primary text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-lg shadow-primary/40">
                        الأفضل
                    </div>
                    {currentAnime.releaseDate && <span className="text-gray-300 font-medium text-xs md:text-sm">{currentAnime.releaseDate.split('-')[0]}</span>}
                    {currentAnime.rating && <span className="text-green-400 font-bold border border-green-400/30 bg-green-900/10 px-2 py-0.5 rounded text-[10px] md:text-xs">تقييم {currentAnime.rating}</span>}
                    <span className="border border-white/30 px-1.5 py-0.5 text-[10px] text-gray-300 rounded font-medium">HD</span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] drop-shadow-2xl tracking-tighter line-clamp-2 md:line-clamp-none">
                    {currentAnime.title}
                </h1>

                <p className="text-sm md:text-lg text-gray-300 line-clamp-3 md:line-clamp-3 max-w-2xl drop-shadow-md font-light leading-relaxed">
                    {currentAnime.description?.replace(/<[^>]*>/g, '')}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link 
                        to={`/watch/${currentAnime.id}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-lg font-bold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 text-base md:text-lg shadow-lg"
                    >
                        <Play fill="black" size={24} className="ml-1"/> 
                        شاهد الآن
                    </Link>
                    <Link 
                        to={`/anime/${currentAnime.id}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-white/30 transition-all text-base md:text-lg"
                    >
                        <Info size={24} /> 
                        تفاصيل
                    </Link>
                    <button 
                        onClick={() => toggleWatchlist(currentAnime)}
                        className="p-3.5 rounded-full border-2 border-white/20 bg-black/40 hover:bg-white/20 hover:border-white text-white transition backdrop-blur-sm group hidden md:flex items-center justify-center"
                        title={watchlistIds.includes(currentAnime.id) ? "إزالة من القائمة" : "إضافة للقائمة"}
                    >
                        {watchlistIds.includes(currentAnime.id) ? <Check size={24} className="text-green-400" /> : <Plus size={24} />}
                    </button>
                </div>
             </div>
          </div>
      </div>

      <div className="absolute inset-y-0 right-0 z-40 hidden md:flex items-center pr-4 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
          <button onClick={handleNext} className="bg-black/30 hover:bg-black/60 p-3 rounded-full backdrop-blur-md text-white border border-white/10 transition transform hover:scale-110">
              <ChevronRight size={32} />
          </button>
      </div>
       <div className="absolute inset-y-0 left-0 z-40 hidden md:flex items-center pl-4 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
          <button onClick={handlePrev} className="bg-black/30 hover:bg-black/60 p-3 rounded-full backdrop-blur-md text-white border border-white/10 transition transform hover:scale-110">
              <ChevronLeft size={32} />
          </button>
      </div>

      <div className="absolute bottom-6 right-0 left-0 z-40 flex justify-center md:justify-end md:left-12 gap-2 px-4">
          {items.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? 'w-8 bg-primary shadow-primary/50' : 'w-4 bg-white/30 hover:bg-white/60'}`}
              />
          ))}
      </div>
    </div>
  );
};