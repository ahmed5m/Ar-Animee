
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
    NOTIFICATIONS: 'animewatcher_notifications'
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

// --- MOCK ARABIC DATA ---
const MOCK_ARABIC_ANIME: Anime[] = [
  { id: '1429', title: 'هجوم العمالقة', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/hTP1DtLGFamjfu8WqjnuQdPuy61.jpg', cover: 'https://image.tmdb.org/t/p/original/aD8ruDZci88vQKSKAgFfS4d156N.jpg', description: 'قبل مئات السنين، شارف البشر على الفناء من قبل العمالقة...', rating: 9.1, genres: ['أكشن', 'خيال', 'دراما'], releaseDate: '2013', type: 'TV', status: 'منتهي', likes: 1205 },
  { id: '37854', title: 'ون بيس', image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/fcXdJlbSdUEeMSJFsXKsznGwwok.jpg', cover: 'https://image.tmdb.org/t/p/original/acIGnIwIpSo26gHUPFRz8ARzdGx.jpg', description: 'يتبع مغامرات مونكي دي لوفي وطاقم القراصنة لاستكشاف المحيط...', rating: 9.5, genres: ['أكشن', 'مغامرة'], releaseDate: '1999', type: 'TV', status: 'مستمر', likes: 9000 }
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
        studios: item.production_companies?.map((c:any) => c.name) || [],
        duration: item.episode_run_time?.[0] ? `${item.episode_run_time[0]} دقيقة` : '24 دقيقة',
        season: 'غير محدد',
        title_japanese: item.original_name
    };
};

export const fetchTopAiring = async (): Promise<Anime[]> => {
    const [page1, page2] = await Promise.all([
        fetchTMDB('/trending/tv/day', '&page=1'),
        fetchTMDB('/trending/tv/day', '&page=2')
    ]);
    if (!page1 && !page2) return MOCK_ARABIC_ANIME;
    let results = [];
    if (page1?.results) results.push(...page1.results);
    if (page2?.results) results.push(...page2.results);
    const anime = results.filter((s: any) => (s.origin_country?.includes('JP') && s.genre_ids?.includes(16)) || s.original_language === 'ja');
    const uniqueAnime = Array.from(new Map(anime.map((item:any) => [item.id, item])).values());
    return uniqueAnime.slice(0, 20).map(mapTMDBToAnime);
};

export const fetchSeasonNow = async (): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/on_the_air', '&sort_by=popularity.desc&page=1');
    if (!data) return MOCK_ARABIC_ANIME;
    const anime = data.results.filter((s: any) => s.origin_country?.includes('JP'));
    return anime.slice(0, 20).map(mapTMDBToAnime);
}

// Fixed missing fetchTopUpcoming export
export const fetchTopUpcoming = async (): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/on_the_air', '&page=2');
    if (!data) return MOCK_ARABIC_ANIME;
    const anime = data.results.filter((s: any) => s.origin_country?.includes('JP'));
    return anime.slice(0, 20).map(mapTMDBToAnime);
}

export const fetchTopMovies = async (): Promise<Anime[]> => {
    const data = await fetchTMDB('/discover/movie', '&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=1');
    if (!data) return MOCK_ARABIC_ANIME;
    return data.results.map((m: any) => ({ ...mapTMDBToAnime(m), type: 'فيلم' }));
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

export const fetchTopRated = async (page: number = 1): Promise<Anime[]> => {
    const data = await fetchTMDB('/tv/top_rated', `&page=${page}&with_original_language=ja`);
    if (!data) return MOCK_ARABIC_ANIME;
    return data.results.map(mapTMDBToAnime);
}

export const fetchArabTopRated = async (page: number = 1): Promise<Anime[]> => {
    const data = await fetchTMDB('/discover/tv', `&with_genres=16&with_original_language=ja&sort_by=vote_count.desc&page=${page}`);
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
    const anime = mapTMDBToAnime(data);
    const likeCounts = safeParse<Record<string, number>>(localStorage.getItem(STORAGE_KEYS.LIKE_COUNTS), {});
    anime.likes = likeCounts[id] || 0;
    return anime;
}

export const searchAnime = async (query: string): Promise<Anime[]> => {
    const data = await fetchTMDB('/search/multi', `&query=${encodeURIComponent(query)}`);
    if (!data) return [];
    return data.results.filter((i: any) => i.media_type !== 'person' && (i.genre_ids?.includes(16) || i.origin_country?.includes('JP'))).map(mapTMDBToAnime);
}

export interface SeasonInfo {
    season_number: number;
    name: string;
    episode_count: number;
}

export const fetchAnimeEpisodes = async (id: string, seasonNumber: number = 1): Promise<Episode[]> => {
    const data = await fetchTMDB(`/tv/${id}/season/${seasonNumber}`);
    if (!data || !data.episodes) return [];
    return data.episodes.map((ep: any) => ({
        mal_id: ep.id,
        title: ep.name || `الحلقة ${ep.episode_number}`,
        episode: ep.episode_number,
        season: seasonNumber,
        aired: ep.air_date,
        score: ep.vote_average,
        filler: false, 
        recap: false,
        image: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : null,
        forum_url: ''
    }));
}

export const fetchAnimeSeasons = async (id: string): Promise<SeasonInfo[]> => {
    const data = await fetchTMDB(`/tv/${id}`);
    if (!data || !data.seasons) return [];
    return data.seasons.map((s: any) => ({
        season_number: s.season_number,
        name: s.name,
        episode_count: s.episode_count
    })).filter((s: any) => s.season_number > 0);
}

export const fetchAnimeRecommendations = async (id: string): Promise<Anime[]> => {
    const data = await fetchTMDB(`/tv/${id}/recommendations`);
    if (!data) return [];
    return data.results.slice(0, 10).map(mapTMDBToAnime);
}

export const fetchAnimeNews = async (): Promise<NewsItem[]> => {
    return [
        {
            mal_id: 1,
            url: '#',
            title: 'الإعلان عن الموسم الرابع من قاتل الشياطين',
            date: new Date().toISOString(),
            author_username: 'Admin',
            images: { jpg: { image_url: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/xUfRZu2mi8jH6SzQEYdB96kBh4q.jpg' } },
            excerpt: 'أرك تدريب الهاشيرا قادم قريباً، ويعد بمعارك حماسية وتطور كبير في الشخصيات.'
        }
    ];
};

export const fetchAnimeRelations = async (id: string): Promise<Relation[]> => {
    const data = await fetchTMDB(`/tv/${id}/recommendations`);
    if (!data || !data.results) return [];
    return [{ relation: 'أعمال مشابهة', entry: data.results.slice(0, 5).map((item: any) => ({ mal_id: item.id, type: 'anime', name: item.name || item.title || item.original_name, url: `/anime/${item.id}` })) }];
};

export const fetchAnimeCharacters = async (id: string): Promise<Character[]> => {
    const data = await fetchTMDB(`/tv/${id}/credits`);
    let cast = data?.cast || [];
    return cast.slice(0, 12).map((actor: any) => ({
        mal_id: actor.id,
        name: actor.character || 'دور غير معروف',
        image: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/150',
        role: actor.order < 3 ? 'رئيسي' : 'داعم',
        voice_actor: { name: actor.name || actor.original_name, image: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/150', language: 'Japanese' }
    }));
};

export const likeService = {
    toggleLike: async (animeId: string, userId: string) => {
        const userLikes = safeParse<Record<string, string[]>>(localStorage.getItem(STORAGE_KEYS.LIKES), {});
        const likeCounts = safeParse<Record<string, number>>(localStorage.getItem(STORAGE_KEYS.LIKE_COUNTS), {});
        const myLikes = userLikes[userId] || [];
        const isLiked = myLikes.includes(animeId);
        let newCount = likeCounts[animeId] || 0;
        if (isLiked) { userLikes[userId] = myLikes.filter(id => id !== animeId); newCount = Math.max(0, newCount - 1); } 
        else { userLikes[userId] = [...myLikes, animeId]; newCount += 1; }
        likeCounts[animeId] = newCount;
        localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(userLikes));
        localStorage.setItem(STORAGE_KEYS.LIKE_COUNTS, JSON.stringify(likeCounts));
        return { liked: !isLiked, count: newCount };
    },
    isLiked: async (animeId: string, userId: string) => userId ? (safeParse<Record<string, string[]>>(localStorage.getItem(STORAGE_KEYS.LIKES), {})[userId] || []).includes(animeId) : false
}

export const historyService = {
    addToHistory: async (anime: Anime, userId: string, episodeNum: number = 1) => {
        if(!userId) return;
        const allHistory = safeParse<Record<string, HistoryItem[]>>(localStorage.getItem(STORAGE_KEYS.HISTORY), {});
        let userHistory = allHistory[userId] || [];
        userHistory = userHistory.filter(h => h.anime.id !== anime.id);
        const total = anime.totalEpisodes || 12;
        const progress = Math.min(100, Math.round((episodeNum / total) * 100));
        userHistory.unshift({ anime, lastEpisode: episodeNum, progress, watchedAt: new Date().toISOString() });
        allHistory[userId] = userHistory.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(allHistory));
    },
    getHistory: async (userId: string) => userId ? (safeParse<Record<string, HistoryItem[]>>(localStorage.getItem(STORAGE_KEYS.HISTORY), {})[userId] || []) : [],
    getStats: async (userId: string) => {
        const history = await historyService.getHistory(userId);
        const totalWatched = history.length;
        const genreCounts: Record<string, number> = {};
        let totalEpSum = 0;
        history.forEach(h => {
            h.anime.genres?.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1);
            totalEpSum += (h.lastEpisode || 1);
        });
        let topGenre = 'غير محدد';
        let maxCount = 0;
        Object.entries(genreCounts).forEach(([genre, count]) => { if (count > maxCount) { maxCount = count; topGenre = genre; } });
        return { totalWatched, topGenre, totalHours: Math.round((totalEpSum * 24) / 60), history };
    }
}

export const watchlistService = {
    addToWatchlist: async (anime: Anime, userId?: string) => {
        const id = userId || GUEST_ID;
        const allWatchlists = safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {});
        const userList = allWatchlists[id] || [];
        if (!userList.find(a => a.id === anime.id)) { userList.push(anime); allWatchlists[id] = userList; localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(allWatchlists)); }
    },
    removeFromWatchlist: async (animeId: string, userId?: string) => {
        const id = userId || GUEST_ID;
        const allWatchlists = safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {});
        allWatchlists[id] = (allWatchlists[id] || []).filter(a => a.id !== animeId);
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(allWatchlists));
    },
    getWatchlist: async (userId?: string) => safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {})[userId || GUEST_ID] || [],
    getWatchlistIds: async (userId?: string) => (safeParse<Record<string, Anime[]>>(localStorage.getItem(STORAGE_KEYS.WATCHLIST), {})[userId || GUEST_ID] || []).map(a => a.id)
}

export const authService = {
  login: async (email: string, pass: string) => {
    await sleep(500);
    const users = safeParse<any[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) { const { password, ...safeUser } = user; return safeUser; }
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  },
  signup: async (email: string, username: string, pass: string) => {
      await sleep(500);
      const users = safeParse<any[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
      if (users.find(u => u.email === email)) throw new Error('البريد الإلكتروني مسجل بالفعل');
      const newUser = { id: crypto.randomUUID(), email, username, password: pass, role: UserRole.USER, created_at: new Date().toISOString(), avatar: `https://ui-avatars.com/api/?name=${username}&background=E50914&color=fff` };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      const { password, ...safeUser } = newUser;
      return safeUser;
  },
  updateProfile: async (user: User) => {
      const users = safeParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.map(u => u.id === user.id ? { ...u, ...user } : u)));
      const current = safeParse<User>(localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION), null);
      if (current?.id === user.id) localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user));
      return user;
  }
};

export const notificationService = {
    getStoredNotifications: () => safeParse<Notification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []),
    saveNotification: (notification: Notification) => {
        const current = safeParse<Notification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []);
        if (current.some(n => n.message === notification.message && Date.now() - (n.timestamp || 0) < 60000)) return;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([notification, ...current].slice(0, 50)));
    },
    markAsRead: () => localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(safeParse<Notification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []).map(n => ({...n, read: true})))),
    
    getSimulatedUpdate: async (): Promise<Notification | null> => {
        const data = Math.random() > 0.5 ? await fetchTMDB('/trending/tv/day') : await fetchTMDB('/tv/on_the_air');
        if (!data?.results?.length) return null;
        const anime = mapTMDBToAnime(data.results[Math.floor(Math.random() * data.results.length)]);
        return { id: crypto.randomUUID(), type: 'update', title: 'تحديث عام', message: `حلقة جديدة متوفرة: ${anime.title}`, link: `/watch/${anime.id}`, timestamp: Date.now(), read: false };
    },

    // ميزة الإشعارات الفورية بناءً على سجل المشاهدة والمفضلة
    checkForUpdates: async (userId: string): Promise<Notification[]> => {
        if (!userId) return [];
        const history = await historyService.getHistory(userId);
        const watchlist = await watchlistService.getWatchlist(userId);
        const combined = [...history.map(h => h.anime), ...watchlist];
        if (!combined.length) return [];
        
        // محاكاة: اختيار عشوائي لعمل من القائمة لإرسال تحديث له
        const target = combined[Math.floor(Math.random() * combined.length)];
        const updateChance = Math.random();
        
        if (updateChance > 0.8) { // 20% احتمال وصول إشعار مخصص عند كل فحص
            return [{
                id: crypto.randomUUID(),
                type: 'update',
                title: 'تحديث مخصص',
                message: `صدرت الحلقة الجديدة من ${target.title}! شاهدها الآن.`,
                link: `/watch/${target.id}`,
                timestamp: Date.now(),
                read: false
            }];
        }
        return [];
    }
}
