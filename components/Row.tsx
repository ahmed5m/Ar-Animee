import React, { useRef, useState, useEffect } from 'react';
import { Anime, HistoryItem } from '../types';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { watchlistService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

interface RowProps {
  title: string;
  items: Anime[] | HistoryItem[];
  isHistory?: boolean;
}

export const Row = ({ title, items, isHistory = false }: RowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    const fetchList = async () => {
        if (user) {
            const ids = await watchlistService.getWatchlistIds(user.id);
            setWatchlistIds(ids);
        } else {
            setWatchlistIds([]);
        }
    }
    fetchList();
  }, [user]);

  const slide = (offset: number) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const toggleWatchlist = async (e: React.MouseEvent, anime: Anime) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        showNotification('Please sign in to add to watchlist', 'info');
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
            showNotification('Removed from My List', 'info');
        } else {
            await watchlistService.addToWatchlist(anime, user.id);
            showNotification('Added to My List', 'success');
        }
    } catch (error) {
        if (isAdded) setWatchlistIds(prev => [...prev, anime.id]);
        else setWatchlistIds(prev => prev.filter(id => id !== anime.id));
        showNotification('Failed to update list', 'error');
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="py-6 px-4 md:px-12 relative group/row z-10">
      
      {/* Modern Title Design */}
      <div className="flex items-end justify-between mb-4 group/title cursor-pointer w-fit">
        <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(229,9,20,0.6)] group-hover/title:h-8 transition-all duration-300"></div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide group-hover/title:text-primary transition-colors">
                    {title}
                </h2>
            </div>
            <div className="opacity-0 -translate-x-4 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-500 flex items-center gap-1 text-xs font-semibold text-primary uppercase tracking-widest mt-1">
                Explore All <ArrowRight size={14} />
            </div>
        </div>
        
        {/* Desktop Controls (Absolute positioned to row right) */}
        <div className="absolute right-12 top-6 hidden md:flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
            <button onClick={() => slide(-800)} className="bg-black/50 hover:bg-primary/80 text-white p-2 rounded-full border border-white/10 backdrop-blur-md transition transform active:scale-95"><ChevronLeft size={20}/></button>
            <button onClick={() => slide(800)} className="bg-black/50 hover:bg-primary/80 text-white p-2 rounded-full border border-white/10 backdrop-blur-md transition transform active:scale-95"><ChevronRight size={20}/></button>
        </div>
      </div>
      
      {/* Scrollable Container with Snapping and Padding to prevent clip */}
      <div 
        ref={rowRef}
        className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-4 pl-1 snap-x snap-mandatory"
      >
        {items.map((item, index) => {
          const anime = isHistory ? (item as HistoryItem).anime : (item as Anime);
          const progress = isHistory ? (item as HistoryItem).progress : 0;
          const isInList = watchlistIds.includes(anime.id);

          return (
            <Link 
                key={`${anime.id}-${index}`} 
                to={isHistory ? `/watch/${anime.id}` : `/anime/${anime.id}`}
                className={`
                    relative group/card transition-all duration-300 ease-in-out cursor-pointer snap-start
                    ${isHistory ? 'min-w-[200px] md:min-w-[280px]' : 'min-w-[140px] md:min-w-[220px] md:hover:scale-105 md:hover:z-20'}
                `}
            >
                {/* Card Image */}
                <div className={`
                    w-full bg-surface rounded-lg overflow-hidden shadow-lg relative border border-white/5
                    ${isHistory ? 'aspect-video' : 'aspect-[2/3]'}
                `}>
                    <img 
                        src={isHistory && anime.cover ? anime.cover : anime.image} 
                        alt={anime.title} 
                        className={`
                            w-full h-full object-cover transition-transform duration-700 
                            ${isHistory ? 'opacity-90 md:group-hover/card:opacity-100' : 'md:group-hover/card:brightness-50 md:group-hover/card:scale-110'}
                        `}
                        loading="lazy"
                    />
                    
                    {/* Hover Overlay - Desktop Only */}
                    {isHistory ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 rounded-full p-2 md:p-3 border border-white/20 md:group-hover/card:scale-110 transition-transform md:group-hover/card:bg-primary/90 md:group-hover/card:border-transparent">
                                <Play fill="white" size={20} className="ml-1 text-white"/>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col absolute inset-0 items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 gap-4 p-4 text-center">
                             <h4 className="text-white font-bold text-sm line-clamp-2 translate-y-4 group-hover/card:translate-y-0 transition duration-300">{anime.title}</h4>
                             
                             <div className="flex items-center gap-3">
                                <div className="bg-white text-black rounded-full p-3 shadow-xl transform scale-50 group-hover/card:scale-100 transition-transform hover:bg-gray-200">
                                    <Play fill="black" size={20} className="ml-1" />
                                </div>
                                <button 
                                    onClick={(e) => toggleWatchlist(e, anime)}
                                    className={`
                                        rounded-full p-3 shadow-xl transform scale-50 group-hover/card:scale-100 transition-transform border-2
                                        ${isInList ? 'bg-black/60 border-green-500 text-green-500' : 'bg-black/60 border-white/50 text-white hover:border-white hover:bg-black/80'}
                                    `}
                                    title={isInList ? "Remove from List" : "Add to List"}
                                >
                                    {isInList ? <Check size={20} /> : <Plus size={20} />}
                                </button>
                             </div>
                             
                             <div className="flex gap-2 text-[10px] text-gray-300 font-medium translate-y-4 group-hover/card:translate-y-0 transition duration-500 delay-75">
                                 {anime.genres?.slice(0,2).map(g => <span key={g} className="bg-white/10 px-1.5 py-0.5 rounded">{g}</span>)}
                             </div>
                        </div>
                    )}

                    {/* Progress Bar (History Only) */}
                    {isHistory && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50 backdrop-blur">
                            <div className="h-full bg-primary shadow-[0_0_10px_rgba(229,9,20,0.7)]" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>

                {/* Info Section - Mobile Only or Non-Hover State */}
                <div className={`mt-3 px-1 transition-opacity duration-300 ${isHistory ? '' : 'md:group-hover/card:opacity-0'}`}>
                    <h3 className="text-xs md:text-sm font-semibold text-white truncate group-hover/card:text-primary transition-colors">{anime.title}</h3>
                    
                    {isHistory ? (
                         <div className="flex items-center justify-between mt-1 text-[10px] md:text-xs text-gray-400">
                             <span className="flex items-center gap-1 text-primary"><Info size={10}/> Ep {Math.ceil((anime.totalEpisodes || 12) * (progress/100)) || 1}</span>
                             <span>{100 - progress}% left</span>
                         </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 mt-1 opacity-70">
                            <span className="text-green-400 font-bold">{anime.rating || 'N/A'}</span>
                            <span>•</span>
                            <span>{anime.type || 'TV'}</span>
                        </div>
                    )}
                </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};