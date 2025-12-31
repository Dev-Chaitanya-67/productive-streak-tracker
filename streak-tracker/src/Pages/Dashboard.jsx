import React, { useState, useEffect } from 'react';
import { Plus, X, LayoutGrid } from 'lucide-react';
import FocusTimer from '../components/FocusTimer';
import LiveMetrics from '../components/LiveMetrics';
import TaskWidget from '../components/TaskWidget';
import JournalWidget from '../components/JournalWidget';
import HeatmapWidget from '../components/HeatmapWidget';
import SectionHeader from '../components/SectionHeader';

const Dashboard = () => {
  // --- STATE ---
  // Load saved widgets from local storage or default to empty array
  const [activeWidgets, setActiveWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [availableLists, setAvailableLists] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- 1. FETCH AVAILABLE LISTS FROM API ---
  // We need to know what lists exist (e.g. "College", "LeetCode") to offer them as options
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          // Extract unique customList names that are NOT null
          const lists = [...new Set(data.map(t => t.customList).filter(Boolean))];
          setAvailableLists(lists);
        }
      } catch (err) {
        console.error("Failed to fetch lists", err);
      }
    };
    fetchLists();
  }, [isAddModalOpen]); // Refresh list options when modal opens

  // --- 2. SAVE WIDGET CONFIG ---
  useEffect(() => {
    localStorage.setItem('dashboardWidgets', JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  const addWidget = (listName) => {
    // Prevent duplicates
    if (!activeWidgets.includes(listName)) {
      setActiveWidgets([...activeWidgets, listName]);
    }
    setIsAddModalOpen(false);
  };

  const removeWidget = (listName) => {
    setActiveWidgets(activeWidgets.filter(w => w !== listName));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-10 items-start relative">
      
      {/* LEFT COLUMN (Focus & Analytics) */}
      <div className="lg:col-span-9 flex flex-col gap-8 lg:gap-10">
        <div>
          <SectionHeader title="Performance Overview" />
          <HeatmapWidget />
        </div>
        <div>
          <SectionHeader title="Focus Zone" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <FocusTimer />
            <LiveMetrics />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN (Widgets) */}
      <div className="lg:col-span-3 lg:sticky lg:top-32">
        <div className="flex justify-between items-center mb-4 mt-2">
          <h2 className="font-display text-lg lg:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Essentials
          </h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="group flex items-center gap-2 text-[10px] lg:text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-neon-600 dark:hover:text-neon-400 transition-colors bg-transparent hover:bg-neon-50 dark:hover:bg-neon-900/20 px-3 py-1.5 rounded-full"
          >
            <span>ADD WIDGET</span>
            <div className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-neon-200 dark:group-hover:bg-neon-800 transition-colors">
              <Plus size={14} className="text-zinc-500 dark:text-zinc-400 group-hover:text-neon-700 dark:group-hover:text-white" />
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Always show the Default Widget */}
          <TaskWidget title="Essentials" />
          
          <JournalWidget />

          {/* Render Active Custom Widgets */}
          {activeWidgets.map((listName) => (
            <TaskWidget 
              key={listName} 
              title={listName} 
              listName={listName} // Pass the filter!
              onDelete={() => removeWidget(listName)}
            />
          ))}
        </div>
      </div>

      {/* --- ADD WIDGET MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 scale-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Add Widget</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {availableLists.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  No custom lists found.<br/>Create one in "Tasks" first!
                </div>
              ) : (
                availableLists.map(list => (
                  <button
                    key={list}
                    onClick={() => addWidget(list)}
                    disabled={activeWidgets.includes(list)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                      activeWidgets.includes(list)
                        ? 'opacity-50 cursor-not-allowed border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-neon-500 dark:hover:border-neon-500 hover:bg-neon-50 dark:hover:bg-neon-900/10 bg-white dark:bg-black'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${activeWidgets.includes(list) ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400' : 'bg-neon-100 dark:bg-neon-900/20 text-neon-600'}`}>
                      <LayoutGrid size={20} />
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">{list}</span>
                    {activeWidgets.includes(list) && <span className="ml-auto text-[10px] font-bold uppercase text-zinc-400">Added</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;