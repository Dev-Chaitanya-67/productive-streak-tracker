import React, { useState, useEffect } from 'react';
import { PenLine, Book, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JournalWidget = () => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getTodayDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (res.ok) {
          const today = getTodayDate();
          // Find the daily entry for today
          const todayEntry = data.find(j => j.date === today && j.type === 'daily');
          setEntry(todayEntry);
        }
      } catch (err) {
        console.error("Widget fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, []);

  const handleClick = () => {
    navigate('/journal');
  };

  return (
    <div 
      onClick={handleClick}
      className="group w-full bg-gradient-to-br from-zinc-50 to-white dark:from-[#0A0A0A] dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 flex flex-col relative overflow-hidden transition-all hover:border-neon-500/30 dark:hover:border-neon-500/30 cursor-pointer h-[200px]"
    >
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Book size={24} />
          </div>
          <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
            Daily Note
          </h3>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${entry ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
          {entry ? 'Logged' : 'Pending'}
        </span>
      </div>

      <div className="relative z-10 flex-1 mt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-zinc-400" />
          </div>
        ) : entry ? (
          <>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-1 truncate">{entry.title}</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3 font-medium">
              {entry.content}
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-400 italic mt-2">
            No entry for today yet. Click to write about your progress...
          </p>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#0A0A0A] to-transparent"></div>
      </div>

      <button className="absolute bottom-4 right-4 p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-110 dark:hover:bg-neon-accent">
        <PenLine size={18} />
      </button>

    </div>
  );
};

export default JournalWidget;