import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Auth';
import { Watch } from './pages/Watch';
import { AnimeInfo } from './pages/AnimeInfo';
import { Profile } from './pages/Profile';
import { SearchPage } from './pages/Search';
import { MyList } from './pages/MyList';
import { History } from './pages/History';
import { RecentUpdates } from './pages/RecentUpdates';
import { News } from './pages/News';
import { TopRated } from './pages/TopRated';
import { ArabRanking } from './pages/ArabRanking';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <HashRouter>
      <NotificationProvider>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="anime/:id" element={<AnimeInfo />} />
              <Route path="watch/:id" element={<Watch />} />
              <Route path="profile" element={<Profile />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="my-list" element={<MyList />} />
              <Route path="history" element={<History />} />
              <Route path="recent" element={<RecentUpdates />} />
              <Route path="news" element={<News />} />
              <Route path="top-rated" element={<TopRated />} />
              <Route path="arab-ranking" element={<ArabRanking />} />
              {/* Fallback route */}
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </HashRouter>
  );
}

export default App;