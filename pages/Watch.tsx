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
  // Changed default to 'vidlink' for better stability
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

  // Adsterra 300x250 (Sidebar)
  const ADSTERRA_SIDEBAR_CODE = `
    <script type="text/javascript">
      atOptions = {
        'key' : 'ff3fc835dbcf87ecc29dc319329a31cd',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="https://www.highperformanceformat.com/ff3fc835dbcf87ecc29dc319329a31cd/invoke.js"></script>
  `;

  // Adsterra 728x90 (Banner)
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
      setActiveServer('vidlink'); // Reset to most stable on load
      setVideoLanguage('sub-ar');
      setActiveSideTab('episodes');
      setEpisodeQuery('');
      
      let currentDetails: Anime;

      try {
        currentDetails = await fetchAnimeDetails(id);
        setAnime(currentDetails);

        // Check watchlist (allows guest)
        const watchlistIds = await watchlistService.getWatchlistIds(user?.id);
        setInWatchlist(watchlistIds.includes(currentDetails.id));

        // Fetch Seasons
        if(currentDetails.type !== 'فيلم') {
            const seasonsData = await fetchAnimeSeasons(id);
            setSeasons(seasonsData);
            
            // Check params for season
            const sParam = searchParams.get('season');
            if (sParam) setSelectedSeason(parseInt(sParam));
            else if (seasonsData.length > 0) setSelectedSeason(seasonsData[0].season_number);
        }

      } catch (error) {
        showNotification('فشل تحميل معلومات الانمي', 'error');
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
          fetchAnimeRecommendations(id),
          fetchAnimeRelations(id)
      ]);

      const [recsResult, relResult] = results;

      if (recsResult.status === 'fulfilled') setRecommendations(recsResult.value);
      if (relResult.status === 'fulfilled') setRelations(relResult.value);
    };

    load();
  }, [id, user]); 

  // Fetch Episodes on Season Change
  useEffect(() => {
      if(!id || !anime) return;
      const fetchEps = async () => {
          let fetchedEps = await fetchAnimeEpisodes(id, selectedSeason);
          
          if (fetchedEps.length === 0) {
              let count = anime.totalEpisodes || 12;
              fetchedEps = Array.from({ length: count }).map((_, i) => ({
                  mal_id: parseInt(`${anime.id}${i}`),
                  title: `الحلقة ${i + 1}`,
                  episode: i + 1,
                  season: selectedSeason,
                  aired: '',
                  score: 0,
                  filler: false, 
                  recap: false,
                  forum_url: ''
              }));
          }

          const sortedEps = fetchedEps.sort((a, b) => getEpNumber(a) - getEpNumber(b));
          setEpisodes(sortedEps);
          setLoading(false);

          // Determine initial index from URL
          const epParam = searchParams.get('ep');
          let initialIndex = 0;
          if (epParam) {
              const epNum = parseFloat(epParam);
              // Find index by episode number
              const idx = sortedEps.findIndex(e => getEpNumber(e) === epNum);
              if (idx !== -1) {
                  initialIndex = idx;
                  setIsPlaying(true);
              }
          }
          setCurrentEpisodeIndex(initialIndex);
      }
      fetchEps();
  }, [id, selectedSeason, anime]);

  useEffect(() => {
      if (user && anime) {
          // historyService.addToHistory(anime, user.id, currentEpisodeIndex + 1);
      }
  }, [currentEpisodeIndex, anime, user]);


  useEffect(() => {
    if (!anime) return;
    const vttContent = `WEBVTT
STYLE
::cue { background-color: ${subStyle.background}; color: ${subStyle.color}; font-family: 'Cairo'; font-size: ${subStyle.fontSize}; }
1
00:00:01.000 --> 00:00:05.000 align:center line:90%
مشاهدة ممتعة مع الترجمة العربية
2
00:00:10.500 --> 00:00:20.000 align:center line:90%
${anime.title} - الحلقة ${displayEpisodeNum}
    `;
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setArabicSubtitleUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [anime, currentEpisodeIndex, subStyle]);


  const toggleWatchlist = async () => {
    if (!anime) return;
    const previousState = inWatchlist;
    setInWatchlist(!inWatchlist);
    try {
        if (previousState) { await watchlistService.removeFromWatchlist(anime.id, user?.id); showNotification('تم الحذف من قائمتي', 'info'); } 
        else { await watchlistService.addToWatchlist(anime, user?.id); showNotification('تمت الإضافة لقائمتي', 'success'); }
    } catch (error) { setInWatchlist(previousState); showNotification('فشل الإجراء', 'error'); }
  };

  const handleShare = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      showNotification('تم نسخ الرابط!', 'success');
  };

  const handleNextEpisode = () => {
      if (currentEpisodeIndex < episodes.length - 1) {
          setCurrentEpisodeIndex(prev => prev + 1);
          setIsPlaying(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (videoRef.current.paused) { videoRef.current.play(); setIsPaused(false); } 
        else { videoRef.current.pause(); setIsPaused(true); }
    }
  };

  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !videoRef.current.muted; setIsMuted(videoRef.current.muted); } };
  const toggleFullscreen = () => { if (videoRef.current) { if (document.fullscreenElement) document.exitFullscreen(); else videoRef.current.parentElement?.requestFullscreen(); } };
  const handleTimeUpdate = () => {
      if (videoRef.current) {
          const curr = videoRef.current.currentTime;
          setCurrentTime(curr);
          if (curr > 5 && curr < 20) setShowSkipIntro(true); else setShowSkipIntro(false);
      }
  };

  const currentEp = episodes.length > 0 ? episodes[currentEpisodeIndex] : null;
  const displayEpisodeNum = currentEp ? getEpNumber(currentEp) : (currentEpisodeIndex + 1);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;

  const filteredEpisodes = episodeQuery 
      ? episodes.filter(ep => ep.episode.toString().includes(episodeQuery) || ep.title.toLowerCase().includes(episodeQuery.toLowerCase()))
      : episodes;

  const totalChunks = Math.ceil(episodes.length / ITEMS_PER_CHUNK);
  const displayEpisodes = episodeQuery 
      ? filteredEpisodes 
      : episodes.slice(selectedChunk * ITEMS_PER_CHUNK, (selectedChunk + 1) * ITEMS_PER_CHUNK);


  // --- EMBED URL GENERATION ---
  const getEmbedUrl = () => {
    if (!anime) return '';
    const isMovie = anime.type === 'فيلم';
    
    // Server 1: VidLink (Often Best)
    if (activeServer === 'vidlink') {
        return isMovie
            ? `https://vidlink.pro/movie/${anime.id}?primaryColor=E50914&autoplay=true`
            : `https://vidlink.pro/tv/${anime.id}/${selectedSeason}/${displayEpisodeNum}?primaryColor=E50914&autoplay=true`;
    }

    // Server 2: EmbedSu (Very Reliable)
    if (activeServer === 'embedsu') {
         return isMovie
            ? `https://embed.su/embed/movie/${anime.id}`
            : `https://embed.su/embed/tv/${anime.id}/${selectedSeason}/${displayEpisodeNum}`;
    }

    // Server 3: VidSrc (CC)
    if (activeServer === 'vidsrc') {
        return isMovie 
            ? `https://vidsrc.cc/v2/embed/movie/${anime.id}?autoPlay=true&theme=18181b`
            : `https://vidsrc.cc/v2/embed/tv/${anime.id}/${selectedSeason}/${displayEpisodeNum}?autoPlay=true&theme=18181b`;
    }
    
    // Server 4: VidSrc (TO)
    if (activeServer === 'vidsrc2') {
        return isMovie
            ? `https://vidsrc.to/embed/movie/${anime.id}`
            : `https://vidsrc.to/embed/tv/${anime.id}/${selectedSeason}/${displayEpisodeNum}`;
    }

    // Server 5: SuperEmbed
    if (activeServer === 'superembed') {
         return isMovie
            ? `https://multiembed.mov/?video_id=${anime.id}&tmdb=1`
            : `https://multiembed.mov/?video_id=${anime.id}&tmdb=1&s=${selectedSeason}&e=${displayEpisodeNum}`;
    }
    
    return '';
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background text-white"><Loader2 className="animate-spin mr-2"/> جاري التحميل...</div>;
  if (!anime) return <div className="h-screen flex items-center justify-center bg-background text-white">لم يتم العثور على الأنمي</div>;

  return (
    <div className={`pt-20 min-h-screen transition-colors duration-500 ${cinemaMode ? 'bg-black' : 'bg-background'}`} dir="rtl">
      <div 
        className={`w-full relative group select-none transition-all duration-500 ${cinemaMode ? 'z-50' : ''}`} 
        onMouseMove={() => { setShowControls(true); if(controlsTimeout.current) clearTimeout(controlsTimeout.current); controlsTimeout.current = setTimeout(() => { if(!showSettingsMenu) setShowControls(false); }, 3000); }} 
        onMouseLeave={() => { if(!showSettingsMenu) setShowControls(false); }}
      >
          <div className="container mx-auto max-w-7xl">
            
            <div className={`aspect-video w-full bg-black relative overflow-hidden flex items-center justify-center shadow-2xl border-b border-white/10 ${cinemaMode ? 'fixed inset-0 z-50 h-screen w-screen' : ''}`}>
                 {activeServer !== 'private' && isPlaying && (
                     <div className="w-full h-full bg-black relative">
                         <iframe 
                            key={`embed-${activeServer}-${selectedSeason}-${displayEpisodeNum}`}
                            src={getEmbedUrl()}
                            className="w-full h-full border-none"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="origin"
                            title="Stream"
                         />
                         
                         {cinemaMode && (
                             <button onClick={() => setCinemaMode(false)} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-white/20 z-50">
                                 <Lightbulb size={24} />
                             </button>
                         )}
                     </div>
                 )}

                 {activeServer === 'private' && isPlaying && (
                    <div className="w-full h-full relative group/native bg-black">
                        <video 
                            key={`video-${currentEpisodeIndex}`} 
                            ref={videoRef}
                            src={SAMPLE_VIDEOS[currentEpisodeIndex % 3]}
                            className="w-full h-full object-contain"
                            autoPlay
                            muted={isMuted}
                            onPlay={() => setIsPaused(false)}
                            onPause={() => setIsPaused(true)}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                            onClick={() => { togglePlay(); setShowSettingsMenu(false); }}
                            playsInline
                            crossOrigin="anonymous"
                        >
                             <track key={arabicSubtitleUrl} kind="subtitles" src={arabicSubtitleUrl} srcLang="ar" label="Arabic" default />
                        </video>
                         <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between p-6 z-40 ${showControls || showSettingsMenu ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex justify-between items-start">
                                <button onClick={() => setIsPlaying(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition"><ArrowRight size={28} /></button>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="text-white">{isPaused ? <Play size={32}/> : <Pause size={32}/>}</button>
                            </div>
                         </div>
                    </div>
                 )}

                 {!isPlaying && (
                    <>
                        <img src={anime.cover || anime.image} className="w-full h-full object-cover opacity-60" alt="Poster"/>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <button onClick={() => { setIsPlaying(true); setIsMuted(false); }} className="bg-primary/90 hover:bg-primary text-white p-6 rounded-full transform transition-all hover:scale-110 shadow-2xl group active:scale-95 flex items-center justify-center border-4 border-transparent hover:border-white/20">
                                <Play fill="white" size={48} className="ml-2" />
                            </button>
                        </div>
                        <div className="absolute bottom-10 right-10 max-w-2xl text-right">
                            <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{anime.title}</h2>
                            <p className="text-white text-lg font-medium flex items-center gap-2 drop-shadow-md">
                                <PlayCircle size={20} className="text-primary"/> موسم {selectedSeason}: حلقة {displayEpisodeNum}
                            </p>
                        </div>
                    </>
                 )}
            </div>
            
            <div className="bg-[#18181b] p-4 flex flex-col items-center justify-between gap-4 border-b border-white/5 shadow-lg relative z-20">
                <div className="flex flex-wrap items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative group/server z-30">
                            <button className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 px-4 py-2 rounded text-sm font-bold text-white transition min-w-[160px] justify-between">
                                <div className="flex items-center gap-2">
                                    <Server size={16} className="text-gray-400"/>
                                    <span className="text-gray-200 uppercase">
                                        {activeServer === 'vidlink' ? 'سيرفر أساسي' : 
                                        activeServer === 'embedsu' ? 'سيرفر احتياطي 1' :
                                        activeServer === 'vidsrc' ? 'سيرفر احتياطي 2' :
                                        activeServer === 'vidsrc2' ? 'سيرفر احتياطي 3' :
                                        activeServer === 'superembed' ? 'سيرفر احتياطي 4' : 'سيرفر VIP'}
                                    </span>
                                </div>
                                <ChevronDown size={14} className="opacity-50"/>
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-56 bg-[#222] border border-white/10 rounded-lg shadow-xl overflow-hidden hidden group-hover/server:block animate-fade-in text-right">
                                <div className="p-2 space-y-1">
                                    <button onClick={() => { setActiveServer('vidlink'); setIsPlaying(true); }} className={`flex items-center justify-between w-full text-right px-3 py-2 text-sm rounded hover:bg-white/10 ${activeServer==='vidlink' ? 'text-primary' : 'text-gray-300'}`}>سيرفر أساسي (VidLink)</button>
                                    <button onClick={() => { setActiveServer('embedsu'); setIsPlaying(true); }} className={`flex items-center justify-between w-full text-right px-3 py-2 text-sm rounded hover:bg-white/10 ${activeServer==='embedsu' ? 'text-primary' : 'text-gray-300'}`}>سيرفر احتياطي 1 (EmbedSu)</button>
                                    <button onClick={() => { setActiveServer('vidsrc'); setIsPlaying(true); }} className={`flex items-center justify-between w-full text-right px-3 py-2 text-sm rounded hover:bg-white/10 ${activeServer==='vidsrc' ? 'text-primary' : 'text-gray-300'}`}>سيرفر احتياطي 2 (VidSrc)</button>
                                    <button onClick={() => { setActiveServer('vidsrc2'); setIsPlaying(true); }} className={`flex items-center justify-between w-full text-right px-3 py-2 text-sm rounded hover:bg-white/10 ${activeServer==='vidsrc2' ? 'text-primary' : 'text-gray-300'}`}>سيرفر احتياطي 3 (VidSrc2)</button>
                                    <button onClick={() => { setActiveServer('superembed'); setIsPlaying(true); }} className={`flex items-center justify-between w-full text-right px-3 py-2 text-sm rounded hover:bg-white/10 ${activeServer==='superembed' ? 'text-primary' : 'text-gray-300'}`}>سيرفر احتياطي 4 (Super)</button>
                                    <button onClick={() => { setActiveServer('private'); setIsPlaying(true); }} className={`flex items-center justify-between w-full text-right px-3 py-2 text-sm rounded hover:bg-white/10 ${activeServer==='private' ? 'text-primary' : 'text-gray-300'}`}>سيرفر VIP</button>
                                </div>
                            </div>
                        </div>

                        {isPlaying && activeServer !== 'private' && (
                             <a 
                                href={getEmbedUrl()} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded text-sm font-medium transition"
                                title="اضغط هنا إذا ظهر خطأ Sandbox أو لم يعمل الفيديو"
                             >
                                 <ExternalLink size={16} /> مشاهدة خارجية
                             </a>
                        )}
                        
                        <div className="hidden md:flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                            <AlertCircle size={12}/>
                            <span>يواجهك خطأ؟ جرب سيرفر آخر أو المشاهدة الخارجية</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {hasNextEpisode && (
                            <button 
                                onClick={handleNextEpisode}
                                className="flex items-center gap-2 bg-primary hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold transition shadow-lg hover:shadow-primary/30 active:scale-95"
                            >
                                الحلقة التالية <SkipForward size={18} fill="white" className="transform rotate-180"/>
                            </button>
                        )}
                        <button onClick={() => setCinemaMode(!cinemaMode)} className="p-2 bg-black/40 border border-white/10 rounded text-gray-400 hover:text-white" title="وضع السينما"><Lightbulb size={18} /></button>
                    </div>
                </div>
            </div>
          </div>
      </div>

      <AdBanner type="custom" adCode={BANNER_AD_CODE} height="90px" />

      <div className={`container mx-auto px-4 max-w-7xl py-8 transition-opacity duration-500 ${cinemaMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-4xl font-black text-white mb-3">{anime.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                        <div className="flex items-center gap-1 text-yellow-400"><Star fill="currentColor" size={16}/> <span className="text-white font-bold">{anime.rating}</span></div>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <div className="flex items-center gap-1"><Calendar size={16}/> {anime.releaseDate}</div>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <div className="border border-gray-600 px-2 rounded text-xs">HD</div>
                    </div>
                    
                    <div className="flex gap-4 flex-wrap">
                        <button onClick={toggleWatchlist} className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition font-medium border ${inWatchlist ? 'bg-black text-green-400 border-green-500' : 'bg-surface hover:bg-gray-800 text-white border-transparent'}`}>
                            {inWatchlist ? <Check size={18} /> : <Plus size={18} />} {inWatchlist ? 'موجود بالقائمة' : 'أضف لقائمتي'}
                        </button>
                        <button onClick={handleShare} className="flex items-center gap-2 bg-surface hover:bg-gray-800 text-white px-6 py-2.5 rounded-full transition font-medium active:scale-95">
                            <Share2 size={18} /> مشاركة
                        </button>
                    </div>
                </div>

                <AdBanner type="custom" adCode={BANNER_AD_CODE} height="90px" />

                <div className="bg-surface rounded-xl border border-white/5 overflow-hidden" ref={episodeListRef}>
                     <div className="flex border-b border-white/5">
                        <button 
                            onClick={() => setActiveSideTab('episodes')}
                            className={`flex-1 py-4 text-center font-bold text-sm transition ${activeSideTab === 'episodes' ? 'bg-white/10 text-white border-b-2 border-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className="flex items-center justify-center gap-2"><List size={18}/> الحلقات</div>
                        </button>
                        <button 
                            onClick={() => setActiveSideTab('relations')}
                            className={`flex-1 py-4 text-center font-bold text-sm transition ${activeSideTab === 'relations' ? 'bg-white/10 text-white border-b-2 border-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                             <div className="flex items-center justify-center gap-2"><Clapperboard size={18}/> صلة</div>
                        </button>
                     </div>

                     <div className="p-6">
                        {activeSideTab === 'episodes' && (
                            <>
                                <div className="flex flex-col mb-4 gap-4">
                                     <div className="flex items-center gap-3">
                                        {seasons.length > 1 && (
                                            <div className="relative group min-w-[120px]">
                                                <select 
                                                    value={selectedSeason}
                                                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                                    className="w-full appearance-none bg-black/40 border border-white/10 text-white py-2 px-4 rounded-lg focus:outline-none focus:border-primary cursor-pointer text-sm"
                                                >
                                                    {seasons.map(s => (
                                                        <option key={s.season_number} value={s.season_number}>{s.name} ({s.episode_count})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute left-2 top-2.5 text-gray-400 pointer-events-none" size={14}/>
                                            </div>
                                        )}
                                        <div className="relative group flex-1">
                                            <Search className="absolute right-3 top-2.5 text-gray-500" size={16}/>
                                            <input 
                                                type="text" 
                                                placeholder="بحث..." 
                                                value={episodeQuery}
                                                onChange={(e) => setEpisodeQuery(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-lg pr-10 pl-4 py-2 text-sm text-white focus:outline-none focus:border-primary w-full transition text-right"
                                            />
                                        </div>
                                     </div>
                                    
                                    {!episodeQuery && totalChunks > 1 && (
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {Array.from({ length: totalChunks }).map((_, idx) => {
                                                const start = idx * ITEMS_PER_CHUNK + 1;
                                                const end = Math.min((idx + 1) * ITEMS_PER_CHUNK, episodes.length);
                                                return (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => setSelectedChunk(idx)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedChunk === idx ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}
                                                    >
                                                        {start}-{end}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {displayEpisodes.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto custom-scroll pl-2">
                                        {displayEpisodes.map((ep, idx) => {
                                            // Determine active based on episode number similarity to display
                                            const active = getEpNumber(ep) === displayEpisodeNum;
                                            return (
                                            <div 
                                                key={ep.mal_id || idx} 
                                                onClick={() => { setCurrentEpisodeIndex(episodes.indexOf(ep)); setIsPlaying(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className={`flex gap-4 p-3 rounded-lg transition cursor-pointer group items-center border ${active ? 'bg-primary/10 border-primary/50' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                                            >
                                                <div className={`relative w-24 h-14 bg-surface rounded overflow-hidden flex-shrink-0 border ${active ? 'border-primary' : 'border-white/10'} group-hover:border-primary/50 transition`}>
                                                    <img src={ep.image || anime.image} className="w-full h-full object-cover opacity-60 blur-[1px] transition group-hover:opacity-80" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className={`text-lg font-black drop-shadow-lg tracking-wider ${active ? 'text-primary' : 'text-white'}`}>{ep.episode}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0 text-right">
                                                    <h4 className={`font-medium text-sm truncate ${active ? 'text-white' : 'text-gray-300 group-hover:text-white transition'}`}>
                                                        {(!ep.title || ep.title.includes('Episode')) ? `الحلقة ${ep.episode}` : ep.title}
                                                    </h4>
                                                </div>
                                                
                                                {active && <MonitorPlay size={18} className="text-primary"/>}
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500 text-sm"><AlertCircle size={32} className="mx-auto mb-2 opacity-50"/>لا توجد حلقات.</div>
                                )}
                            </>
                        )}
                        
                        {activeSideTab === 'relations' && (
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
                </div>

                <AdBanner type="custom" adCode={ADSTERRA_SIDEBAR_CODE} height="250px" />
            </div>
            
            <div className="space-y-6">
                 {/* Recommendations */}
                 <div className="bg-surface rounded-xl p-5 border border-white/5 sticky top-24">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                         <Star size={18} className="text-yellow-500" fill="currentColor"/> قد يعجبك أيضاً
                    </h3>
                    <div className="space-y-4">
                        {recommendations.slice(0, 8).map(rec => (
                            <Link to={`/anime/${rec.id}`} key={rec.id} className="flex gap-3 group hover:bg-white/5 p-2 rounded-lg transition">
                                <img src={rec.image} className="w-16 h-24 object-cover rounded shadow-lg group-hover:scale-105 transition-transform" alt={rec.title} />
                                <div>
                                    <h4 className="font-bold text-sm text-white group-hover:text-primary line-clamp-2 transition leading-tight mb-1">{rec.title}</h4>
                                    <div className="text-xs text-gray-500 mb-1">{rec.type} • {rec.releaseDate}</div>
                                    {rec.rating && rec.rating !== 'N/A' && (
                                        <div className="text-xs text-yellow-500 flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded w-fit"><Star size={10} fill="currentColor"/> {rec.rating}</div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};