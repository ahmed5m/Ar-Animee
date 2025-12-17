import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, User, Mail, Lock } from 'lucide-react';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPass) {
        setError("Passwords do not match");
        return;
    }

    setLoading(true);
    try {
      if (isLogin) {
          await login(email, password);
      } else {
          await signup(email, username, password);
      }
      navigate('/');
    } catch (err: any) {
      // Error handled in context, but we can set local state too
      // AuthContext handles the toast
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Cinematic Background */}
      <div className="absolute inset-0 hidden md:block overflow-hidden">
        <img 
            src="https://assets.nflxext.com/ffe/siteui/vlv3/f85718e1-fc6d-4954-bca0-f5eaf78e0842/ea44b42b-ba0c-4535-96e4-60ef07bf41b0/US-en-20230918-popsignuptwoweeks-perspective_alpha_website_large.jpg" 
            className="w-full h-full object-cover opacity-40 scale-105"
            alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80"></div>
      </div>

      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen p-4">
        {/* Logo */}
        <div className="absolute top-8 left-8 text-primary text-4xl font-black tracking-tighter hidden md:block">
            ANIME<span className="text-white">WATCHER</span>
        </div>

        <div className="bg-black/80 backdrop-blur-sm p-8 md:p-16 rounded-xl w-full max-w-md border border-white/10 shadow-2xl animate-fade-in">
          <h1 className="text-3xl font-bold mb-8 text-white">{isLogin ? 'Sign In' : 'Create Account'}</h1>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
                <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-white transition" size={20}/>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#333] rounded px-10 py-3.5 text-white focus:outline-none focus:bg-[#444] transition placeholder-gray-500 border border-transparent focus:border-primary"
                        placeholder="Username"
                        required
                    />
                </div>
            )}
            
            <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-white transition" size={20}/>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#333] rounded px-10 py-3.5 text-white focus:outline-none focus:bg-[#444] transition placeholder-gray-500 border border-transparent focus:border-primary"
                    placeholder="Email address"
                    required
                />
            </div>

            <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-white transition" size={20}/>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#333] rounded px-10 py-3.5 text-white focus:outline-none focus:bg-[#444] transition placeholder-gray-500 border border-transparent focus:border-primary"
                    placeholder="Password"
                    required
                />
            </div>

            {!isLogin && (
                 <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-white transition" size={20}/>
                    <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="w-full bg-[#333] rounded px-10 py-3.5 text-white focus:outline-none focus:bg-[#444] transition placeholder-gray-500 border border-transparent focus:border-primary"
                        placeholder="Confirm Password"
                        required
                    />
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded">
                    <AlertCircle size={16}/> {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-white font-bold py-3.5 rounded mt-4 hover:bg-red-700 transition disabled:opacity-50 transform active:scale-95 duration-200"
            >
              {loading ? (
                  <span className="flex items-center justify-center gap-2">Processing...</span>
              ) : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>

            {isLogin && (
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
                        <input type="checkbox" className="accent-primary rounded" /> Remember me
                    </label>
                    <a href="#" className="hover:underline hover:text-white">Need help?</a>
                </div>
            )}
          </form>

          <div className="mt-10 text-gray-500">
            {isLogin ? 'New to AnimeWatcher? ' : 'Already have an account? '}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-white hover:underline font-bold"
            >
              {isLogin ? 'Sign up now' : 'Sign in'}
            </button>.
          </div>
        </div>
      </div>
    </div>
  );
};