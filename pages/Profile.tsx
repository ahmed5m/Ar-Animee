import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { User, Settings, Clock, CreditCard, BarChart2, TrendingUp, Award, PlayCircle, Edit, X, Save, ArrowRight, Play } from 'lucide-react';
import { historyService } from '../services/api';
import { HistoryItem, UserStats } from '../types';
import { useNotification } from '../context/NotificationContext';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<UserStats>({
      totalWatched: 0,
      topGenre: '',
      totalHours: 0,
      history: []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });

  useEffect(() => {
    if(user) {
        setEditForm({ username: user.username, email: user.email });
        const fetchStats = async () => {
            const data = await historyService.getStats(user.id);
            setStats(data);
        }
        fetchStats();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!user) return;
      try {
          await updateUser({ ...user, username: editForm.username, email: editForm.email });
          setIsEditing(false);
      } catch (e) {
          showNotification("Failed to update profile", "error");
      }
  }

  if (!user) return <Navigate to="/login" />;

  const lastWatched = stats.history.length > 0 ? stats.history[0] : null;

  return (
    <div className="pt-24 container mx-auto px-4 max-w-5xl pb-12">
      <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-4xl font-bold text-white">My Account</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-3 space-y-1">
           <div className="p-3 bg-red-600/10 text-red-500 font-medium rounded flex items-center gap-3 border-l-2 border-primary">
             <User size={20} /> Overview
           </div>
           <div className="p-3 hover:bg-zinc-800 rounded text-gray-400 cursor-pointer flex items-center gap-3 transition">
             <BarChart2 size={20} /> Analytics
           </div>
           <div className="p-3 hover:bg-zinc-800 rounded text-gray-400 cursor-pointer flex items-center gap-3 transition">
             <Clock size={20} /> Watch History
           </div>
           <div className="p-3 hover:bg-zinc-800 rounded text-gray-400 cursor-pointer flex items-center gap-3 transition">
             <Settings size={20} /> Settings
           </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-9 space-y-8">
            
            {/* User Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-[#181818] p-8 rounded-xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl ring-4 ring-black overflow-hidden relative z-10">
                    {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover"/> : user.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="text-center md:text-left z-10 flex-1">
                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-3">
                            <input 
                                value={editForm.username} 
                                onChange={e => setEditForm({...editForm, username: e.target.value})}
                                className="bg-black/50 border border-white/20 p-2 rounded text-white w-full"
                                placeholder="Username"
                            />
                            <input 
                                value={editForm.email} 
                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                                className="bg-black/50 border border-white/20 p-2 rounded text-gray-400 w-full text-sm"
                                placeholder="Email"
                            />
                            <div className="flex gap-2 justify-center md:justify-start">
                                <button type="submit" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center gap-1"><Save size={14}/> Save</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm flex items-center gap-1"><X size={14}/> Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h3 className="text-3xl font-bold mb-2">{user.username}</h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wider">{user.role}</span>
                                    <span className="text-gray-500 text-xs py-1">Member since {new Date(user.created_at).getFullYear()}</span>
                                    <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                        </>
                    )}
                </div>
                
                {!isEditing && (
                    <div className="md:ml-auto flex gap-3 z-10">
                        <button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded font-bold transition flex items-center gap-2">
                            <Edit size={16}/> Edit Profile
                        </button>
                    </div>
                )}
            </div>

            {/* Resume Last Watched - NEW FEATURE */}
            {lastWatched && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden group shadow-2xl border border-white/10">
                    <img 
                        src={lastWatched.anime.cover || lastWatched.anime.image} 
                        alt="Last Watched" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-center px-8 z-10">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2 tracking-widest uppercase">
                            <Clock size={16}/> Continue Watching
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">{lastWatched.anime.title}</h2>
                        <p className="text-gray-300 mb-6">Episode {lastWatched.lastEpisode || 1}</p>
                        
                        <Link 
                            to={`/watch/${lastWatched.anime.id}?ep=${(lastWatched.lastEpisode || 1) - 1}`}
                            className="bg-primary hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold w-fit flex items-center gap-2 transition transform hover:scale-105"
                        >
                            <Play fill="white" size={20}/> Resume Episode
                        </Link>
                    </div>
                     <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/50">
                        <div className="h-full bg-primary shadow-[0_0_10px_rgba(229,9,20,0.7)]" style={{ width: `${lastWatched.progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Analytics Section */}
            <section>
                 <h2 className="text-xl text-gray-300 font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-primary"/> Your Viewing Stats
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {/* Stat Card 1 */}
                     <div className="bg-zinc-900 p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                            <PlayCircle size={60} />
                         </div>
                         <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Titles Started</p>
                         <p className="text-4xl font-black text-white">{stats.totalWatched}</p>
                         <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                             <TrendingUp size={12}/> Top 10% of users
                         </p>
                     </div>

                     {/* Stat Card 2 */}
                     <div className="bg-zinc-900 p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                            <Award size={60} />
                         </div>
                         <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Favorite Genre</p>
                         <p className="text-3xl font-black text-white truncate" title={stats.topGenre}>{stats.topGenre || 'N/A'}</p>
                         <p className="text-xs text-blue-400 mt-2">Based on your history</p>
                     </div>

                     {/* Stat Card 3 */}
                     <div className="bg-zinc-900 p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                            <Clock size={60} />
                         </div>
                         <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Estimated Time</p>
                         <p className="text-4xl font-black text-white">{stats.totalHours}<span className="text-xl font-normal text-gray-500">h</span></p>
                         <p className="text-xs text-gray-500 mt-2">Approx. viewing time</p>
                     </div>
                 </div>
            </section>

             {/* Recent History Table */}
            <section>
                <h2 className="text-xl text-gray-300 font-bold mb-4">Recent History</h2>
                <div className="bg-zinc-900 rounded-xl border border-white/5 overflow-hidden">
                    {stats.history.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {stats.history.slice(0, 5).map((item, i) => (
                                <Link to={`/watch/${item.anime.id}?ep=${(item.lastEpisode || 1) - 1}`} key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition group">
                                    <div className="relative">
                                        <img src={item.anime.image} className="w-16 h-10 object-cover rounded" alt="thumb" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <Play size={16} fill="white"/>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-white">{item.anime.title}</h4>
                                        <p className="text-xs text-gray-500">Last watched: Episode {item.lastEpisode || 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-primary">{item.progress}%</div>
                                        <div className="w-24 h-1 bg-gray-700 rounded-full mt-1">
                                            <div className="h-full bg-primary rounded-full" style={{width: `${item.progress}%`}}></div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No history available yet. Start watching!
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};