import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Anime, Episode, Relation, Character } from '../types';
import { fetchAnimeDetails, fetchAnimeEpisodes, fetchAnimeRecommendations, watchlistService, fetchAnimeRelations, fetchAnimeCharacters, sleep, fetchAnimeSeasons, SeasonInfo } from '../services/api';
import { Play, Star, Plus, Check, Loader2, Youtube, PlayCircle, Users, Clapperboard, Mic, Building2, Search, Calendar, Globe, Info, Clock, Timer, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { AdBanner } from '../components/AdBanner';

export const AnimeInfo = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // Data State
    const [anime, setAnime] = useState<Anime | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [recommendations, setRecommendations] = useState<Anime[]>([]);
    const [relations, setRelations] = useState<Relation[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [activeTab, setActiveTab] = useState<'episodes' | 'characters' | 'relations' >('episodes');
    const [episodeQuery, setEpisodeQuery] = useState('');
    const [selectedChunk, setSelectedChunk] = useState(0);
    const [showTrailer, setShowTrailer] = useState(false);
    
    const ITEMS_PER_CHUNK = 50; 
    
    const { user } = useAuth();
    const { showNotification } = useNotification();

    // Helper for sorting episodes numerically
    const getEpNumber = (ep: Episode): number => {
        if (!ep || ep.episode === null || ep.episode === undefined) return 999999;
        const str = String(ep.episode);
        const match = str.match(/[0-9]+(\.[0-9]+)?/);
        return match ? parseFloat(match[0]) : 999999;
    };

    // 728x90 Banner Code
    const BANNER_AD_CODE = `
      <div style="display: flex; justify-content: center; width: 100%;">
        <script type="text/javascript">
          atOptions = {
            'key' : '8706818a620825176a0f202c52652284',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/8706818a620825176a0f202c52652284/invoke.js"></script>
      </div>
    `;

    // --- FETCH DATA ---
    useEffect(() => {
        if (!id) return;
        
        // Reset States
        setRelations([]);
        setEpisodes([]);
        setCharacters([]);
        setRecommendations([]);
        setEpisodeQuery('');
        setSelectedChunk(0);
        setShowTrailer(false);
        setSeasons([]);
        setSelectedSeason(1);
        
        const load = async () => {
            setLoading(true);
            try {
                // 1. Details
                const details = await fetchAnimeDetails(id);
                setAnime(details);

                // 2. Watchlist Status (Allow Guest)
                const ids = await watchlistService.getWatchlistIds(user?.id);
                setInWatchlist(ids.includes(details.id));
                
                // 3. Seasons Info
                if (details.type !== 'فيلم') {
                    const seasonsData = await fetchAnimeSeasons(id);
                    setSeasons(seasonsData);
                    // Default to Season 1 or first available
                    if (seasonsData.length > 0) setSelectedSeason(seasonsData[0].season_number);
                }

                await sleep(200); 

                const [rels, recs, chars] = await Promise.all([
                    fetchAnimeRelations(id),
                    fetchAnimeRecommendations(id),
                    fetchAnimeCharacters(id)
                ]);
                
                setRelations(rels);
                setRecommendations(recs);
                setCharacters(chars);

            } catch (error) {
                console.error("Failed to load anime info", error);
            } finally {
                setLoading(false);
            }
        };
        load();
        window.scrollTo(0, 0);
    }, [id, user]);

    // Fetch Episodes when Season Changes
    useEffect(() => {
        if (!id || !anime) return;
        const loadEpisodes = async () => {
             // For movies, season is usually 1 or irrelevant, but api handles it
             const eps = await fetchAnimeEpisodes(id, selectedSeason);
             const sortedEps = eps.sort((a, b) => getEpNumber(a) - getEpNumber(b));
             setEpisodes(sortedEps);
        };
        loadEpisodes();
    }, [id, selectedSeason, anime]);

    // --- ACTIONS ---
    const toggleWatchlist = async () => {
        if (!anime) return;
        
        const previousState = inWatchlist;
        setInWatchlist(!inWatchlist); 
    
        try {
            if (previousState) {
                await watchlistService.removeFromWatchlist(anime.id, user?.id);
                showNotification('تم الحذف من القائمة', 'info');
            } else {
                await watchlistService.addToWatchlist(anime, user?.id);
                showNotification('تمت الإضافة للقائمة', 'success');
            }
        } catch (error) {
            setInWatchlist(previousState);
            showNotification('فشل الإجراء', 'error');
        }
    };

    // --- FILTERING ---
    const filteredEpisodes = episodeQuery 
        ? episodes.filter(ep => ep.episode.toString().includes(episodeQuery) || ep.title.toLowerCase().includes(episodeQuery.toLowerCase()))
        : episodes;

    const totalChunks = Math.ceil(filteredEpisodes.length / ITEMS_PER_CHUNK);
    
    const displayEpisodes = episodeQuery 
        ? filteredEpisodes 
        : filteredEpisodes.slice(selectedChunk * ITEMS_PER_CHUNK, (selectedChunk + 1) * ITEMS_PER_CHUNK);


    if (loading && !anime) return <div className="h-screen flex items-center justify-center bg-background text-white"><Loader2 className="animate-spin mr-2"/> جاري التحميل...</div>;
    if (!anime) return <div className="h-screen flex items-center justify-center text-white bg-background">لم يتم العثور على الانمي</div>;

    return (
        <div className="bg-background min-h-screen pb-12" dir="rtl">
            
            {/* === TRAILER MODAL === */}
            {showTrailer && anime.trailerUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowTrailer(false)}>
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
                        <button onClick={() => setShowTrailer(false)} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-white/20 z-10 transition">
                            <X size={24} />
                        </button>
                        <iframe 
                            src={anime.trailerUrl + "&autoplay=1"} 
                            className="w-full h-full" 
                            allowFullScreen 
                            allow="autoplay; encrypted-media; picture-in-picture"
                            title="Trailer"
                        />
                    </div>
                </div>
            )}

            {/* === HERO SECTION === */}
            <div className="relative w-full min-h-[550px] md:h-[80vh] flex items-end">
                 {/* Background Image */}
                <div className="absolute inset-0">
                    <img src={anime.cover || anime.image} className="w-full h-full object-cover opacity-60" alt={anime.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-black/50 to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 md:px-12 relative z-10 pb-12 flex flex-col md:flex-row items-end gap-8">
                     {/* Poster */}
                     <div className="hidden md:block w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/20 flex-shrink-0">
                        <img src={anime.image} className="w-full h-full object-cover" alt="Poster"/>
                     </div>

                     <div className="flex-1 space-y-4 md:space-y-6 mb-4 md:mb-0">
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-300">
                             {anime.rating && (
                                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500"/>
                                    <span className="text-white font-bold text-lg">{anime.rating}</span>
                                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                         <div className="h-full bg-yellow-500" style={{ width: `${(Number(anime.rating) / 10) * 100}%` }} />
                                    </div>
                                </div>
                             )}
                             <span>{anime.releaseDate?.split(' ')[0]}</span>
                             <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                             <span>{anime.type}</span>
                             <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                             <span className="bg-white/10 px-2 py-0.5 rounded text-white">{episodes.length > 0 ? `${episodes.length} حلقة` : 'مستمر'}</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none drop-shadow-2xl">
                            {anime.title}
                        </h1>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2">
                            {anime.genres?.map(g => (
                                <span key={g} className="text-xs md:text-sm text-gray-300 border border-white/20 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                                    {g}
                                </span>
                            ))}
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-3xl drop-shadow-md leading-relaxed">
                            {anime.description?.replace(/<[^>]*>/g, '')}
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                             <Link 
                                to={`/watch/${anime.id}?season=${selectedSeason}&ep=0`} 
                                className="flex items-center gap-2 bg-primary hover:bg-red-700 text-white px-8 py-3.5 rounded-lg font-bold text-lg transition transform hover:scale-105 shadow-lg shadow-primary/20"
                             >
                                 <Play fill="white" size={24}/> ابدأ المشاهدة
                             </Link>
                             
                             <button 
                                onClick={toggleWatchlist}
                                className={`flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold text-lg transition border ${inWatchlist ? 'bg-black/80 border-green-500 text-green-500' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'}`}
                             >
                                 {inWatchlist ? <Check size={24}/> : <Plus size={24}/>} {inWatchlist ? 'في القائمة' : 'إضافة للقائمة'}
                             </button>

                             {anime.trailerUrl && (
                                 <button 
                                    onClick={() => setShowTrailer(true)}
                                    className="p-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-white transition flex items-center gap-2 font-bold"
                                    title="تشغيل التريلر"
                                 >
                                     <Youtube size={24} className="text-red-500"/>
                                     <span className="hidden md:inline">عرض تشويقي</span>
                                 </button>
                             )}
                        </div>
                     </div>
                </div>
            </div>

            <AdBanner type="custom" adCode={BANNER_AD_CODE} height="90px" />

            {/* === MAIN CONTENT === */}
            <div className="container mx-auto px-4 md:px-12 mt-8 md:mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* LEFT COLUMN (Tabs & Content) */}
                    <div className="lg:col-span-8">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide">
                            <button 
                                onClick={() => setActiveTab('episodes')} 
                                className={`px-6 py-4 font-bold text-sm md:text-base whitespace-nowrap border-b-2 transition ${activeTab === 'episodes' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                الحلقات <span className="mr-2 bg-white/10 text-xs px-2 py-0.5 rounded-full">{episodes.length}</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('characters')} 
                                className={`px-6 py-4 font-bold text-sm md:text-base whitespace-nowrap border-b-2 transition ${activeTab === 'characters' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                الشخصيات
                            </button>
                            <button 
                                onClick={() => setActiveTab('relations')} 
                                className={`px-6 py-4 font-bold text-sm md:text-base whitespace-nowrap border-b-2 transition ${activeTab === 'relations' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                أعمال مرتبطة
                            </button>
                        </div>
                        
                        {/* AD Removed from here */}

                        {/* --- EPISODES TAB --- */}
                        {activeTab === 'episodes' && (
                            <div className="animate-fade-in">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4 flex-1">
                                        {seasons.length > 1 && (
                                            <div className="relative group min-w-[140px]">
                                                <select 
                                                    value={selectedSeason}
                                                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                                    className="w-full appearance-none bg-surface border border-white/10 text-white py-2.5 px-4 rounded-lg focus:outline-none focus:border-primary cursor-pointer"
                                                >
                                                    {seasons.map(s => (
                                                        <option key={s.season_number} value={s.season_number}>{s.name} ({s.episode_count})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={16}/>
                                            </div>
                                        )}
                                        
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute right-3 top-3 text-gray-500" size={18}/>
                                            <input 
                                                type="text" 
                                                placeholder="بحث برقم الحلقة..." 
                                                value={episodeQuery}
                                                onChange={(e) => setEpisodeQuery(e.target.value)}
                                                className="w-full bg-surface border border-white/10 rounded-lg pr-10 pl-4 py-2.5 text-white focus:outline-none focus:border-primary transition placeholder-gray-600 text-right"
                                            />
                                        </div>
                                    </div>

                                    {!episodeQuery && totalChunks > 1 && (
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <span className="text-gray-400 text-sm py-1.5 ml-2">صفحة:</span>
                                            {Array.from({ length: totalChunks }).map((_, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => setSelectedChunk(idx)}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition ${selectedChunk === idx ? 'bg-white text-black' : 'bg-surface text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    {idx * ITEMS_PER_CHUNK + 1}-{Math.min((idx + 1) * ITEMS_PER_CHUNK, episodes.length)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {displayEpisodes.length > 0 ? (
                                        displayEpisodes.map((ep, idx) => (
                                            <Link 
                                                key={ep.mal_id || idx}
                                                to={`/watch/${anime.id}?season=${selectedSeason}&ep=${ep.episode}`}
                                                className="group flex items-center gap-4 p-4 bg-surface hover:bg-[#25252b] border border-white/5 rounded-lg transition"
                                            >
                                                <div className="w-12 h-12 flex-shrink-0 bg-white/5 rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-white/10 transition">
                                                    <Play size={20} fill="currentColor" className="mr-1"/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-primary font-bold text-sm">حلقة {ep.episode}</span>
                                                        {ep.filler && <span className="text-[10px] bg-yellow-600/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-600/30">فلر</span>}
                                                    </div>
                                                    <h4 className="text-gray-200 font-medium truncate group-hover:text-white transition">
                                                        {(!ep.title || ep.title.includes('Episode')) ? `الحلقة ${ep.episode}` : ep.title}
                                                    </h4>
                                                </div>
                                                <div className="text-xs text-gray-500 hidden md:block">
                                                    {ep.aired ? new Date(ep.aired).toLocaleDateString('ar-SA') : ''}
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 bg-surface rounded-lg border border-white/5">
                                            لا توجد حلقات تطابق بحثك.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- CHARACTERS TAB --- */}
                        {activeTab === 'characters' && (
                            <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {characters.map((char) => (
                                    <div key={char.mal_id} className="bg-surface rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition group">
                                        <div className="relative aspect-[3/4]">
                                            <img src={char.image} alt={char.name} className="w-full h-full object-cover"/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                                            <div className="absolute bottom-2 left-2 right-2 text-right">
                                                <div className="text-white font-bold text-sm truncate">{char.name}</div>
                                                <div className="text-gray-400 text-xs">{char.role}</div>
                                            </div>
                                        </div>
                                        {char.voice_actor && (
                                            <div className="p-2 flex items-center gap-2 bg-black/20 flex-row-reverse">
                                                <img src={char.voice_actor.image} className="w-8 h-8 rounded-full object-cover" alt={char.voice_actor.name}/>
                                                <div className="min-w-0 text-right">
                                                    <div className="text-gray-300 text-xs truncate">{char.voice_actor.name}</div>
                                                    <div className="text-gray-600 text-[10px]">{char.voice_actor.language}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {characters.length === 0 && <div className="col-span-full py-8 text-center text-gray-500">لا توجد معلومات عن الشخصيات.</div>}
                            </div>
                        )}

                        {/* --- RELATIONS TAB --- */}
                        {activeTab === 'relations' && (
                            <div className="animate-fade-in space-y-4">
                                {relations.map((rel, idx) => (
                                    <div key={idx} className="bg-surface p-5 rounded-lg border border-white/5">
                                        <h3 className="text-primary font-bold mb-3 uppercase tracking-widest text-xs">{rel.relation}</h3>
                                        <div className="space-y-3">
                                            {rel.entry.map(entry => (
                                                <Link 
                                                    key={entry.mal_id} 
                                                    to={entry.type === 'anime' ? `/anime/${entry.mal_id}` : '#'}
                                                    className={`flex items-center gap-4 p-3 rounded bg-black/20 hover:bg-white/5 transition ${entry.type !== 'anime' ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-gray-400">
                                                        {entry.type === 'anime' ? <Clapperboard size={18}/> : <Info size={18}/>}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm">{entry.name}</div>
                                                        <div className="text-gray-500 text-xs capitalize">{entry.type}</div>
                                                    </div>
                                                    {entry.type === 'anime' && <div className="mr-auto text-primary text-xs font-bold">عرض</div>}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {relations.length === 0 && <div className="py-8 text-center text-gray-500">لا توجد أعمال مرتبطة.</div>}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN (Sidebar) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Information Panel - Enhanced details */}
                        <div className="bg-surface rounded-xl p-6 border border-white/5 space-y-4">
                            <h3 className="text-lg font-bold text-white mb-4">معلومات الانمي</h3>
                            
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm flex items-center gap-2"><Globe size={16}/> الاسم الياباني</span>
                                <span className="text-white text-sm font-medium truncate max-w-[150px]" dir="ltr">{anime.title_japanese || 'غير متوفر'}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm flex items-center gap-2"><Building2 size={16}/> الاستوديو</span>
                                <span className="text-white text-sm font-medium">{anime.studios?.[0] || 'غير معروف'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm flex items-center gap-2"><Clock size={16}/> المدة</span>
                                <span className="text-white text-sm font-medium">{anime.duration || '24 دقيقة'}</span>
                            </div>

                             <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm flex items-center gap-2"><PlayCircle size={16}/> الحالة</span>
                                <span className={`text-sm font-medium ${anime.status === 'مستمر' ? 'text-green-400' : 'text-white'}`}>{anime.status}</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm flex items-center gap-2"><Calendar size={16}/> الموسم</span>
                                <span className="text-white text-sm font-medium capitalize">{anime.season ? `${anime.season} ${anime.year || ''}` : 'غير محدد'}</span>
                            </div>

                            {/* Enhanced Visual Rating in Sidebar */}
                            <div className="py-3 border-b border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm flex items-center gap-2"><Star size={16}/> التقييم</span>
                                    <span className="text-white text-sm font-medium">{anime.rating} <span className="text-xs text-gray-500">/ 10</span></span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" 
                                        style={{ width: `${(Number(anime.rating) / 10) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                    <span>الترتيب العالمي: #{anime.rank || 'N/A'}</span>
                                    <span>الشعبية: #{anime.popularity || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-surface rounded-xl p-6 border border-white/5">
                             <h3 className="text-lg font-bold text-white mb-4">قد يعجبك أيضاً</h3>
                             <div className="space-y-4">
                                 {recommendations.slice(0, 6).map(rec => (
                                     <Link to={`/anime/${rec.id}`} key={rec.id} className="flex gap-3 group">
                                         <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                                             <img src={rec.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={rec.title}/>
                                         </div>
                                         <div>
                                             <h4 className="text-sm font-bold text-gray-200 group-hover:text-primary transition line-clamp-2">{rec.title}</h4>
                                             <div className="text-xs text-gray-500 mt-1">{rec.type} • {rec.releaseDate}</div>
                                         </div>
                                     </Link>
                                 ))}
                                 {recommendations.length === 0 && <div className="text-gray-500 text-sm">لا توجد توصيات متاحة.</div>}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Ad (End of Page) - 728x90 */}
                <div className="mt-8">
                     <AdBanner type="custom" adCode={BANNER_AD_CODE} height="90px" />
                </div>
            </div>
        </div>
    );
};