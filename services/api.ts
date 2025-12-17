import { Anime, Comment, User, UserRole, HistoryItem, Episode, NewsItem, Notification, Character, Relation } from '../types';

// === TMDB CONFIGURATION ===
const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const LANGUAGE = 'ar-SA'; 

// --- LOCAL STORAGE KEYS ---
const STORAGE_KEYS = {
    USERS: 'animewatcher_users',
    CURRENT_SESSION: 'animewatcher_session',
    WATCHLIST: 'animewatcher_watchlist',
    HISTORY: 'animewatcher_history',
    COMMENTS: 'animewatcher_comments',
    LIKES: 'animewatcher_likes',
    LIKE_COUNTS: 'animewatcher_like_counts',
    NOTIFICATIONS: 'animewatcher_notifications' // Added key
};

const GUEST_ID = 'guest_user';

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const safeParse = <T>(json: string | null, fallback: T): T => {
    if (!json) return fallback;
    try {
        return JSON.parse(json);
    } catch (e) {
        return fallback;
    }
};

// --- MOCK ARABIC DATA (Expanded to 10 items) ---
const MOCK_ARABIC_ANIME: Anime[] = [
  { id: '1429', title: 'هجوم العمالقة', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/hTP1DtLGFamjfu8WqjnuQdPuy61.jpg', cover: 'https://image.tmdb.org/t/p/original/aD8ruDZci88vQKSKAgFfS4d156N.jpg', description: 'قبل مئات السنين، شارف البشر على الفناء من قبل العمالقة...', rating: 9.1, genres: ['أكشن', 'خيال', 'دراما'], releaseDate: '2013', type: 'TV', status: 'منتهي', likes: 1205 },
  { id: '37854', title: 'ون بيس', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/fcXdJlbSdUEeMSJFsXKsznGwwok.jpg', cover: 'https://image.tmdb.org/t/p/original/acIGnIwIpSo26gHUPFRz8ARzdGx.jpg', description: 'يتبع مغامرات مونكي دي لوفي وطاقم القراصنة لاستكشاف المحيط...', rating: 9.5, genres: ['أكشن', 'مغامرة'], releaseDate: '1999', type: 'TV', status: 'مستمر', likes: 9000 },
  { id: '95479', title: 'جوجوتسو كايسن', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/fJV1a98295962b322307567636.jpg', cover: 'https://image.tmdb.org/t/p/original/eNp1FHzEW33jQLXh9p723Jt825w.jpg', description: 'يتورط يوجي إيتادوري في عالم السحر والشياطين بعد ابتلاع إصبع ملعون...', rating: 8.8, genres: ['أكشن', 'خارق للطبيعة'], releaseDate: '2020', type: 'TV', status: 'مستمر', likes: 5000 },
  { id: '85937', title: 'قاتل الشياطين', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/xUfRZu2mi8jH6SzQEYdB96kBh4q.jpg', cover: 'https://image.tmdb.org/t/p/original/nTvM4mhqNlHIvUkI1gVnW6XP7GG.jpg', description: 'بعد مقتل عائلته وتحول أخته إلى شيطان، يبدأ تانجيرو رحلته...', rating: 8.9, genres: ['أكشن', 'خيال'], releaseDate: '2019', type: 'TV', status: 'مستمر', likes: 6500 },
  { id: '46260', title: 'ناروتو شيبودن', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/zAYRe2bJxpWTVrwwmBc00VFkAf4.jpg', cover: 'https://image.tmdb.org/t/p/original/41e23737522513233633644.jpg', description: 'يواصل ناروتو تدريبه ويواجه منظمة الأكاتسكي...', rating: 8.7, genres: ['أكشن', 'مغامرة'], releaseDate: '2007', type: 'TV', status: 'منتهي', likes: 8000 },
  { id: '80564', title: 'بليتش: حرب الألف سنة', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg', cover: 'https://image.tmdb.org/t/p/original/5g8yDdfu695576555.jpg', description: 'يعود إيتشيغو كوروساكي للمعركة الأخيرة ضد الكوينسي...', rating: 9.0, genres: ['أكشن', 'خارق للطبيعة'], releaseDate: '2022', type: 'TV', status: 'مستمر', likes: 4200 },
  { id: '31911', title: 'فول ميتال ألكيميست', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/5WEuoOLjwx35DwhfTlAeDeqIsvk.jpg', cover: 'https://image.tmdb.org/t/p/original/9r5556666.jpg', description: 'أخوان يبحثان عن حجر الفلاسفة لاستعادة أجسادهم...', rating: 9.2, genres: ['مغامرة', 'خيال'], releaseDate: '2009', type: 'TV', status: 'منتهي', likes: 3000 },
  { id: '60572', title: 'بلاك كلوفر', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2y4F2523523523.jpg', cover: 'https://image.tmdb.org/t/p/original/eNp1FHzEW33jQLXh9p723Jt825w.jpg', description: 'أستا ويونو، يتيمان يسعيان ليصبح أحدهما إمبراطور السحر...', rating: 8.5, genres: ['أكشن', 'سحر'], releaseDate: '2017', type: 'TV', status: 'منتهي', likes: 3500 },
  { id: '65930', title: 'بوكو نو هيرو', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/phuYyq43434.jpg', cover: 'https://image.tmdb.org/t/p/original/41e23737522513233633644.jpg', description: 'في عالم يمتلك فيه الجميع قدرات خارقة، يولد ديكو بلا قدرة...', rating: 8.3, genres: ['أكشن', 'مدرسة'], releaseDate: '2016', type: 'TV', status: 'مستمر', likes: 4100 },
  { id: '136', title: 'هنتر × هنتر', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/uc955555.jpg', cover: 'https://image.tmdb.org/t/p/original/9r5556666.jpg', description: 'غون يسعى ليصبح صياداً محترفاً ويعثر على والده...', rating: 9.3, genres: ['مغامرة', 'خيال'], releaseDate: '2011', type: 'TV', status: 'منتهي', likes: 7000 }
];

// --- API HELPERS ---
const fetchTMDB = async (endpoint: string, params: string = '') => {
    try {
        const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=${LANGUAGE}${params}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn("API Fetch Failed, using mock.", e);
        return null;
    }
};

const mapTMDBToAnime = (item: any): Anime => {
    if(!item) return MOCK_ARABIC_ANIME[0];
    
    let status = 'منتهي';
    if (item.in_production || (item.last_air_date && new Date(item.last_air_date) > new Date())) {
        status = 'مستمر';
    }

    // Improve Arabic Description Fallback
    let description = item.overview;
    if (!description && item.original_language === 'ja') {
        description = "لا يتوفر وصف باللغة العربية لهذا العمل حالياً، ولكن يمكنك الاستمتاع بالمشاهدة.";
    }

    return {
        id: item.id?.toString(),
        title: item.name || item.title || item.original_name,
        image: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450',
        cover: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : (item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null),
        description: description,
        rating: item.vote_average ? Number(item.vote_average).toFixed(1) : 'N/A',
        releaseDate: item.first_air_date || item.release_date,
        genres: item.genres?.map((g: any) => g.name) || ['انمي'],
        totalEpisodes: item.number_of_episodes,
        type: item.media_type === 'movie' ? 'فيلم' : 'مسلسل',
        status: status,
        rank: item.popularity,
        popularity: item.popularity,
        members: item.vote_count,
        likes: 0,
        // Detailed fields
        studios: item.production_companies?.map((c:any) => c.name) || [],
        duration: item.episode_run_time?.[0] ? `${item.episode_run_time[0]} دقيقة` : '24 دقيقة',
        season: 'غير محدد', // Can be refined
        title_japanese: item.original_name
    };
};

// --- DATA FETCHING FUNCTIONS ---

export const fetchTopAiring = async (): Promise<Anime[]> => {
    // Attempt to fetch 2 pages to ensure we get at least 10 Anime after filtering non-JP shows
    const [page1, page2] = await Promise.all([
        fetchTMDB('/trending/tv/day', '&page=1'),
        fetchTMDB('/trending/tv/day', '&page=2')
    ]);

    if (!page1 && !page2) return MOCK_ARABIC_ANIME;

    let results = [];
    if (page1?.results) results.push(...page1.results);
    if (page2?.results) results.push(...page2.results);

    // Filter strictly for Anime (Japan Origin OR Animation Genre)
    const anime = results.filter((s: any) => 
        (s.origin_country?.includes('JP') && s.genre_ids?.includes(16)) || 
        s.original_language === 'ja'
    );

    // Remove duplicates
    const uniqueAnime = Array.from(new Map(anime.map((item:any) => [item.id, item])).values());

    if (uniqueAnime.length < 5) return MOCK_ARABIC_ANIME;

    return uniqueAnime.slice(0, 20).map(mapTMDBToAnime);
};

export const fetchSeasonNow = async (): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/on_the_air', '&sort_by=popularity.desc&page=1');
    if (!data) return MOCK_ARABIC_ANIME;
    
    // Fetch page 2 as well to fill gaps
    const page2 = await fetchTMDB('/tv/on_the_air', '&sort_by=popularity.desc&page=2');
    
    let allResults = [...data.results];
    if (page2?.results) allResults = [...allResults, ...page2.results];

    const anime = allResults.filter((s: any) => s.origin_country?.includes('JP'));
    
    return anime.slice(0, 20).map(mapTMDBToAnime);
}

export const fetchTopUpcoming = async (): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/popular', '&page=3'); 
    if (!data) return MOCK_ARABIC_ANIME;
    return data.results.filter((s: any) => s.origin_country?.includes('JP')).map(mapTMDBToAnime);
}

export const fetchTopMovies = async (): Promise<Anime[]> => {
    const data = await fetchTMDB('/discover/movie', '&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=1');
    const page2 = await fetchTMDB('/discover/movie', '&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=2');
    
    if (!data) return MOCK_ARABIC_ANIME;
    
    let results = [...data.results];
    if (page2?.results) results = [...results, ...page2.results];

    const movies = results.map((m: any) => ({ ...mapTMDBToAnime(m), type: 'فيلم' }));
    return movies;
}

export const fetchByGenre = async (genreId: number): Promise<Anime[]> => {
    const data = await fetchTMDB('/discover/tv', `&with_genres=16,${genreId}&with_original_language=ja&sort_by=popularity.desc`);
    if (!data) return [];
    return data.results.map(mapTMDBToAnime);
}

export const fetchRecentAnime = async (page: number = 1): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/airing_today', `&page=${page}`);
    if (!data) return MOCK_ARABIC_ANIME;
    const anime = data.results.filter((s: any) => s.origin_country?.includes('JP'));
    return anime.map(mapTMDBToAnime);
}

// Fetch Arabic Community Top Rated (Simulated)
export const fetchArabTopRated = async (page: number = 1): Promise<Anime[]> => {
    // We fetch top rated but sort/filter to prioritize popular action/shonen which is popular in Arab world
    const data = await fetchTMDB('/discover/tv', `&with_genres=16&with_original_language=ja&sort_by=vote_count.desc&page=${page}`);
    if (!data) return MOCK_ARABIC_ANIME;
    return data.results.map(mapTMDBToAnime);
}

export const fetchTopRated = async (page: number = 1): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/top_rated', `&page=${page}&with_original_language=ja`);
    if (!data) return MOCK_ARABIC_ANIME;
    return data.results.map(mapTMDBToAnime);
}

export const fetchAnimeDetails = async (id: string): Promise<Anime> => {
    const data = await fetchTMDB(`/tv/${id}`);
    if (!data) {
        const movieData = await fetchTMDB(`/movie/${id}`);
        if(movieData) return { ...mapTMDBToAnime(movieData), type: 'فيلم' };
        return MOCK_ARABIC_ANIME[0];
    }
    
    // Get studios
    const anime = mapTMDBToAnime(data);
    const likeCounts = safeParse<Record<string, number>>(localStorage.getItem(STORAGE_KEYS.LIKE_COUNTS), {});
    anime.likes = likeCounts[id] || 0;
    
    return anime;
}

export const searchAnime = async (query: string): Promise<Anime[]> => {
    const data = await fetchTMDB('/search/multi', `&query=${encodeURIComponent(query)}`);
    if (!data) return [];
    
    return data.results
        .filter((i: any) => i.media_type !== 'person' && (i.genre_ids?.includes(16) || i.origin_country?.includes('JP')))
        .map(mapTMDBToAnime);
}

export interface SeasonInfo {
    season_number: number;
    name: string;
    episode_count: number;
}

// Fetch episodes with Season support
export const fetchAnimeEpisodes = async (id: string, seasonNumber: number = 1): Promise<Episode[]> => {
    // Check if movie first (usually doesn't have seasons endpoint same way)
    // But assuming ID passed is TV ID.
    
    const data = await fetchTMDB(`/tv/${id}/season/${seasonNumber}`);
    
    if (!data || !data.episodes) {
        // Fallback or empty
        return [];
    }
    
    return data.episodes.map((ep: any) => ({
        mal_id: ep.id,
        title: ep.name || `الحلقة ${ep.episode_number}`,
        episode: ep.episode_number,
        season: seasonNumber, // Store season number
        aired: ep.air_date,
        score: ep.vote_average,
        filler: false, 
        recap: false,
        image: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : null,
        forum_url: ''
    }));
}

// Get all seasons metadata
export const fetchAnimeSeasons = async (id: string): Promise<SeasonInfo[]> => {
    const data = await fetchTMDB(`/tv/${id}`);
    if (!data || !data.seasons) return [];
    
    return data.seasons.map((s: any) => ({
        season_number: s.season_number,
        name: s.name,
        episode_count: s.episode_count
    })).filter((s: any) => s.season_number > 0); // Exclude "Specials" (Season 0) if desired, usually kept though.
}

export const fetchAnimeRecommendations = async (id: string): Promise<Anime[]> => {
    const data = await fetchTMDB(`/tv/${id}/recommendations`);
    if (!data) return [];
    return data.results.slice(0, 10).map(mapTMDBToAnime);
}

export const fetchAnimeNews = async (): Promise<NewsItem[]> => {
    // Mock
    return [
        {
            mal_id: 1,
            url: '#',
            title: 'الإعلان عن الموسم الرابع من قاتل الشياطين',
            date: new Date().toISOString(),
            author_username: 'Admin',
            images: { jpg: { image_url: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/xUfRZu2mi8jH6SzQEYdB96kBh4q.jpg' } },
            excerpt: 'أرك تدريب الهاشيرا قادم قريباً، ويعد بمعارك حماسية وتطور كبير في الشخصيات استعداداً للمعركة النهائية.'
        },
        {
            mal_id: 2,
            url: '#',
            title: 'ون بيس يكسر الأرقام القياسية مع الجير الخامس',
            date: new Date(Date.now() - 86400000).toISOString(),
            author_username: 'OtakuNews',
            images: { jpg: { image_url: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/fcXdJlbSdUEeMSJFsXKsznGwwok.jpg' } },
            excerpt: 'حلقة لوفي بالجير 5 تحطم سيرفرات المشاهدة حول العالم وملايين المتابعين يشهدون محارب التحرير.'
        },
    ];
};

export const fetchAnimeRelations = async (id: string): Promise<Relation[]> => {
    const data = await fetchTMDB(`/tv/${id}/recommendations`);
    if (!data || !data.results) return [];

    const recommendations = data.results.slice(0, 5).map((item: any) => ({
        mal_id: item.id,
        type: 'anime',
        name: item.name || item.title || item.original_name,
        url: `/anime/${item.id}`
    }));

    if (recommendations.length === 0) return [];

    return [
        {
            relation: 'أعمال مشابهة',
            entry: recommendations
        }
    ];
};

export const fetchAnimeCharacters = async (id: string): Promise<Character[]> => {
    const data = await fetchTMDB(`/tv/${id}/credits`);
    
    let cast = data?.cast;
    if (!cast || cast.length === 0) {
         const movieData = await fetchTMDB(`/movie/${id}/credits`);
         cast = movieData?.cast;
    }

    if (!cast) return [];

    return cast.slice(0, 12).map((actor: any) => ({
        mal_id: actor.id,
        name: actor.character || 'دور غير معروف',
        image: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/150',
        role: actor.order < 3 ? 'رئيسي' : 'داعم',
        voice_actor: {
            name: actor.name || actor.original_name,
            image: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/150',
            language: 'Japanese' 
        }
    }));
};

// ... (Storage services remain same)
export const likeService = {
    toggleLike: async (animeId: string, userId: string): Promise<{liked: boolean, count: number}> => {
        const userLikes = safeParse<Record<string, string[]>>(localStorage.getItem(STORAGE_KEYS.LIKES), {});
        const likeCounts = safeParse<Record<string, number>>(localStorage.getItem(STORAGE_KEYS.LIKE_COUNTS), {});
        
        const myLikes = userLikes[userId] || [];
        const isLiked = myLikes.includes(animeId);
        
        let newCount = likeCounts[animeId] || 0;

        if (isLiked) {
            userLikes[userId] = myLikes.filter(id => id !== animeId);
            newCount = Math.max(0, newCount - 1);
        } else {
            userLikes[userId] = [...myLikes, animeId];
            newCount += 1;
        }
        
        likeCounts[animeId] = newCount;

        localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(userLikes));
        localStorage.setItem(STORAGE_KEYS.LIKE_COUNTS, JSON.stringify(likeCounts));

        return { liked: !isLiked, count: newCount };
    },
    isLiked: async (animeId: string, userId: string): Promise<boolean> => {
        if (!userId) return false;
        const userLikes = safeParse<Record<string, string[]>>(localStorage.getItem(STORAGE_KEYS.LIKES), {});
        return (userLikes[userId] || []).includes(animeId);
    },
    getLikeCount: async (animeId: string): Promise<number> => {
        const likeCounts = safeParse<Record<string, number>>(localStorage.getItem(STORAGE_KEYS.LIKE_COUNTS), {});
        return likeCounts[animeId] || 0;
    }
}

export const historyService = {
    addToHistory: async (anime: Anime, userId: string, episodeNum: number = 1) => {
        if(!userId) return;
        const allHistory = safeParse<Record<string, HistoryItem[]>>(localStorage.getItem(STORAGE_KEYS.HISTORY), {});
        let userHistory = allHistory[userId] || [];
        userHistory = userHistory.filter(h => h.anime.id !== anime.id);
        const total = anime.totalEpisodes || 12;
        const progress = Math.min(100, Math.round((episodeNum / total) * 100));

        userHistory.unshift({
            anime,
            lastEpisode: episodeNum,
            progress,
            watchedAt: new Date().toISOString()
        });

        allHistory[userId] = userHistory.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(allHistory));
    },
    getHistory: async (userId: string): Promise<HistoryItem[]> => {
        if(!userId) return [];
        const allHistory = safeParse<Record<string, HistoryItem[]>>(localStorage.getItem(STORAGE_KEYS.HISTORY), {});
        return allHistory[userId] || [];
    },
    getStats: async (userId: string) => {
        if(!userId) return { totalWatched: 0, topGenre: 'لا يوجد', totalHours: 0, history: [] };
        
        const history = await historyService.getHistory(userId);
        const totalWatched = history.length;
        
        const genreCounts: Record<string, number> = {};
        let totalEpSum = 0;

        history.forEach(h => {
            h.anime.genres?.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
            totalEpSum += (h.lastEpisode || 1);
        });

        let topGenre = 'غير محدد';
        let maxCount = 0;
        Object.entries(genreCounts).forEach(([genre, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topGenre = genre;
            }
        });
        
        const totalHours = Math.round((totalEpSum * 24) / 60);
        return { totalWatched, topGenre, totalHours, history };
    }
}

export const watchlistService = {
    addToWatchlist: async (anime: Anime, userId?: string) => {
        const id = userId || GUEST_ID;
        const allWatchlists = safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {});
        const userList = allWatchlists[id] || [];
        if (!userList.find(a => a.id === anime.id)) {
            userList.push(anime);
            allWatchlists[id] = userList;
            localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(allWatchlists));
        }
    },
    removeFromWatchlist: async (animeId: string, userId?: string) => {
        const id = userId || GUEST_ID;
        const allWatchlists = safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {});
        let userList = allWatchlists[id] || [];
        userList = userList.filter(a => a.id !== animeId);
        allWatchlists[id] = userList;
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(allWatchlists));
    },
    getWatchlist: async (userId?: string): Promise<Anime[]> => {
        const id = userId || GUEST_ID;
        const allWatchlists = safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {});
        return allWatchlists[id] || [];
    },
    getWatchlistIds: async (userId?: string): Promise<string[]> => {
        const id = userId || GUEST_ID;
        const allWatchlists = safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {});
        return (allWatchlists[id] || []).map(a => a.id);
    }
}

export const authService = {
  login: async (email: string, pass: string): Promise<User> => {
    await sleep(500);
    const users = safeParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
    const user = users.find(u => u.email === email && (u as any).password === pass);
    if (user) {
        const { password, ...safeUser } = user as any;
        return safeUser;
    }
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  },
  
  signup: async (email: string, username: string, pass: string): Promise<User> => {
      await sleep(500);
      const users = safeParse<any[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
      if (users.find(u => u.email === email)) {
          throw new Error('البريد الإلكتروني مسجل بالفعل');
      }
      const newUser = {
          id: crypto.randomUUID(),
          email,
          username,
          password: pass, 
          role: UserRole.USER,
          created_at: new Date().toISOString(),
          avatar: `https://ui-avatars.com/api/?name=${username}&background=E50914&color=fff`
      };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      const { password, ...safeUser } = newUser;
      return safeUser;
  },

  updateProfile: async (user: User): Promise<User> => {
      const users = safeParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
      const updatedUsers = users.map(u => u.id === user.id ? { ...u, ...user } : u);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      const currentSession = safeParse<User>(localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION), null);
      if (currentSession && currentSession.id === user.id) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user));
      }
      return user;
  }
};

export const commentService = {
  getComments: async (animeId: string): Promise<Comment[]> => {
    const allComments = safeParse<Record<string, Comment[]>>(localStorage.getItem(STORAGE_KEYS.COMMENTS), {});
    return allComments[animeId] || [];
  },
  addComment: async (animeId: string, content: string, user: User): Promise<Comment> => {
    const allComments = safeParse<Record<string, Comment[]>>(localStorage.getItem(STORAGE_KEYS.COMMENTS), {});
    const animeComments = allComments[animeId] || [];
    
    const newComment: Comment = {
        id: crypto.randomUUID(),
        user_id: user.id,
        username: user.username,
        user_avatar: user.avatar || '',
        content,
        anime_id: animeId,
        created_at: new Date().toISOString(),
        likes: 0
    };
    
    animeComments.unshift(newComment);
    allComments[animeId] = animeComments;
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
    return newComment;
  }
};

export const notificationService = {
    // Save stored notifications
    getStoredNotifications: (): Notification[] => {
        return safeParse<Notification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []);
    },

    saveNotification: (notification: Notification) => {
        const current = safeParse<Notification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []);
        // Prevent dupes by ID or very recent message
        if (current.some(n => n.message === notification.message && Date.now() - (n.timestamp || 0) < 60000)) {
            return;
        }
        const updated = [notification, ...current].slice(0, 50); // Keep last 50
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    },

    markAsRead: () => {
        // Just flag them or clear count in UI state. 
        // For simplicity, we assume viewing the dropdown marks as seen.
        const current = safeParse<Notification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []);
        const updated = current.map(n => ({...n, read: true}));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    },
    
    // Simulate finding a random anime to notify about
    getSimulatedUpdate: async (): Promise<Notification | null> => {
        try {
             // Randomly pick a trending or airing show
             const data = Math.random() > 0.5 
                ? await fetchTMDB('/trending/tv/day') 
                : await fetchTMDB('/tv/on_the_air');
                
             if (!data || !data.results || data.results.length === 0) return null;
             
             const randomAnime = data.results[Math.floor(Math.random() * data.results.length)];
             const anime = mapTMDBToAnime(randomAnime);

             const messages = [
                 `حلقة جديدة متوفرة: ${anime.title}`,
                 `${anime.title} يتصدر الترند الآن!`,
                 `تم إضافة موسم جديد لـ ${anime.title}`,
                 `شاهد الآن الحلقة الأسبوعية من ${anime.title}`
             ];

             return {
                 id: crypto.randomUUID(),
                 type: 'update',
                 title: 'تحديث جديد',
                 message: messages[Math.floor(Math.random() * messages.length)],
                 link: `/watch/${anime.id}`,
                 timestamp: Date.now(),
                 read: false
             };
        } catch (e) {
            return null;
        }
    },

    checkForUpdates: async (userId: string): Promise<Notification[]> => {
        // Keeps the existing logic for specific user updates but returns empty 
        // since we are using the simulation primarily for this demo.
        return []; 
    }
}