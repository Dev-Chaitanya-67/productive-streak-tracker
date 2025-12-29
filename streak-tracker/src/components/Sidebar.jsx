import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; 
import { 
  LayoutDashboard, CheckSquare, Book, Timer, 
  Settings, LogOut, MoreHorizontal, Layers 
} from 'lucide-react';
import ConfirmModal from './ConfirmModal'; // 1. Import

const Sidebar = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // 2. New State
  const navigate = useNavigate();

  // 3. The Actual Logic (Passed to Modal)
  const performLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const mainItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/focus', icon: Timer, label: 'Focus' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/journal', icon: Book, label: 'Journal' },
  ];

  const extraItems = [
    { path: '/projects', icon: Layers, label: 'Projects' }, 
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const userProfileImg = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop";

  return (
    <>
      {/* 4. The Modal Component */}
      <ConfirmModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
        title="Log Out"
        message="Are you sure you want to log out? You will need to sign in again to access your workspace."
        confirmText="Log Out"
        isDanger={true}
      />

      <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-3rem)] my-6 ml-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 rounded-3xl items-start py-6 px-4 gap-6 z-40">
        
        <div className="px-4 mb-2">
           <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
             Menu
           </h2>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {[...mainItems, ...extraItems].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 text-sm font-bold
                ${isActive 
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg shadow-zinc-500/20 translate-x-1' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                  <span className="font-display">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-neon-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex-1"></div>

        <div className="w-full p-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-3">
              <img src={userProfileImg} alt="User" className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-white font-display leading-tight">Admin</span>
                <span className="text-[10px] text-zinc-400 font-medium">Free Plan</span>
              </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowLogoutModal(true); // 5. Open Modal
            }}
            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM DOCK (Unchanged except imports) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        {isMoreOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-white/90 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-5 zoom-in-95">
            {extraItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold mb-1 last:mb-0
                  ${isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="bg-white/50 dark:bg-[#0A0A0A]/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/20 px-6 py-2 flex justify-between items-center">
          {mainItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMoreOpen(false)}
              className={({ isActive }) => `
                p-2.5 rounded-xl border-2 transition-all duration-300 relative
                ${isActive 
                  ? 'border-neon-500 text-neon-600 dark:text-neon-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110 bg-white/10' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}
              `}
            >
              <item.icon size={24} />
            </NavLink>
          ))}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`
              p-2.5 rounded-xl border-2 transition-all duration-300 relative
              ${isMoreOpen 
                ? 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white bg-white/20' 
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}
            `}
          >
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;