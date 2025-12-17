
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Anime, Episode, Relation } from '../types';
import { fetchAnimeDetails, historyService, watchlistService, fetchAnimeRecommendations, fetchAnimeEpisodes, fetchAnimeRelations, fetchAnimeSeasons, SeasonInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Play, Pause, Calendar, Star, Info, Share2, AlertCircle, Plus, Check, Loader2, Maximize, SkipForward, ArrowRight, Volume2, VolumeX, PlayCircle, Server, Globe, MonitorPlay, Settings, Captions, ChevronDown, Download, Lightbulb, LightbulbOff, Copy, Languages, ChevronLeft, Palette, Type, Box, List, FileText, Clapperboard, Search, ExternalLink } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

export const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  
  const [selectedChunk, setSelectedChunk] = useState(0);
  const [episodeQuery, setEpisodeQuery] = useState('');
  const ITEMS_PER_CHUNK = 100;

  const [activeSideTab, setActiveSideTab] = useState<'episodes' | 'relations'>('episodes');

  // Player Config
  const [videoLanguage, setVideoLanguage] = useState<'sub' | 'dub' | 'sub-ar' | 'dub-ar'>('sub-ar');
  const [activeServer, setActiveServer] = useState<'vidlink' | 'embedsu' | 'vidsrc' | 'vidsrc2' | 'superembed' | 'private'>('vidlink');
  const [cinemaMode, setCinemaMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const episodeListRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  const [subStyle, setSubStyle] = useState({
      color: '#fbbf24', 
      fontSize: '1.1em',
      background: 'rgba(0, 0, 0, 0.8)',
      edgeStyle: 'none'
  });

  const [arabicSubtitleUrl, setArabicSubtitleUrl] = useState<string>('');
  const controlsTimeout = useRef<any>(null);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const SAMPLE_VIDEOS = [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  ];

  // Adsterra Banners
  const ADSTERRA_SIDEBAR_CODE = `<script type="text/javascript">atOptions = {'key' : 'ff3fc835dbcf87ecc29dc319329a31cd','format' : 'iframe','height' : 250,'width' : 300,'params' : {}};</script><script type="text/javascript" src="https://www.highperformanceformat.com/ff3fc835dbcf87ecc29dc319329a31cd/invoke.js"></script>`;
  const BANNER_AD_CODE = `<div style="display: flex; justify-content: center; width: 100%;"><script type="text/javascript">atOptions = {'key' : '8706818a620825176a0f202c52652284','format' : 'iframe','height' : 90,'width' : 728,'params' : {}};</script><script type="text/javascript" src="https://www.highperformanceformat.com/8706818a620825176a0f202c52652284/invoke.js"></script></div>`;

  const getEpNumber = (ep: Episode): number => {
    if (!ep || ep.episode === null || ep.episode === undefined) return 999999;
    const str = String(ep.episode);
    const match = str.match(/[0-9]+(\.[0-9]+)?/);
    return match ? parseFloat(match[0]) : 999999;
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setIsPlaying(false);
      setActiveServer('vidlink');
      setVideoLanguage('sub-ar');
      setActiveSideTab('episodes');
      setEpisodeQuery('');
      
      try {
        const details = await fetchAnimeDetails(id);
        setAnime(details);
        const watchlistIds = await watchlistService.getWatchlistIds(user?.id);
        setInWatchlist(watchlistIds.includes(details.id));
        if(details.type !== 'فيلم') {
            const seasonsData = await fetchAnimeSeasons(id);
            setSeasons(seasonsData);
            const sParam = searchParams.get('season');
            if (sParam) setSelectedSeason(parseInt(sParam));
            else if (seasonsData.length > 0) setSelectedSeason(seasonsData[0].season_number);
        }
      } catch (error) {
        showNotification('فشل تحميل معلومات الانمي', 'error');
        setLoading(false);
        return;
      }
      Promise.allSettled([fetchAnimeRecommendations(id), fetchAnimeRelations(id)]).then(([recs, rels]) => {
          if (recs.status === 'fulfilled') setRecommendations(recs.value);
          if (rels.status === 'fulfilled') setRelations(rels.value);
      });
    };
    load();
  }, [id, user]); 

  useEffect(() => {
      if(!id || !anime) return;
      const fetchEps = async () => {
          let fetchedEps = await fetchAnimeEpisodes(id, selectedSeason);
          if (fetchedEps.length === 0) {
              fetchedEps = Array.from({ length: anime.totalEpisodes || 12 }).map((_, i) => ({
                  mal_id: parseInt(`${anime.id}${i}`),
                  title: `الحلقة ${i + 1}`,
                  episode: i + 1,
                  season: selectedSeason,
                  aired: '', score: 0, filler: false, recap: false, forum_url: ''
              }));
          }
          const sortedEps = fetchedEps.sort((a, b) => getEpNumber(a) - getEpNumber(b));
          setEpisodes(sortedEps);
          setLoading(false);
          const epParam = searchParams.get('ep');
          let initialIndex = 0;
          if (epParam) {
              const epNum = parseFloat(epParam);
              const idx = sortedEps.findIndex(e => getEpNumber(e) === epNum);
              if (idx !== -1) { initialIndex = idx; setIsPlaying(true); }
          }
          setCurrentEpisodeIndex(initialIndex);
      }
      fetchEps();
  }, [id, selectedSeason, anime]);

  // تفعيل ميزة "مشاهداتي" عند بدء مشاهدة أي حلقة
  useEffect(() => {
      if (user && anime && isPlaying) {
          const ep = episodes[currentEpisodeIndex];
          if (ep) {
              historyService.addToHistory(anime, user.id, Number(ep.episode));
          }
      }
  }, [currentEpisodeIndex, anime, user, isPlaying, episodes]);

  useEffect(() => {
    if (!anime) return;
    const vttContent = `WEBVTT\n1\n00:00:01.000 --> 00:00:05.000\nمشاهدة ممتعة مع الترجمة العربية\n2\n00:00:10.500 --> 00:00:20.000\n${anime.title} - الحلقة ${displayEpisodeNum}`;
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setArabicSubtitleUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [anime, currentEpisodeIndex]);

  const toggleWatchlist = async () => {
    if (!anime) return;
    const prev = inWatchlist;
    setInWatchlist(!inWatchlist);
    try {
        if (prev) { await watchlistService.removeFromWatchlist(anime.id, user?.id); showNotification('تم الحذف من قائمتي', 'info'); } 
        else { await watchlistService.addToWatchlist(anime, user?.id); showNotification('تمت الإضافة لقائمتي', 'success'); }
    } catch (e) { setInWatchlist(prev); showNotification('فشل الإجراء', 'error'); }
  };

  const handleNextEpisode = () => {
      if (currentEpisodeIndex < episodes.length - 1) {
          setCurrentEpisodeIndex(prev => prev + 1);
          setIsPlaying(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const currentEp = episodes.length > 0 ? episodes[currentEpisodeIndex] : null;
  const displayEpisodeNum = currentEp ? getEpNumber(currentEp) : (currentEpisodeIndex + 1);
  // Fixed hasNextEpisode missing definition
  const hasNextEpisode = episodes.length > 0 && currentEpisodeIndex < episodes.length - 1;

  const getEmbedUrl = () => {
    if (!anime) return '';
    const isMovie = anime.type === 'فيلم';
    const ep = displayEpisodeNum;
    if (activeServer === 'vidlink') return isMovie ? `https://vidlink.pro/movie/${anime.id}` : `https://vidlink.pro/tv/${anime.id}/${selectedSeason}/${ep}`;
    if (activeServer === 'embedsu') return isMovie ? `https://embed.su/embed/movie/${anime.id}` : `https://embed.su/embed/tv/${anime.id}/${selectedSeason}/${ep}`;
    if (activeServer === 'vidsrc') return isMovie ? `https://vidsrc.cc/v2/embed/movie/${anime.id}` : `https://vidsrc.cc/v2/embed/tv/${anime.id}/${selectedSeason}/${ep}`;
    return `https://vidsrc.to/embed/${isMovie ? 'movie' : 'tv'}/${anime.id}${!isMovie ? `/${selectedSeason}/${ep}` : ''}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background text-white"><Loader2 className="animate-spin mr-2"/> جاري التحميل...</div>;

  return (
    <div className={`pt-20 min-h-screen transition-colors duration-500 ${cinemaMode ? 'bg-black' : 'bg-background'}`} dir="rtl">
      <div className={`w-full relative select-none transition-all duration-500 ${cinemaMode ? 'z-50' : ''}`}>
          <div className="container mx-auto max-w-7xl">
            <div className={`aspect-video w-full bg-black relative overflow-hidden flex items-center justify-center shadow-2xl border-b border-white/10 ${cinemaMode ? 'fixed inset-0 z-50 h-screen w-screen' : ''}`}>
                 {isPlaying && (
                     <div className="w-full h-full bg-black relative">
                         <iframe src={getEmbedUrl()} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" referrerPolicy="origin" title="Stream" />
                         {cinemaMode && <button onClick={() => setCinemaMode(false)} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-white/20 z-50"><Lightbulb size={24} /></button>}
                     </div>
                 )}
                 {!isPlaying && (
                    <>
                        <img src={anime.cover || anime.image} className="w-full h-full object-cover opacity-60" alt="Poster"/>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <button onClick={() => setIsPlaying(true)} className="bg-primary/90 hover:bg-primary text-white p-6 rounded-full transform transition-all hover:scale-110 shadow-2xl"><Play fill="white" size={48} className="ml-2" /></button>
                        </div>
                    </>
                 )}
            </div>
            <div className="bg-[#18181b] p-4 flex flex-col items-center justify-between gap-4 border-b border-white/5 relative z-20">
                <div className="flex flex-wrap items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <select value={activeServer} onChange={(e) => setActiveServer(e.target.value as any)} className="bg-black/40 border border-white/10 text-white py-2 px-4 rounded text-sm font-bold focus:outline-none">
                            <option value="vidlink">سيرفر أساسي</option>
                            <option value="embedsu">سيرفر احتياطي 1</option>
                            <option value="vidsrc">سيرفر احتياطي 2</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasNextEpisode && <button onClick={handleNextEpisode} className="bg-primary hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold transition">الحلقة التالية <SkipForward size={18} fill="white"/></button>}
                        <button onClick={() => setCinemaMode(!cinemaMode)} className="p-2 bg-black/40 border border-white/10 rounded text-gray-400 hover:text-white"><Lightbulb size={18} /></button>
                    </div>
                </div>
            </div>
          </div>
      </div>
      <div className={`container mx-auto px-4 max-w-7xl py-8 ${cinemaMode ? 'opacity-20' : ''}`}>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-4xl font-black text-white mb-3">{anime.title}</h1>
                    <div className="flex gap-4">
                        <button onClick={toggleWatchlist} className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition font-medium border ${inWatchlist ? 'bg-black text-green-400 border-green-500' : 'bg-surface hover:bg-gray-800 text-white border-transparent'}`}>
                            {inWatchlist ? <Check size={18} /> : <Plus size={18} />} {inWatchlist ? 'موجود بالقائمة' : 'أضف لقائمتي'}
                        </button>
                    </div>
                </div>
                <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                     <div className="flex border-b border-white/5">
                        <button onClick={() => setActiveSideTab('episodes')} className={`flex-1 py-4 text-center font-bold text-sm transition ${activeSideTab === 'episodes' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}>الحلقات</button>
                        <button onClick={() => setActiveSideTab('relations')} className={`flex-1 py-4 text-center font-bold text-sm transition ${activeSideTab === 'relations' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}>صلة</button>
                     </div>
                     <div className="p-6">
                        {activeSideTab === 'episodes' && (
                            <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto custom-scroll">
                                {episodes.map((ep, idx) => (
                                    <div key={idx} onClick={() => { setCurrentEpisodeIndex(idx); setIsPlaying(true); }} className={`flex gap-4 p-3 rounded-lg border cursor-pointer ${currentEpisodeIndex === idx ? 'bg-primary/10 border-primary' : 'bg-white/5 border-transparent'}`}>
                                        <div className="w-24 h-14 bg-surface rounded overflow-hidden flex-shrink-0 relative"><img src={ep.image || anime.image} className="w-full h-full object-cover opacity-60"/><div className="absolute inset-0 flex items-center justify-center text-white font-bold">{ep.episode}</div></div>
                                        <h4 className="text-white text-sm font-medium self-center">{ep.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </div>
            </div>
            <div className="space-y-6">
                 <div className="bg-surface rounded-xl p-5 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">قد يعجبك أيضاً</h3>
                    <div className="space-y-4">
                        {recommendations.slice(0, 6).map(rec => (
                            <Link to={`/anime/${rec.id}`} key={rec.id} className="flex gap-3 group"><img src={rec.image} className="w-16 h-24 object-cover rounded shadow-lg"/><div className="flex-1"><h4 className="font-bold text-sm text-white group-hover:text-primary line-clamp-2">{rec.title}</h4><div className="text-xs text-gray-500 mt-1">{rec.type}</div></div></Link>
                        ))}
                    </div>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};
