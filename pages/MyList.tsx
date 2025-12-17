import React, { useEffect, useState } from 'react';
import { Anime } from '../types';
import { watchlistService } from '../services/api';
import { Link } from 'react-router-dom';
import { Play, Check, X, Heart } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const MyList = () => {
    const [list, setList] = useState<Anime[]>([]);
    const { showNotification } = useNotification();
    const { user } = useAuth();

    useEffect(() => {
        const fetchList = async () => {
            // Allows guest access by passing undefined if user is null
            const data = await watchlistService.getWatchlist(user?.id);
            setList(data);
        }
        fetchList();
    }, [user]);

    const removeFromList = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        try {
            await watchlistService.removeFromWatchlist(id, user?.id);
            setList(prev => prev.filter(item => item.id !== id));
            showNotification('Removed from My List', 'info');
        } catch (e) {
            showNotification('Failed to remove', 'error');
        }
    };

    return (
        <div className="pt-24 min-h-screen bg-background container mx-auto px-4 md:px-12 pb-12">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Heart className="text-primary" fill="currentColor" /> My List
            </h1>
            <p className="text-gray-400 mb-8 border-b border-white/10 pb-4">
                {list.length} titles saved
            </p>

            {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-white/5 p-6 rounded-full mb-4">
                        <Heart size={48} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Your list is empty</h3>
                    <p className="text-gray-500 mb-6 max-w-md">Add shows and movies that you want to watch later by clicking the plus icon.</p>
                    <Link to="/" className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition">
                        Browse Content
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {list.map((anime) => (
                        <Link 
                            key={anime.id} 
                            to={`/watch/${anime.id}`}
                            className="relative group/card cursor-pointer"
                        >
                            <div className="aspect-[2/3] w-full bg-surface rounded-lg overflow-hidden relative shadow-lg border border-white/5">
                                <img 
                                    src={anime.image} 
                                    alt={anime.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110 group-hover/card:brightness-75"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 gap-3">
                                    <div className="bg-primary/90 rounded-full p-3 shadow-xl hover:bg-primary transform scale-90 group-hover/card:scale-100 transition">
                                        <Play fill="white" className="ml-1" size={24} />
                                    </div>
                                    <button 
                                        onClick={(e) => removeFromList(e, anime.id)}
                                        className="bg-black/60 border border-white/30 text-white rounded-full p-2 hover:bg-red-600 hover:border-red-600 transition flex items-center gap-1 text-xs"
                                    >
                                        <X size={16} /> Remove
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-sm font-bold text-gray-200 truncate group-hover/card:text-white">{anime.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{anime.type || 'TV'}</span>
                                    {anime.rating && <span className="text-green-500 border border-green-500/30 px-1 rounded">{anime.rating}</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};