import React, { useEffect, useState } from 'react';
import { fetchAnimeNews } from '../services/api';
import { NewsItem } from '../types';
import { Calendar, User, ArrowRight } from 'lucide-react';

export const News = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNews = async () => {
            const data = await fetchAnimeNews();
            setNews(data);
            setLoading(false);
        };
        loadNews();
    }, []);

    if (loading) return <div className="pt-32 text-center text-white">Loading News...</div>;

    return (
        <div className="pt-24 min-h-screen bg-background container mx-auto px-4 md:px-12 pb-12">
            <h1 className="text-4xl font-black text-white mb-8 border-l-4 border-primary pl-4">Latest Anime News</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {news.map((item, idx) => (
                    <a 
                        key={idx} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-surface rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border border-white/5 flex flex-col h-full"
                    >
                        <div className="h-48 overflow-hidden relative">
                            <img 
                                src={item.images?.jpg?.image_url || 'https://via.placeholder.com/300x200?text=Anime+News'} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-gray-300">
                                <Calendar size={12}/> {new Date(item.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                {item.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                                {item.excerpt}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                                <span className="flex items-center gap-1"><User size={12}/> {item.author_username}</span>
                                <span className="flex items-center gap-1 text-primary font-bold">Read More <ArrowRight size={12}/></span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
            
            {news.length === 0 && (
                <div className="text-center text-gray-500 py-12">No news updates available at the moment.</div>
            )}
        </div>
    );
};