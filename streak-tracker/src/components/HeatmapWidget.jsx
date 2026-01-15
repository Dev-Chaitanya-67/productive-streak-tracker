import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame, ChevronLeft, ChevronRight, Calendar,
  Activity, CheckCircle2, Brain, Book, Loader2, 
  Trash2, AlertTriangle, X, Check
} from 'lucide-react';

const HeatmapWidget = () => {
  const scrollContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // STATE: Store custom habits
  const [customTabs, setCustomTabs] = useState([]);
  
  // STATE: Delete Confirmation
  const [habitToDelete, setHabitToDelete] = useState(null);

  // STATE: Store raw data
  const [rawData, setRawData] = useState(null);
  const [yearData, setYearData] = useState([]);
  const [stats, setStats] = useState({ total: 0, label: 'Points' });

  // --- DRAG SCROLL STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  // Ref to distinguish between a "Click" and a "Drag"
  const isDragMove = useRef(false);

  // --- CONFIGURATION ---
  const DEFAULT_TABS = [
    { id: 'all', label: 'Overview', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'focus', label: 'Focus', icon: Brain, color: 'text-neon-500', bg: 'bg-neon-500/10' },
    { id: 'journal', label: 'Journal', icon: Book, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const allTabs = [...DEFAULT_TABS, ...customTabs];
  const currentTabObj = allTabs.find(t => t.id === activeTab) || DEFAULT_TABS[0];

  // Helper to identify if current tab is custom
  const isCustomTab = customTabs.some(t => t.id === activeTab);

  // Helper: Get Today in YYYY-MM-DD (Local Time)
  const getTodayStr = () => {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  // --- API HELPERS ---
  const getAuth = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const safeJson = async (res, endpoint) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${endpoint} failed (${res.status}): ${text}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`${endpoint} returned non-JSON: ${text}`);
    }
    return res.json();
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_URL;
        if (!apiBase) throw new Error('VITE_API_URL is missing');

        const [tasksRes, journalRes, focusRes, habitsRes] = await Promise.all([
          fetch(`${apiBase}/api/tasks`, { headers: getAuth() }),
          fetch(`${apiBase}/api/journals`, { headers: getAuth() }),
          fetch(`${apiBase}/api/focus`, { headers: getAuth() }),
          fetch(`${apiBase}/api/habits`, { headers: getAuth() })
        ]);

        const tasks = await safeJson(tasksRes, 'Tasks API');
        const journals = await safeJson(journalRes, 'Journals API');
        const focusLogs = await safeJson(focusRes, 'Focus API');
        const habits = await safeJson(habitsRes, 'Habits API');

        const dbHabits = Array.isArray(habits) ? habits.map(h => ({
            id: h._id,
            label: h.name,
            completedDates: h.completedDates || [],
            icon: Activity, 
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        })) : [];
        
        setCustomTabs(dbHabits);

        setRawData({
          tasks: Array.isArray(tasks) ? tasks : [],
          journals: Array.isArray(journals) ? journals : [],
          focus: Array.isArray(focusLogs) ? focusLogs : [],
          habits: dbHabits 
        });

      } catch (err) {
        console.error('🔥 Heatmap Fetch Error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); 

  // --- 2. PROCESS DATA ---
  const generateCalendar = useCallback((dataMap, tab) => {
    const monthsData = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthName = d.toLocaleString('default', { month: 'short' });
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const startDayOfWeek = new Date(year, monthIndex, 1).getDay();

      const days = [];
      for (let s = 0; s < startDayOfWeek; s++) days.push({ id: `spacer-${s}`, type: 'spacer' });

      for (let day = 1; day <= daysInMonth; day++) {
        const monthStr = String(monthIndex + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;
        const count = dataMap[dateKey] || 0;

        let level = 0;
        let thresholds = [1, 3, 5, 8];
        if (tab === 'focus') thresholds = [15, 30, 60, 120];
        if (tab === 'journal') thresholds = [1, 1, 2, 3];
        
        if (!['all', 'tasks', 'focus', 'journal'].includes(tab)) {
             thresholds = [1, 1, 1, 1]; 
        }

        if (count >= thresholds[3]) level = 4;
        else if (count >= thresholds[2]) level = 3;
        else if (count >= thresholds[1]) level = 2;
        else if (count >= thresholds[0]) level = 1;

        days.push({ id: dateKey, type: 'day', date: dateKey, count, level });
      }
      monthsData.push({ name: monthName, days });
    }
    setYearData(monthsData);
  }, []);

  const processData = useCallback((data, tab) => {
    if (!data) return;

    const map = {};
    let totalCount = 0;
    let label = 'Points';

    // A. TASKS
    if (tab === 'all' || tab === 'tasks') {
      data.tasks.forEach(t => {
        if (t.completed && t.date) {
          // FIX: Check if date exists
          if (!t.date) return;
          const d = t.date.split('T')[0];
          map[d] = (map[d] || 0) + 1;
          if (tab === 'tasks') totalCount++;
        }
      });
      if (tab === 'tasks') label = 'Tasks';
    }

    // B. JOURNAL
    if (tab === 'all' || tab === 'journal') {
      data.journals.forEach(j => {
        if (j.date) {
          const d = j.date.split('T')[0];
          const weight = tab === 'all' ? 3 : 1;
          map[d] = (map[d] || 0) + weight;
          if (tab === 'journal') totalCount++;
        }
      });
      if (tab === 'journal') label = 'Entries';
    }

    // C. FOCUS
    if (tab === 'all' || tab === 'focus') {
      data.focus.forEach(f => {
        if (f._id) {
          const mins = f.totalMinutes || 0;
          if (tab === 'focus') {
            map[f._id] = (map[f._id] || 0) + mins;
            totalCount += mins;
          } else {
            const points = Math.floor(mins / 15);
            map[f._id] = (map[f._id] || 0) + points;
          }
        }
      });
      if (tab === 'focus') label = 'Minutes';
    }
    
    // D. CUSTOM HABITS
    const isDefault = ['all', 'tasks', 'focus', 'journal'].includes(tab);
    
    if (!isDefault) {
       const currentHabit = data.habits.find(h => h.id === tab);
       
       if (currentHabit && currentHabit.completedDates) {
           currentHabit.completedDates.forEach(dateStr => {
               // FIX: Check if dateStr is valid
               if (!dateStr) return;
               const d = dateStr.split('T')[0]; 
               map[d] = (map[d] || 0) + 1;
           });
           totalCount = currentHabit.completedDates.length;
       }
       label = 'Days';
    }

    // E. OVERVIEW SCORE
    if (tab === 'all') {
      if (data.habits) {
          data.habits.forEach(h => {
             if (h.completedDates) {
                h.completedDates.forEach(dateStr => {
                    // FIX: Check if dateStr is valid
                    if (!dateStr) return;
                    const d = dateStr.split('T')[0];
                    map[d] = (map[d] || 0) + 1;
                    totalCount++;
                });
             }
          });
      }
      totalCount = Object.values(map).reduce((a, b) => a + b, 0);
      label = 'Score';
    }

    setStats({ total: totalCount, label });
    generateCalendar(map, tab);
  }, [generateCalendar]);

  useEffect(() => {
    if (rawData) {
      processData(rawData, activeTab);
    }
  }, [rawData, activeTab, processData]);


  // --- HANDLER: CREATE HABIT ---
  const handleAddHabbit = async () => {
    const name = window.prompt("Name your new Habit Tracker:");
    if (!name) return;

    try {
        const apiBase = import.meta.env.VITE_API_URL;
        const res = await fetch(`${apiBase}/api/habits`, {
            method: 'POST',
            headers: getAuth(),
            body: JSON.stringify({ name }) 
        });

        if(!res.ok) throw new Error("Failed to create habit");
        const newHabit = await res.json();

        const formattedHabit = { 
            id: newHabit._id, 
            label: newHabit.name, 
            completedDates: [], 
            icon: Activity, 
            color: 'text-orange-500', 
            bg: 'bg-orange-500/10' 
        };

        const updatedHabits = [...customTabs, formattedHabit];
        setCustomTabs(updatedHabits);
        setRawData(prev => ({ ...prev, habits: updatedHabits }));
        setActiveTab(newHabit._id);
    } catch (err) {
        alert("Error creating habit: " + err.message);
    }
  }

  // --- HANDLER: TOGGLE DATE (Past or Today) ---
  const handleDateToggle = async (dateStr) => {
    if (!customTabs.find(h => h.id === activeTab)) return; 
    if (isDragMove.current) return; 

    const todayStr = getTodayStr();
    const targetDateStr = dateStr || todayStr;

    // GUARD: Prevent clicking future dates
    if (targetDateStr > todayStr) {
        alert("You cannot mark future dates as done!");
        return;
    }

    const habitIndex = customTabs.findIndex(h => h.id === activeTab);
    const habit = customTabs[habitIndex];

    const isAlreadyDone = habit.completedDates.some(d => d.startsWith(targetDateStr));
    let newDates;

    if (isAlreadyDone) {
        newDates = habit.completedDates.filter(d => !d.startsWith(targetDateStr));
    } else {
        newDates = [...habit.completedDates, targetDateStr];
    }

    const updatedHabit = { ...habit, completedDates: newDates };
    const updatedTabs = [...customTabs];
    updatedTabs[habitIndex] = updatedHabit;

    setCustomTabs(updatedTabs);
    setRawData(prev => ({ ...prev, habits: updatedTabs })); 

    try {
        const apiBase = import.meta.env.VITE_API_URL;
        await fetch(`${apiBase}/api/habits/${activeTab}/toggle`, {
            method: 'PUT',
            headers: getAuth(),
            body: JSON.stringify({ date: targetDateStr })
        });
    } catch (err) {
        console.error("Toggle failed", err);
    }
  };

  const toggleHabitToday = () => handleDateToggle(null);

  // --- HANDLER: CONFIRM DELETE HABIT ---
  const confirmDeleteHabit = async () => {
      if (habitToDelete) {
          const apiBase = import.meta.env.VITE_API_URL;
          
          const prevHabits = [...customTabs];
          const updatedHabits = customTabs.filter(h => h.id !== habitToDelete);
          
          setCustomTabs(updatedHabits);
          setRawData(prev => ({ ...prev, habits: updatedHabits }));
          setActiveTab('all'); 
          
          const idToDelete = habitToDelete;
          setHabitToDelete(null);

          try {
              const res = await fetch(`${apiBase}/api/habits/${idToDelete}`, {
                  method: 'DELETE',
                  headers: getAuth()
              });
              if (!res.ok) throw new Error("Failed to delete");
          } catch (err) {
              console.error("Delete failed", err);
              setCustomTabs(prevHabits);
              setRawData(prev => ({ ...prev, habits: prevHabits }));
              alert("Could not delete habit.");
          }
      }
  }

  // --- UI HELPERS ---
  const getCellColor = (level, type, date) => {
    if (type === 'spacer') return 'invisible';
    
    // Future Date Styling
    const isFuture = date > getTodayStr();
    const baseColor = level === 0 ? 'bg-zinc-100 dark:bg-[#161616]' : '';

    if (isFuture) return 'bg-zinc-50 dark:bg-[#111] opacity-50 cursor-not-allowed';
    if (level === 0) return baseColor;

    if (activeTab === 'all' || activeTab === 'focus') {
      if (level === 1) return 'bg-emerald-900/40';
      if (level === 2) return 'bg-emerald-600';
      if (level === 3) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
      if (level === 4) return 'bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)] z-10 scale-110';
      return 'bg-zinc-800';
    }
    if (activeTab === 'tasks') {
      if (level === 1) return 'bg-blue-900/40';
      if (level === 2) return 'bg-blue-600';
      if (level === 3) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
      if (level === 4) return 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10 scale-110';
      return 'bg-zinc-800';
    }
    if (activeTab === 'journal') {
      if (level === 1) return 'bg-purple-900/40';
      if (level === 2) return 'bg-purple-600';
      if (level === 3) return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]';
      if (level === 4) return 'bg-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.8)] z-10 scale-110';
      return 'bg-zinc-800';
    }
    
    // Custom Habits
    if (level >= 1) return 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-10 scale-110';
    return 'bg-zinc-800';
  };
  
  const handleMouseDown = (e) => { 
      setIsDragging(true); 
      isDragMove.current = false; 
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft); 
      setScrollLeft(scrollContainerRef.current.scrollLeft); 
  };
  
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => { 
      if (!isDragging) return; 
      e.preventDefault(); 
      isDragMove.current = true; 
      const x = e.pageX - scrollContainerRef.current.offsetLeft; 
      const walk = (x - startX) * 2; 
      scrollContainerRef.current.scrollLeft = scrollLeft - walk; 
  };
  const scrollButton = (direction) => { if (scrollContainerRef.current) { const amount = direction === 'left' ? -300 : 300; scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' }); } };

  // Helper for Toggle Button State
  const todayStr = getTodayStr();
  const isTodayMarked = isCustomTab && customTabs.find(t => t.id === activeTab)?.completedDates?.some(d => d.startsWith(todayStr));

  return (
    <div className="w-full bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 lg:p-8 shadow-sm group relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-colors duration-300 ${currentTabObj.bg} ${currentTabObj.color}`}>
            {React.createElement(currentTabObj.icon, { size: 24, className: "fill-current" })}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight animate-in fade-in">
                {stats.total} {stats.label}
              </h3>
              
              {/* CUSTOM CONTROLS - Only shows for custom habits */}
              {isCustomTab && (
                <div className="flex items-center gap-1 absolute top-3 right-4 ">
                  {/* 1. DELETE BUTTON
                   <button 
                      onClick={() => setHabitToDelete(activeTab)} 
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      title="Set color"
                   >
                      <Trash2 size={16} />
                   </button> */}

                   {/* 1. DELETE BUTTON */}
                   <button 
                      onClick={() => setHabitToDelete(activeTab)} 
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      title="Delete Habit"
                   >
                      <Trash2 size={16} />
                   </button>
                   
                   {/* 2. MARK TODAY BUTTON */}
                   <button 
                      onClick={toggleHabitToday}
                      className={`p-1.5 rounded-lg transition-all ${
                          isTodayMarked 
                          ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' 
                          : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isTodayMarked ? "Unmark Today" : "Mark Today as Done"}
                   >
                      <CheckCircle2 size={16} className={isTodayMarked ? "fill-current" : ""} />
                   </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              <Calendar size={14} /> <span>Last 12 Months</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar items-center">
            {allTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
            <button 
              onClick={handleAddHabbit}
              className="flex items-center justify-center h-8 px-3 rounded-md font-serif mx-1 text-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
                +
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 ml-auto sm:ml-0">
            <button onClick={() => scrollButton('left')} className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-600 dark:hover:text-white transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => scrollButton('right')} className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-600 dark:hover:text-white transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={30} className="animate-spin text-zinc-400" /></div>
      ) : (
        <div ref={scrollContainerRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className={`flex gap-8 overflow-x-auto w-full pb-4 no-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
          {yearData.map((month, i) => (
            <div key={i} className="flex flex-col gap-3 min-w-[120px] select-none">
              <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest pl-0.5">{month.name}</span>
              <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                {month.days.map((day, idx) => (
                  <div 
                    key={idx} 
                    title={day.type === 'day' ? `${day.date}: ${day.count} (Click to Toggle)` : ''} 
                    onClick={() => day.type === 'day' && handleDateToggle(day.date)}
                    className={`
                        w-3 h-3 md:w-3.5 md:h-3.5 rounded-[3px] transition-all duration-300 
                        ${getCellColor(day.level, day.type, day.date)} 
                        ${day.level > 0 ? 'hover:brightness-125' : ''}
                        ${isCustomTab && day.type === 'day' && day.date <= todayStr ? 'cursor-pointer hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-600' : ''}
                    `}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {habitToDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-3xl">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Delete "{customTabs.find(h => h.id === habitToDelete)?.label}"?
                </h3>
                <p className="text-zinc-500 text-sm mt-2">
                  This habit and all its history will be permanently removed.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setHabitToDelete(null)} 
                  className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteHabit} 
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};
export default HeatmapWidget;