import React, { useState, useEffect } from 'react';
import { 
  Book, Code2, Plus, Save, Trash2, 
  Calendar, X, FileText,
  ChevronRight, ChevronLeft, Edit3, Layers, AlertCircle, Loader2
} from 'lucide-react';
import { storage } from '../utils/storage';
import { getLocalDate } from '../utils/date';
import { markJournalSaved } from '../utils/notifications';

const JournalPage = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('daily');
  const [customTabs, setCustomTabs] = useState([]); 
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation State
  const [viewDate, setViewDate] = useState(new Date()); 

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null); 
  const [editorDate, setEditorDate] = useState(getLocalDate()); 
  
  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [viewEntry, setViewEntry] = useState(null); 

  // --- API CONFIG ---
  const API_URL = `${import.meta.env.VITE_API_URL}/api/journals`;
  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${storage.getToken()}`
  });

  // --- HELPERS ---
  const getTodayDate = () => getLocalDate();

  const formatMonthDisplay = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // --- 1. FETCH ENTRIES ---
  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await fetch(API_URL, { headers: getAuthHeader() });
        const data = await res.json();
        if (res.ok) {
          // Normalize ID
          const formatted = data.map(j => ({ ...j, id: j._id }));
          setEntries(formatted);

          // Extract Custom Tabs from history
          const usedTypes = [...new Set(formatted.map(j => j.type))];
          const standardTabs = ['daily', 'code'];
          setCustomTabs(usedTypes.filter(t => !standardTabs.includes(t)));
        }
      } catch (err) {
        console.error("Failed to fetch journal", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJournals();
  }, []);

  // --- LOGIC: MONTH NAVIGATION ---
  const changeMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    const today = new Date();
    
    if (direction > 0) {
      if (newDate.getFullYear() > today.getFullYear() || 
         (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() > today.getMonth())) return; 
    }
    if (direction < 0) {
      if (newDate.getFullYear() < 2025) return;
    }
    setViewDate(newDate);
  };

  const isCurrentMonthView = () => {
    const today = new Date();
    return viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
  };

  const isOldestMonthView = () => {
    return viewDate.getFullYear() === 2025 && viewDate.getMonth() === 0; 
  };

  // --- LOGIC: TIMELINE & GROUPING ---
  const generateMonthlyTimeline = () => {
    if (activeTab !== 'daily') return null;
    const timeline = [];
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrent = isCurrentMonthView();
    const endDay = isCurrent ? today.getDate() : daysInMonth;

    for (let day = endDay; day >= 1; day--) {
      const d = new Date(year, month, day);
      const offset = d.getTimezoneOffset();
      const dateStr = new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0];
      const entry = entries.find(e => e.type === 'daily' && e.date === dateStr);
      
      timeline.push({ date: dateStr, entry: entry || null, status: entry ? 'filled' : 'empty' });
    }
    return timeline;
  };

  const getGroupedEntries = () => {
    let filtered = entries.filter(e => e.type === activeTab);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
    filtered.sort((a, b) => b.id - a.id); // Newest first

    return filtered.reduce((groups, entry) => {
      const date = entry.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
      return groups;
    }, {});
  };

  // --- AUTO-LOAD EDITOR ---
  useEffect(() => {
    if (activeTab === 'daily') {
      const today = getTodayDate();
      // Find existing entry for today to edit
      const existingDaily = entries.find(e => e.type === 'daily' && e.date === today);
      if (existingDaily) {
        setEditingId(existingDaily.id);
        setTitle(existingDaily.title);
        setContent(existingDaily.content);
        setEditorDate(existingDaily.date);
      } else {
        setEditingId(null);
        setTitle('');
        setContent('');
        setEditorDate(today);
      }
    } else {
      // Clear editor when switching tabs (unless explicitly editing)
      if (!editingId || (editingId && entries.find(e => e.id === editingId)?.type !== activeTab)) {
        setEditingId(null);
        setTitle('');
        setContent('');
        setEditorDate(getTodayDate());
      }
    }
  }, [activeTab, entries]);

  const TABS = [
    { id: 'daily', label: 'Daily Journal', icon: Book, color: 'text-neon-500' },
    { id: 'code', label: 'Code Log', icon: Code2, color: 'text-yellow-500' },
  ];

  // --- 2. SAVE ENTRY (Create or Update) ---
  const handleSave = async () => {
    if (!content.trim()) return;
    const targetDate = editorDate; 
    
    const payload = {
      date: targetDate,
      type: activeTab,
      title: title || 'Untitled Entry',
      content: content
    };

    try {
      let res;
      let savedData;

      if (editingId) {
        // UPDATE
        res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        });
      } else {
        // CREATE
        // Prevent duplicate daily entries via logic (Backend also handles ID generation)
        if (activeTab === 'daily') {
           const duplicate = entries.find(e => e.type === 'daily' && e.date === targetDate);
           if (duplicate) {
             alert("Entry already exists for this date. Updating it instead.");
             setEditingId(duplicate.id);
             // Recursive call to save as update or just handle here. Let's just stop to prevent confusion.
             return; 
           }
        }
        res = await fetch(API_URL, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        });
      }

      savedData = await res.json();
      
      if (res.ok) {
        const formatted = { ...savedData, id: savedData._id };
        markJournalSaved(); // Trigger confetti & activity log
        
        if (editingId) {
          setEntries(entries.map(e => e.id === editingId ? formatted : e));
        } else {
          setEntries([formatted, ...entries]);
          
          // Reset editor if we just backfilled or if it's today
          if (targetDate !== getTodayDate()) {
             setEditorDate(getTodayDate());
             setTitle('');
             setContent('');
             setEditingId(null);
          } else {
             setEditingId(formatted.id); // Stay in edit mode for today's entry
          }
        }
      }
    } catch (err) {
      console.error("Failed to save", err);
    }
  };

  // --- 3. DELETE ENTRY ---
  const deleteEntry = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this memory permanently?')) {
      // Optimistic Update
      const prevEntries = [...entries];
      setEntries(entries.filter(e => e.id !== id));
      if (viewEntry && viewEntry.id === id) setViewEntry(null);
      if (editingId === id) {
        setEditingId(null);
        setTitle('');
        setContent('');
      }

      try {
        await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
      } catch (err) {
        console.error("Failed to delete", err);
        setEntries(prevEntries);
      }
    }
  };

  const startBackfill = (dateStr) => {
    setEditorDate(dateStr);
    setTitle('');
    setContent('');
    setEditingId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadEntryForEditing = (entry) => {
    setActiveTab(entry.type);
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setEditorDate(entry.date);
    setViewEntry(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addCustomTab = (e) => {
    e.preventDefault();
    if (newTabName.trim() && !customTabs.includes(newTabName)) {
      setCustomTabs([...customTabs, newTabName]);
      setActiveTab(newTabName);
      setIsAddModalOpen(false);
      setNewTabName('');
    }
  };

  const timelineData = generateMonthlyTimeline();
  const groupedData = getGroupedEntries();
  const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 size={32} className="animate-spin text-neon-500" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 shrink-0">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">
            My Journal
          </h1>
          <p className="text-zinc-500 font-medium mt-1 flex items-center gap-2 text-sm">
            <Calendar size={14} /> Document your journey
          </p>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-center">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`group relative px-5 py-2.5 rounded-2xl text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 border flex items-center gap-2 ${activeTab === tab.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg shadow-zinc-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
              <tab.icon size={16} className={activeTab === tab.id ? 'text-current' : tab.color} /> {tab.label}
            </button>
          ))}
          {customTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-2xl text-sm font-bold capitalize whitespace-nowrap transition-all border flex items-center gap-2 ${activeTab === tab ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
              <FileText size={16} /> {tab}
            </button>
          ))}
          <button onClick={() => setIsAddModalOpen(true)} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shrink-0"><Plus size={20} /></button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="relative group shrink-0">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500/20 to-blue-500/20 rounded-[26px] blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-1 shadow-sm flex flex-col min-h-[250px] md:min-h-[300px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 gap-4">
            <input type="text" placeholder="Title (Optional)" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent font-bold text-lg text-zinc-900 dark:text-white outline-none w-full placeholder:text-zinc-400 min-w-0" />
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 border ${editorDate === getTodayDate() ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200' : 'bg-neon-500/10 text-neon-500 border-neon-500/20'}`}>
              {editorDate === getTodayDate() ? 'Today' : editorDate}
            </div>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'daily' ? `Write your story for ${editorDate}...` : "// Log your progress..."} className={`flex-1 w-full bg-transparent p-5 resize-none outline-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 custom-scrollbar placeholder:opacity-50 ${activeTab === 'code' ? 'font-mono' : 'font-sans'}`} />
          <div className="flex justify-between items-center p-3 bg-zinc-50/50 dark:bg-black/20 rounded-b-[20px]">
            <div className="text-xs font-bold text-zinc-400 px-2">{editingId ? "Editing entry" : editorDate !== getTodayDate() ? "Backfilling history" : "New entry"}</div>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-neon-500 hover:bg-neon-400 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-500/20"><Save size={18} /> <span className="hidden md:inline">Save</span></button>
          </div>
        </div>
      </div>

      {/* ARCHIVE */}
      <div className="flex flex-col min-h-[400px] flex-1 pb-32">
        <div className="flex items-center justify-between mb-4 bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => changeMonth(-1)} disabled={isOldestMonthView()} className={`p-3 rounded-xl transition-colors ${isOldestMonthView() ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 dark:text-white'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{activeTab} Archive</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{formatMonthDisplay(viewDate)}</span>
          </div>
          <button onClick={() => changeMonth(1)} disabled={isCurrentMonthView()} className={`p-3 rounded-xl transition-colors ${isCurrentMonthView() ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 dark:text-white'}`}>
            <ChevronRight size={20} />
          </button>
        </div>
        
        {activeTab === 'daily' ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col relative h-full">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
              <div className="hidden md:block md:col-span-3">Date</div>
              <div className="col-span-9 md:col-span-7">Entry Preview</div>
              <div className="col-span-3 md:col-span-2 text-right">Action</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {timelineData.map((item) => (
                <div key={item.date} onClick={() => item.status === 'filled' ? setViewEntry(item.entry) : startBackfill(item.date)} className={`grid grid-cols-12 gap-4 p-3 rounded-2xl transition-all cursor-pointer items-center group border border-transparent ${item.status === 'filled' ? (editingId === item.entry.id ? 'bg-neon-500/5 border-neon-500/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-100 dark:hover:border-zinc-700/50') : 'opacity-50 hover:opacity-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}>
                  <div className={`hidden md:block md:col-span-3 font-mono text-xs font-bold ${item.status === 'filled' ? 'text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white' : 'text-zinc-400 dashed'}`}>{item.date}</div>
                  <div className="col-span-9 md:col-span-7 min-w-0 pr-2">
                    <div className="md:hidden text-[10px] font-mono font-bold text-zinc-400 mb-1">{item.date}</div>
                    {item.status === 'filled' ? (
                      <>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{item.entry.title}</h4>
                        <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium opacity-60">{item.entry.content}</p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400"><AlertCircle size={14} /><span className="text-xs italic font-medium">No entry written</span></div>
                    )}
                  </div>
                  <div className="col-span-3 md:col-span-2 flex justify-end items-center">
                    {item.status === 'filled' ? <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-700" /> : <span className="text-[10px] font-bold text-neon-500 bg-neon-500/10 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">WRITE</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-400 opacity-50 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800"><Layers size={48} className="mb-2 opacity-50" /><p className="text-sm font-medium">No updates logged in {formatMonthDisplay(viewDate)}</p></div>
            ) : (
              sortedDates.map(date => (
                <div key={date} className="mb-6">
                  <div className="sticky top-0 z-10 py-2 bg-[#F8F9FA] dark:bg-black backdrop-blur-sm bg-opacity-90 mb-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">{date}</span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                  </div>
                  <div className="space-y-3">
                    {groupedData[date].map(entry => (
                      <div key={entry.id} onClick={() => setViewEntry(entry)} className={`group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md ${editingId === entry.id ? 'ring-2 ring-yellow-500 border-transparent' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-base text-zinc-900 dark:text-white line-clamp-1">{entry.title}</h4>
                          <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                        </div>
                        <p className={`text-sm text-zinc-500 line-clamp-2 ${activeTab === 'code' ? 'font-mono text-xs bg-zinc-50 dark:bg-black p-2 rounded-lg' : ''}`}>{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 scale-100 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-1 dark:text-white">New Workspace</h3>
            <p className="text-xs text-zinc-500 mb-4">Create a section for specific projects.</p>
            <form onSubmit={addCustomTab} className="flex flex-col gap-4">
              <input autoFocus type="text" placeholder="e.g. Startup..." value={newTabName} onChange={e => setNewTabName(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl outline-none font-bold text-zinc-900 dark:text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-500">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-neon-500 text-white font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start bg-white dark:bg-zinc-900 z-10">
              <div className="pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 ${viewEntry.type === 'code' ? 'text-yellow-500' : 'text-neon-500'}`}>{viewEntry.type}</span>
                  <div className="flex items-center gap-1 text-zinc-400 font-mono text-[10px] uppercase font-bold"><Calendar size={10} /> {viewEntry.date}</div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">{viewEntry.title}</h2>
              </div>
              <button onClick={() => setViewEntry(null)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-red-500 hover:text-white transition-colors absolute right-6 top-6"><X size={20} /></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-zinc-50/50 dark:bg-black/20">
              <div className={`prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-300 ${viewEntry.type === 'code' ? 'font-mono text-sm bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-inner' : 'text-base font-sans'}`}>{viewEntry.content}</div>
            </div>
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center text-xs font-medium text-zinc-400">
              <button onClick={(e) => deleteEntry(viewEntry.id, e)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold"><Trash2 size={16} /> Delete</button>
              <button onClick={() => loadEntryForEditing(viewEntry)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-transform font-bold shadow-lg"><Edit3 size={16} /> Edit Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPage;