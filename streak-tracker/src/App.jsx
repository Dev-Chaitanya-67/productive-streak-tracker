import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { useTheme } from './context/ThemeContext';
import { Moon, Sun, Bell, Zap } from 'lucide-react';
import { storage } from './utils/storage';
import { requestPermission, initNotificationLoop } from './utils/notifications';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './Pages/Dashboard';
import FocusPage from './Pages/FocusPage';
import TasksPage from './Pages/TasksPage';
import JournalPage from './Pages/JournalPage';
import SettingsPage from './Pages/SettingsPage';
import ProjectsPage from './Pages/ProjectsPage';
import LoginPage from './Pages/LoginPage';

// --- ROUTE GUARDS ---

// 1. Kick out if NOT logged in
const ProtectedRoute = ({ children }) => {
  const token = storage.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. Kick out if ALREADY logged in (prevents accessing /login again)
const PublicRoute = ({ children }) => {
  const token = storage.getToken();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { theme, toggleTheme } = useTheme();

  // --- NOTIFICATIONS ---
  React.useEffect(() => {
    // 1. Ask for permission on app load
    requestPermission();

    // 2. Start the reminder loop
    const cleanup = initNotificationLoop();
    
    return cleanup;
  }, []);

  return (
    <div className={`${theme}`}>
      <Routes>
        
        {/* --- PUBLIC ROUTE (Login) --- */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />

        {/* --- PROTECTED ROUTES (Main App) --- */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="h-screen bg-[#F8F9FA] dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col items-center overflow-hidden transition-colors duration-300">
              
              {/* WRAPPER: Full Height */}
              <div className="max-w-[1600px] w-full h-full flex flex-col lg:flex-row relative">

                {/* SIDEBAR */}
                <Sidebar />

                {/* CONTENT AREA */}
                <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 pb-32 lg:pb-10 w-full max-w-7xl mx-auto scrollbar-hide">
                  
                  {/* NAVBAR */}
                  <nav className="flex justify-between items-center mb-6 md:mb-10 p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 sticky top-0 z-50 transition-all">
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

                      <div className="flex items-center gap-2 md:gap-4">
                        <button className="hidden md:flex p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                          <Bell size={20} />
                        </button>
                        <button 
                          onClick={toggleTheme}
                          className="p-2 md:p-3 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm text-zinc-900 dark:text-white"
                        >
                          {theme === 'dark' ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
                        </button>
                      </div>
                  </nav>

                  {/* INTERNAL ROUTES */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/focus" element={<FocusPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>

                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;