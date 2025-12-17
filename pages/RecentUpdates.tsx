import React, { useEffect, useState } from 'react';
import { Anime } from '../types';
import { fetchRecentAnime, watchlistService } from '../services/api';
import { Link } from 'react-router-dom';
import { Play, Calendar, Check, Plus, Loader } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const RecentUpdates = () => {
    const [recent, setRecent] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
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
        loadInitial();
    }, [user]);

    const loadInitial = async () => {
        setLoading(true);
        const data = await fetchRecentAnime(1);
        setRecent(data);
        setLoading(false);
        if (data.length < 24) setHasMore(false);
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const data = await fetchRecentAnime(nextPage);
        
        if (data.length === 0) {
            setHasMore(false);
        } else {
            setRecent(prev => [...prev, ...data]);
            setPage(nextPage);
        }
        setLoadingMore(false);
    };

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
             <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Calendar className="text-primary" /> New Episodes & Updates
            </h1>
            <p className="text-gray-400 mb-8 border-b border-white/10 pb-4">
                Fresh content just aired, sorted by newest release.
            </p>

            {loading ? (
                <div className="h-[50vh] flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-500 text-sm animate-pulse">Fetching latest updates...</div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-6">
                        {recent.map((anime, index) => {
                             const isInList = watchlistIds.includes(anime.id);
                             return (
                            <Link 
                                key={`${anime.id}-${index}`} 
                                to={`/watch/${anime.id}`}
                                className="group/card cursor-pointer"
                            >
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/5 shadow-lg">
                                    <img 
                                        src={anime.image} 
                                        alt={anime.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110 group-hover/card:brightness-75"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                        NEW
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 gap-3">
                                        <div className="bg-primary/90 rounded-full p-3 shadow-xl transform scale-50 group-hover/card:scale-100 transition-transform hover:bg-primary">
                                            <Play fill="white" className="ml-1" size={20} />
                                        </div>
                                        <button 
                                            onClick={(e) => toggleWatchlist(e, anime)}
                                            className={`rounded-full p-3 shadow-xl transform scale-50 group-hover/card:scale-100 transition-transform border ${isInList ? 'bg-black/60 border-green-500 text-green-500' : 'bg-black/60 border-white/30 text-white'}`}
                                        >
                                             {isInList ? <Check size={20} /> : <Plus size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h3 className="text-sm font-bold text-gray-200 line-clamp-1 group-hover/card:text-white transition-colors">{anime.title}</h3>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                        <span className="text-gray-400">{anime.releaseDate}</span>
                                        <span className="text-primary font-medium">{anime.totalEpisodes ? `Ep ${anime.totalEpisodes}` : 'Ongoing'}</span>
                                    </div>
                                </div>
                            </Link>
                        )})}
                    </div>
                    
                    {hasMore && (
                        <div className="mt-12 flex justify-center">
                            <button 
                                onClick={loadMore} 
                                disabled={loadingMore}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader className="animate-spin" size={20} /> Loading...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};