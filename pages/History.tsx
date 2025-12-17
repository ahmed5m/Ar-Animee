import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { historyService } from '../services/api';
import { Link } from 'react-router-dom';
import { Play, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const History = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchHistory = async () => {
            if (user) {
                const data = await historyService.getHistory(user.id);
                setHistory(data);
            } else {
                setHistory([]);
            }
        }
        fetchHistory();
    }, [user]);

    return (
        <div className="pt-24 min-h-screen bg-background container mx-auto px-4 md:px-12 pb-12">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Clock className="text-primary" /> Watch History
            </h1>
            <p className="text-gray-400 mb-8 border-b border-white/10 pb-4">
                Continue where you left off
            </p>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-white/5 p-6 rounded-full mb-4">
                        <Clock size={48} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No watch history</h3>
                    <p className="text-gray-500 mb-6 max-w-md">Shows and movies you watch will appear here.</p>
                    <Link to="/" className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition">
                        Start Watching
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item, index) => (
                        <Link 
                            key={`${item.anime.id}-${index}`} 
                            to={`/watch/${item.anime.id}`}
                            className="flex bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/5 hover:bg-[#252525] transition group h-32 md:h-40 relative"
                        >
                            {/* Thumbnail */}
                            <div className="w-1/3 md:w-40 relative h-full flex-shrink-0">
                                <img 
                                    src={item.anime.cover || item.anime.image} 
                                    alt={item.anime.title} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Play fill="white" size={24} />
                                </div>
                                {/* Progress Bar Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700">
                                    <div className="h-full bg-primary" style={{ width: `${item.progress}%` }}></div>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-4 flex flex-col justify-between flex-1">
                                <div>
                                    <h3 className="text-white font-bold line-clamp-1 group-hover:text-primary transition">{item.anime.title}</h3>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Last watched: {new Date(item.watchedAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                                        {item.anime.description?.replace(/<[^>]*>/g, '') || 'No description.'}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                     <span className="text-xs font-bold text-gray-300">{item.progress}% Completed</span>
                                     <ArrowRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};