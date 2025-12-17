import React, { useEffect, useState } from 'react';
import { fetchTopRated, watchlistService } from '../services/api';
import { Anime } from '../types';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Plus, Check, Play } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const TopRated = () => {
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'global' | 'popular'>('global');
    const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
    const { showNotification } = useNotification();
    const { user } = useAuth();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchTopRated(); // Using Top Rated Endpoint
            // For demo purposes, we can sort/filter client side to simulate "Arab Popularity" if we don't have a specific API
            if (filter === 'popular') {
                // Mock filter: Sort by members/popularity instead of score
                data.sort((a,b) => (b.members || 0) - (a.members || 0));
            }
            setAnimes(data);
            setLoading(false);
            if (user) {
                const ids = await watchlistService.getWatchlistIds(user.id);
                setWatchlistIds(ids);
            } else {
                setWatchlistIds([]);
            }
        };
        load();
    }, [filter, user]);

    const toggleWatchlist = async (e: React.MouseEvent, anime: Anime) => {
        e.preventDefault();
        
        if (!user) {
            showNotification('Please sign in to add to watchlist', 'info');
            return;
        }

        const isAdded = watchlistIds.includes(anime.id);
        
        // Optimistic Update
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
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                   <Star className="text-yellow-500" fill="currentColor"/> Top Rated & Reviews
                </h1>
                
                <div className="flex bg-white/10 p-1 rounded-lg mt-4 md:mt-0">
                    <button 
                        onClick={() => setFilter('global')} 
                        className={`px-6 py-2 rounded-md text-sm font-bold transition ${filter === 'global' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Global Top
                    </button>
                    <button 
                        onClick={() => setFilter('popular')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition ${filter === 'popular' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Most Popular
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {animes.map((anime, index) => {
                        const isInList = watchlistIds.includes(anime.id);
                        return (
                        <div key={anime.id} className="group bg-surface hover:bg-[#222] border border-white/5 rounded-xl p-4 flex gap-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:border-white/10">
                            <div className="w-12 text-4xl font-black text-gray-700 flex items-center justify-center group-hover:text-primary transition-colors">
                                #{index + 1}
                            </div>
                            <Link to={`/watch/${anime.id}`} className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                                <img src={anime.image} alt={anime.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Play fill="white" size={24} />
                                </div>
                            </Link>
                            <div className="flex-1 py-2">
                                <Link to={`/watch/${anime.id}`} className="text-xl font-bold text-white group-hover:text-primary transition-colors mb-2 block">
                                    {anime.title}
                                </Link>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                    <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">
                                        <Star size={14} fill="currentColor"/> {anime.rating}
                                    </div>
                                    <div>{anime.type || 'TV'}</div>
                                    <div>{anime.totalEpisodes ? `${anime.totalEpisodes} eps` : 'Ongoing'}</div>
                                    <div>{anime.releaseDate}</div>
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-2 max-w-2xl mb-4">
                                    {anime.description?.replace(/<[^>]*>/g, '')}
                                </p>
                                <div className="flex gap-2">
                                    {anime.genres?.slice(0, 3).map(g => (
                                        <span key={g} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5">{g}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center px-4 border-l border-white/5">
                                <button 
                                    onClick={(e) => toggleWatchlist(e, anime)}
                                    className={`p-3 rounded-full border transition ${isInList ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white'}`}
                                >
                                    {isInList ? <Check size={20}/> : <Plus size={20}/>}
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
};