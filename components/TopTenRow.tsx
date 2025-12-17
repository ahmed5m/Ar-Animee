import React, { useState, useEffect } from 'react';
import { Anime } from '../types';
import { Link } from 'react-router-dom';
import { watchlistService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
    items: Anime[];
}

export const TopTenRow = ({ items }: Props) => {
    // Only take top 10
    const topTen = items.slice(0, 10);
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
            showNotification('Action failed', 'error');
        }
    };

    return (
        <div className="py-8 md:px-12 px-4">
             <h2 className="text-xl md:text-2xl font-bold text-white mb-8 tracking-wide flex items-center gap-2 border-l-4 border-primary pl-3">
                Top 10 Today
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide py-4 items-center pl-4">
                {topTen.map((anime, index) => {
                    const isInList = watchlistIds.includes(anime.id);
                    return (
                    <Link 
                        to={`/watch/${anime.id}`}
                        key={anime.id} 
                        className="relative flex items-center group cursor-pointer flex-shrink-0"
                        style={{ minWidth: 'auto' }} 
                    >
                        {/* Huge Number SVG to prevent cropping and allow precise stroke */}
                        <div className="relative -mr-8 md:-mr-12 z-0 h-[160px] md:h-[220px] flex items-center">
                             <svg height="100%" viewBox="0 0 100 120" className="overflow-visible block">
                                <text 
                                    x="50%" 
                                    y="50%" 
                                    dominantBaseline="central" 
                                    textAnchor="middle" 
                                    fill="#0a0a0a" 
                                    stroke="#555" 
                                    strokeWidth="2" 
                                    className="text-[140px] md:text-[180px] font-black"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                >
                                    {index + 1}
                                </text>
                             </svg>
                        </div>
                        
                        {/* Image Card */}
                        <div className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden relative z-10 shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500 ease-in-out bg-surface">
                             <img 
                                src={anime.image} 
                                alt={anime.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                             />
                             {/* Mini Overlay for Watchlist */}
                             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => toggleWatchlist(e, anime)}
                                    className={`
                                        p-1.5 rounded-full backdrop-blur-md border 
                                        ${isInList ? 'bg-black/50 border-green-500 text-green-500' : 'bg-black/30 border-white/30 text-white hover:bg-black/50'}
                                    `}
                                >
                                    {isInList ? <Check size={14} /> : <Plus size={14} />}
                                </button>
                             </div>
                        </div>
                    </Link>
                )})}
                {/* Spacer padding right */}
                <div className="w-12 flex-shrink-0"></div>
            </div>
        </div>
    )
}