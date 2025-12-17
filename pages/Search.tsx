import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime, watchlistService } from '../services/api';
import { Anime } from '../types';
import { Play, Plus, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        const performSearch = async () => {
            setLoading(true);
            try {
                const data = await searchAnime(query);
                setResults(data);
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setLoading(false);
            }
        };
        if(query) performSearch();
    }, [query]);

    const toggleWatchlist = async (e: React.MouseEvent, anime: Anime) => {
        e.preventDefault();
        e.stopPropagation();
    
        if (!user) {
            showNotification('Please sign in to add to watchlist', 'info');
            return;
        }

        const isAdded = watchlistIds.includes(anime.id);
        
        // Optimistic
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
             // Revert
            if (isAdded) setWatchlistIds(prev => [...prev, anime.id]);
            else setWatchlistIds(prev => prev.filter(id => id !== anime.id));
            showNotification('Action failed', 'error');
        }
    };

    return (
        <div className="pt-24 min-h-screen bg-background container mx-auto px-4 md:px-12 pb-12">
            <h1 className="text-2xl font-medium text-gray-400 mb-8 border-b border-white/10 pb-4">
                Results for "<span className="text-white">{query}</span>"
            </h1>
            
            {loading ? (
                 <div className="h-[50vh] w-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-500 text-sm font-medium animate-pulse">Searching library...</div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-4">
                    {results.map((item, index) => {
                         const isInList = watchlistIds.includes(item.id);
                         return (
                         <Link 
                         key={`${item.id}-${index}`}
                         to={`/watch/${item.id}`}
                         className="relative group/card transition-all duration-500 ease-in-out hover:scale-105 hover:z-10 cursor-pointer"
                       >
                            <div className="aspect-[2/3] w-full bg-surface rounded-lg overflow-hidden relative shadow-lg border border-white/5">
                                <img 
                                    src={item.image} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:brightness-75 group-hover/card:scale-110"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 gap-3">
                                    <div className="bg-primary/90 rounded-full p-3 shadow-xl transform scale-50 group-hover/card:scale-100 transition-transform">
                                        <Play fill="white" className="ml-1" size={20} />
                                    </div>
                                    <button 
                                        onClick={(e) => toggleWatchlist(e, item)}
                                        className={`
                                            rounded-full p-3 shadow-xl transform scale-50 group-hover/card:scale-100 transition-transform border
                                            ${isInList ? 'bg-black/60 border-green-500 text-green-500' : 'bg-black/60 border-white/30 text-white hover:border-white'}
                                        `}
                                    >
                                        {isInList ? <Check size={20} /> : <Plus size={20} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-2">
                                <h3 className="text-sm font-bold text-gray-200 truncate group-hover/card:text-white transition-colors">{item.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{item.releaseDate || 'N/A'}</span>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                    <span>{item.type || 'TV'}</span>
                                </div>
                            </div>
                       </Link>
                    )})}
                    
                    {results.length === 0 && !loading && (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            <p className="text-lg">No matches found for "{query}".</p>
                            <p className="text-sm mt-2">Try checking your spelling or use different keywords.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}