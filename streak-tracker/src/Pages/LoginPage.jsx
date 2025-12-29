import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New State for Password Visibility
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const apiUrl = `${import.meta.env.VITE_API_URL}${endpoint}`;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id,
        username: data.username
      }));

      navigate('/');
      window.location.reload(); 

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-black transition-colors duration-300">
      
      {/* --- 1. UNIFIED NAVBAR (Visible on ALL Screens) --- */}
      <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg md:rounded-xl shadow-lg shadow-zinc-500/10">
             <Zap size={20} className="md:w-6 md:h-6 fill-current" />
          </div>
          <div>
            <h1 className="font-logo text-xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
              Momentum
            </h1>
            <p className="font-mono text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-widest uppercase mt-0.5">
              Build_v2.0
            </p>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT CENTERED --- */}
      <div className="flex-1 flex items-center justify-center p-4 -mt-20 md:-mt-10">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-zinc-200 dark:border-zinc-800">
          
          {/* LEFT: VISUAL (Hidden on Mobile, simplified since Navbar is now global) */}
          <div className="hidden md:flex w-1/2 bg-zinc-900 relative items-center justify-center p-12 overflow-hidden group">
            {/* Background Blobs */}
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-neon-500/20 rounded-full blur-[100px] group-hover:bg-neon-500/30 transition-all duration-1000"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] group-hover:bg-purple-500/30 transition-all duration-1000"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
                Your Focus,<br/>Amplified.
              </h2>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Track your habits, manage projects, and maintain your streak—all in one place.
              </p>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Join the Club'}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isLogin ? 'Enter your details to access your workspace.' : 'Start your productivity journey today.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    name="username"
                    placeholder="e.g. dev_wizard"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none text-zinc-900 dark:text-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input (Updated with Show/Hide) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-12 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none text-zinc-900 dark:text-white transition-all font-medium"
                  />
                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                  </>
                )}
              </button>

            </form>

            {/* Toggle Login/Signup */}
            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="ml-2 font-bold text-zinc-900 dark:text-white hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;