import React, { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { Row } from '../components/Row';
import { TopTenRow } from '../components/TopTenRow';
import { AdBanner } from '../components/AdBanner';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { 
    fetchTopAiring, 
    fetchSeasonNow, 
    fetchTopMovies, 
    fetchTopUpcoming, 
    fetchByGenre, 
    historyService,
    sleep
} from '../services/api';
import { Anime, HistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { PlayCircle, Zap, Calendar, Film, Heart, Sparkles, TrendingUp, Laugh, Brain, Rocket } from 'lucide-react';

export const Home = () => {
  const [heroData, setHeroData] = useState<Anime[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [content, setContent] = useState<{
      topTen: Anime[],
      seasonal: Anime[],
      movies: Anime[],
      upcoming: Anime[],
      action: Anime[],
      adventure: Anime[],
      romance: Anime[],
      fantasy: Anime[],
      comedy: Anime[],
      scifi: Anime[],
      psychological: Anime[],
  }>({
      topTen: [], seasonal: [], movies: [], upcoming: [], action: [], adventure: [], romance: [], fantasy: [], comedy: [], scifi: [], psychological: []
  });

  const [loadingPhase, setLoadingPhase] = useState<'init' | 'hero_loaded' | 'secondary_loaded' | 'all_loaded'>('init');
  const [activeCategory, setActiveCategory] = useState('الكل');
  
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchPhaseOne = async () => {
        try {
            const topData = await fetchTopAiring();
            
            if (isMounted) {
                const shuffledHero = [...topData].slice(0, 5).sort(() => 0.5 - Math.random());
                setHeroData(shuffledHero);
                setContent(prev => ({ ...prev, topTen: topData }));
                setLoadingPhase('hero_loaded');
            }

            if (user) {
                const historyData = await historyService.getHistory(user.id);
                if (isMounted) setHistory(historyData);
            }

            await sleep(300);
            const [seasonData, movieData] = await Promise.all([
                fetchSeasonNow(),
                fetchTopMovies()
            ]);

            if (isMounted) {
                setContent(prev => ({ ...prev, seasonal: seasonData, movies: movieData }));
                setLoadingPhase('secondary_loaded');
            }

            await sleep(600);
            const [upcomingData, actionData] = await Promise.all([
                fetchTopUpcoming(),
                fetchByGenre(10759), // Action & Adventure in TMDB
            ]);
            
            if (isMounted) {
                 setContent(prev => ({ ...prev, upcoming: upcomingData, action: actionData }));
            }

            await sleep(600);
            // TMDB Genres: Comedy(35), SciFi(10765), Animation(16)
            const [romanceData, fantasyData] = await Promise.all([
                fetchByGenre(18), // Drama as Romance proxy for demo
                fetchByGenre(10765)  // SciFi & Fantasy
            ]);

            if (isMounted) {
                setContent(prev => ({ ...prev, romance: romanceData, fantasy: fantasyData }));
                setContent(prev => ({ ...prev, scifi: fantasyData })); // Reuse for demo
                setLoadingPhase('all_loaded');
            }

        } catch (error) {
            console.error("Home data fetch error", error);
            if(isMounted && loadingPhase === 'init') setLoadingPhase('hero_loaded');
        }
    };

    fetchPhaseOne();

    return () => { isMounted = false; };
  }, [user]);

  const CategoryPill = ({ name, icon: Icon }: { name: string, icon: any }) => (
      <button 
        onClick={() => setActiveCategory(name)}
        className={`
            flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border flex-shrink-0
            ${activeCategory === name 
                ? 'bg-white text-black border-white scale-105 shadow-lg' 
                : 'bg-zinc-800/60 backdrop-blur-md text-gray-300 border-white/10 hover:border-white hover:bg-zinc-800 hover:text-white'}
        `}
      >
          {Icon && <Icon size={16} />}
          {name}
      </button>
  );

  // 728x90 Banner Code
  const AD_CODE = `
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

  if (loadingPhase === 'init') return <HomeSkeleton />;

  return (
    <div className="bg-background min-h-screen pb-20 overflow-x-hidden" dir="rtl">
      
      <Hero items={heroData} />
      
      <div className="relative z-30 -mt-12 md:-mt-16 px-4 md:px-12 mb-8 bg-gradient-to-b from-transparent to-[#0a0a0a] pb-4 pt-12">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
              <CategoryPill name="الكل" icon={PlayCircle} />
              <CategoryPill name="أفلام" icon={Film} />
              <CategoryPill name="رائج الآن" icon={TrendingUp} />
              <CategoryPill name="الموسم الحالي" icon={Sparkles} />
              <CategoryPill name="أكشن" icon={Zap} />
              <CategoryPill name="رومانسي" icon={Heart} />
              <CategoryPill name="كوميديا" icon={Laugh} />
              <CategoryPill name="خيال علمي" icon={Rocket} />
          </div>
      </div>

      <div className="relative z-20 space-y-4 md:space-y-8">
        
        {history.length > 0 && (activeCategory === 'الكل') && (
            <div className="animate-slide-up">
                 <Row title="تابع المشاهدة" items={history} isHistory={true} />
                 <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </div>
        )}

        {(activeCategory === 'الكل' || activeCategory === 'رائج الآن') && (
            <div className="animate-slide-up">
                <TopTenRow items={content.topTen} />
                <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </div>
        )}

        {(activeCategory === 'الكل' || activeCategory === 'الموسم الحالي') && (
            <>
                <Row title="الأكثر شعبية هذا الموسم" items={content.seasonal} />
                <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </>
        )}
        
        {(activeCategory === 'الكل' || activeCategory === 'أكشن') && content.action.length > 0 && (
            <>
             <Row title="إثارة وأكشن" items={content.action} />
             <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </>
        )}

        {(activeCategory === 'الكل' || activeCategory === 'أفلام') && content.movies.length > 0 && (
            <>
             <Row title="أفلام الانمي" items={content.movies} />
             <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </>
        )}
        
        {(activeCategory === 'الكل' || activeCategory === 'رائج الآن') && content.upcoming.length > 0 && (
            <>
                <Row title="قادمة قريباً" items={content.upcoming} />
                <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </>
        )}

        {(activeCategory === 'الكل' || activeCategory === 'خيال علمي') && content.scifi.length > 0 && (
            <>
                <Row title="خيال علمي ومستقبل" items={content.scifi} />
                <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </>
        )}

        {(activeCategory === 'الكل' || activeCategory === 'رومانسي') && content.romance.length > 0 && (
            <>
                <Row title="رومانسية ودراما" items={content.romance} />
                <AdBanner type="custom" adCode={AD_CODE} height="90px" />
            </>
        )}
        
        {content.fantasy.length > 0 && (
             <div className="my-12 relative h-[450px] w-full bg-zinc-900 border-y border-white/5 flex flex-col md:flex-row items-center overflow-hidden group cursor-pointer">
                 <div className="absolute inset-0">
                     <img src={content.fantasy[0].cover || content.fantasy[0].image} className="w-full h-full object-cover opacity-30 blur-2xl scale-125" />
                     <div className="absolute inset-0 bg-black/40"></div>
                 </div>
                 
                 <div className="relative z-10 w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center h-full text-right">
                     <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4 flex items-center gap-2">
                        <Sparkles size={14} /> اختيار المحرر
                     </span>
                     <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                         {content.fantasy[0].title}
                     </h2>
                     <p className="text-gray-300 line-clamp-3 mb-8 text-lg font-light">
                         {content.fantasy[0].description}
                     </p>
                     <button className="bg-white text-black px-10 py-4 rounded-lg font-bold hover:bg-gray-200 w-fit transition shadow-xl">
                         شاهد الآن
                     </button>
                 </div>
                 
                 <div className="relative z-10 w-full md:w-1/2 h-full flex items-center justify-center p-8 md:pr-16">
                     <img 
                        src={content.fantasy[0].image} 
                        className="h-[90%] object-contain rounded-lg shadow-2xl transform group-hover:scale-105 transition duration-700 -rotate-2 group-hover:rotate-0"
                        alt="Featured"
                    />
                 </div>
             </div>
        )}
        
        <AdBanner type="custom" adCode={AD_CODE} height="90px" />
      </div>
    </div>
  );
};