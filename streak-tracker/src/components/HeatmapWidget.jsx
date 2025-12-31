import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, ChevronLeft, ChevronRight, Calendar,
  Activity, CheckCircle2, Brain, Book, Loader2
} from 'lucide-react';

const HeatmapWidget = () => {
  const scrollContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [yearData, setYearData] = useState([]);
  const [stats, setStats] = useState({ total: 0, label: 'Points' });

  // --- DRAG SCROLL STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // --- CONFIGURATION ---
  const TABS = [
    { id: 'all', label: 'Overview', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'focus', label: 'Focus', icon: Brain, color: 'text-neon-500', bg: 'bg-neon-500/10' },
    { id: 'journal', label: 'Journal', icon: Book, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

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


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const apiBase = import.meta.env.VITE_API_URL;
        if (!apiBase) throw new Error('VITE_API_URL is missing');

        const [tasksRes, journalRes, focusRes] = await Promise.all([
          fetch(`${apiBase}/api/tasks`, { headers: getAuth() }),
          fetch(`${apiBase}/api/journals`, { headers: getAuth() }),
          fetch(`${apiBase}/api/focus`, { headers: getAuth() })
        ]);

        const tasks = await safeJson(tasksRes, 'Tasks API');
        const journals = await safeJson(journalRes, 'Journals API');
        const focusLogs = await safeJson(focusRes, 'Focus API');

        const rawData = {
          tasks: Array.isArray(tasks) ? tasks : [],
          journals: Array.isArray(journals) ? journals : [],
          focus: Array.isArray(focusLogs) ? focusLogs : []
        };

        processData(rawData, activeTab);
      } catch (err) {
        console.error('🔥 Heatmap Fetch Error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);


  // --- 2. PROCESS DATA ---
  const processData = (rawData, tab) => {
    const map = {};
    let totalCount = 0;
    let label = 'Points';

    // A. TASKS
    if (tab === 'all' || tab === 'tasks') {
      rawData.tasks.forEach(t => {
        if (t.completed && t.date) {
          const d = t.date.split('T')[0];
          map[d] = (map[d] || 0) + 1;
          if (tab === 'tasks') totalCount++;
        }
      });
      if (tab === 'tasks') label = 'Tasks';
    }

    // B. JOURNAL
    if (tab === 'all' || tab === 'journal') {
      rawData.journals.forEach(j => {
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
      rawData.focus.forEach(f => {
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

    if (tab === 'all') {
      totalCount = Object.values(map).reduce((a, b) => a + b, 0);
      label = 'Score';
    }

    setStats({ total: totalCount, label });
    generateCalendar(map, tab);
  };

  // --- 3. GENERATE CALENDAR GRID ---
  const generateCalendar = (dataMap, tab) => {
    const monthsData = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const startDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0=Sun

      const days = [];

      // Spacer Blocks (Correct Calendar Alignment)
      for (let s = 0; s < startDayOfWeek; s++) {
        days.push({ id: `spacer-${s}`, type: 'spacer' });
      }

      // Actual Days
      for (let day = 1; day <= daysInMonth; day++) {
        const monthStr = String(monthIndex + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;
        const count = dataMap[dateKey] || 0;

        let level = 0;
        let thresholds = [1, 3, 5, 8];
        if (tab === 'focus') thresholds = [15, 30, 60, 120];
        if (tab === 'journal') thresholds = [1, 1, 2, 3];

        if (count >= thresholds[3]) level = 4;
        else if (count >= thresholds[2]) level = 3;
        else if (count >= thresholds[1]) level = 2;
        else if (count >= thresholds[0]) level = 1;

        days.push({ id: dateKey, type: 'day', date: dateKey, count, level });
      }
      monthsData.push({ name: monthName, days });
    }
    setYearData(monthsData);
  };

  // --- DRAG SCROLL HANDLERS ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll Speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollButton = (direction) => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // --- HELPER: GET COLOR CLASSES ---
  const getCellColor = (level, type) => {
    if (type === 'spacer') return 'invisible';
    if (level === 0) return 'bg-zinc-100 dark:bg-[#161616]'; // Empty

    // NEON THEMES
    if (activeTab === 'all' || activeTab === 'focus') { // Green/Teal
      if (level === 1) return 'bg-emerald-900/40';
      if (level === 2) return 'bg-emerald-600';
      if (level === 3) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
      if (level === 4) return 'bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)] z-10 scale-110';
    }
    if (activeTab === 'tasks') { // Blue/Cyan
      if (level === 1) return 'bg-blue-900/40';
      if (level === 2) return 'bg-blue-600';
      if (level === 3) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
      if (level === 4) return 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10 scale-110';
    }
    if (activeTab === 'journal') { // Purple/Pink
      if (level === 1) return 'bg-purple-900/40';
      if (level === 2) return 'bg-purple-600';
      if (level === 3) return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]';
      if (level === 4) return 'bg-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.8)] z-10 scale-110';
    }
    return 'bg-zinc-800';
  };

  return (
    <div className="w-full bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 lg:p-8 shadow-sm group">

      {/* HEADER (Responsive: Stack on Mobile, Row on Desktop) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">

        {/* Title & Icon */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-colors duration-300 ${TABS.find(t => t.id === activeTab).bg} ${TABS.find(t => t.id === activeTab).color}`}>
            {React.createElement(TABS.find(t => t.id === activeTab).icon, { size: 24, className: "fill-current" })}
          </div>
          <div>
            <h3 className="font-display font-bold text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight animate-in fade-in">
              {stats.total} {stats.label}
            </h3>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              <Calendar size={14} />
              <span>Last 12 Months</span>
            </div>
          </div>
        </div>

        {/* Controls (Tabs + Arrows) */}
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
          {/* Tab Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
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
          </div>

          {/* Scroll Buttons (Hidden on mobile, drag preferred) */}
          <div className="hidden sm:flex items-center gap-2 ml-auto sm:ml-0">
            <button onClick={() => scrollButton('left')} className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-600 dark:hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scrollButton('right')} className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-600 dark:hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* HEATMAP GRID (Draggable) */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={30} className="animate-spin text-zinc-400" />
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-8 overflow-x-auto w-full pb-4 no-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {yearData.map((month, i) => (
            <div key={i} className="flex flex-col gap-3 min-w-[120px] select-none">
              <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest pl-0.5">
                {month.name}
              </span>
              {/* 7 Rows (Sun-Sat) */}
              <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                {month.days.map((day, idx) => (
                  <div
                    key={idx}
                    title={day.type === 'day' ? `${day.date}: ${day.count} ${activeTab === 'focus' ? 'min' : ''}` : ''}
                    className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-[3px] transition-all duration-300 ${getCellColor(day.level, day.type)} ${day.level > 0 ? 'hover:brightness-125' : ''}`}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Styles for hiding scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
};

export default HeatmapWidget;