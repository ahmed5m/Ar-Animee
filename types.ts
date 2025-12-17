// Domain Entities

export enum UserRole {
  USER = 'User',
  MODERATOR = 'Moderator',
  ADMIN = 'Admin'
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: UserRole;
  created_at: string;
  preferences?: {
    notifications: boolean;
    autoplay: boolean;
  };
}

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  content: string;
  anime_id: string;
  created_at: string;
  likes: number;
}

export interface Anime {
  id: string; // mal_id usually number, but we handle as string for routing
  title: string;
  image: string; // Large image
  cover?: string; // Banner/Trailer image
  description?: string;
  rating?: number | string; // Score
  releaseDate?: string;
  genres?: string[];
  totalEpisodes?: number;
  type?: string;
  status?: string; // 'Currently Airing', 'Finished Airing'
  rank?: number; // For Top 10
  trailerUrl?: string; // YouTube Embed URL
  popularity?: number;
  members?: number;
  likes?: number; // Internal app likes
  studios?: string[];
  licensors?: string[];
  
  // Extended Details
  duration?: string;
  source?: string;
  season?: string;
  year?: number;
  title_japanese?: string;
  title_synonyms?: string[];
  broadcast?: {
      day?: string;
      time?: string;
      timezone?: string;
      string?: string;
  };
}

export interface Episode {
  mal_id: number;
  title: string;
  episode: string | number; // "1" or "1"
  aired: string;
  score: number;
  filler: boolean;
  recap: boolean;
  forum_url: string;
}

export interface NewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  images: {
    jpg: {
      image_url: string;
    }
  };
  excerpt: string;
}

export interface Notification {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'update';
  link?: string;
  read?: boolean;
  timestamp?: number;
}

export interface HistoryItem {
  anime: Anime;
  watchedAt: string;
  progress: number; // 0 to 100
  lastEpisode: number;
}

export interface UserStats {
    totalWatched: number;
    topGenre: string;
    totalHours: number;
    history: HistoryItem[];
}

export interface Character {
  mal_id: number;
  name: string;
  image: string;
  role: string; // Main, Supporting
  voice_actor?: {
      name: string;
      image: string;
      language: string;
  };
}

export interface Relation {
  relation: string; // "Sequel", "Prequel", "Movie", etc.
  entry: {
      mal_id: number;
      type: string;
      name: string;
      url: string;
  }[];
}