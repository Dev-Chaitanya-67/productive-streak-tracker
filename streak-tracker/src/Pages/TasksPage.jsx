import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare, Plus, Trash2, Calendar,
  Tag, CheckCircle2, Clock, Edit2, Save, X,
  ChevronLeft, ChevronRight, History, Copy, CalendarDays,
  Code2, ExternalLink, Terminal, FolderPlus, Layers, AlertTriangle, Loader2
} from 'lucide-react';

const TasksPage = () => {
  // --- HELPERS ---
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getTodayDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date(getTodayDate());
    const tomorrow = new Date(getTodayDate());
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(getTodayDate());
    yesterday.setDate(today.getDate() - 1);

    const sDate = dateString;
    const sToday = today.toISOString().split('T')[0];
    const sTomorrow = tomorrow.toISOString().split('T')[0];
    const sYesterday = yesterday.toISOString().split('T')[0];

    if (sDate === sToday) return 'Today';
    if (sDate === sTomorrow) return 'Tomorrow';
    if (sDate === sYesterday) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // --- STATE ---
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState(getTomorrowDate());
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [filter, setFilter] = useState('all');
  const [historyDate, setHistoryDate] = useState(getTodayDate());

  // Custom Lists State
  const [customLists, setCustomLists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Delete List Confirmation State
  const [listToDelete, setListToDelete] = useState(null);

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const editRef = useRef(null);

  // --- API HANDLERS ---
  const API_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;
  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // 1. FETCH TASKS
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(API_URL, { headers: getAuthHeader() });
        const data = await res.json();
        if (res.ok) {
          // Normalize _id to id for frontend consistency
          const formattedTasks = data.map(t => ({ ...t, id: t._id }));
          setTasks(formattedTasks);

          // Extract unique custom lists from tasks
          const existingLists = [...new Set(formattedTasks.map(t => t.customList).filter(Boolean))];
          setCustomLists(existingLists);
        }
      } catch (err) {
        console.error("Failed to fetch", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // 2. CREATE TASK
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const taskDate = filter === 'upcoming' ? newDate : getTodayDate();
    const isCustomList = customLists.includes(filter);

    const payload = {
      text: newTask,
      time: newTime || getCurrentTime(),
      category: selectedCategory,
      date: taskDate,
      customList: isCustomList ? filter : null
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });
      const savedTask = await res.json();

      if (res.ok) {
        const formatted = { ...savedTask, id: savedTask._id };
        setTasks([...tasks, formatted]);
        setNewTask('');
        setNewTime('');
        if (filter === 'upcoming') setNewDate(getTomorrowDate());
      }
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  // 3. TOGGLE TASK
  const toggleTask = async (id) => {
    // Optimistic UI Update
    const taskToToggle = tasks.find(t => t.id === id);
    const newStatus = !taskToToggle.completed;

    setTasks(tasks.map(t => t.id === id ? { ...t, completed: newStatus } : t));

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ completed: newStatus })
      });
    } catch (err) {
      console.error("Failed to toggle", err);
      // Revert on error
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !newStatus } : t));
    }
  };

  // 4. DELETE TASK
  const deleteTask = async (id) => {
    // Optimistic UI
    const prevTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== id));

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
    } catch (err) {
      console.error("Failed to delete", err);
      setTasks(prevTasks);
    }
  };

  // 5. UPDATE TASK (Edit)
  const saveEdit = async () => {
    const prevTasks = [...tasks];
    setTasks(tasks.map(t => t.id === editingId ? { ...t, text: editText, time: editTime } : t));
    setEditingId(null);

    try {
      await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ text: editText, time: editTime })
      });
    } catch (err) {
      setTasks(prevTasks);
    }
  };

  // 6. SYNC LEETCODE PROBLEM
  const fetchDailyProblem = async () => {
    const problems = [
      { name: "Reverse Linked List", diff: "Easy", link: "https://leetcode.com/problems/reverse-linked-list/" },
      { name: "Longest Substring", diff: "Medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
      { name: "Two Sum", diff: "Easy", link: "https://leetcode.com/problems/two-sum/" }
    ];

    const existingNames = new Set(tasks.map(t => t.text.replace('Daily: ', '')));
    const available = problems.filter(p => !existingNames.has(p.name));

    if (available.length === 0) {
      alert("All sample problems added for today!");
      return;
    }

    const randomProb = available[Math.floor(Math.random() * available.length)];

    const payload = {
      text: `Daily: ${randomProb.name}`,
      time: getCurrentTime(),
      category: 'code',
      date: getTodayDate(),
      difficulty: randomProb.diff,
      link: randomProb.link
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });
      const savedTask = await res.json();
      setTasks(prev => [{ ...savedTask, id: savedTask._id }, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // --- STANDARD LOGIC ---
  const CATEGORIES = {
    essential: { label: 'Essential', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' },
    work: { label: 'Work', color: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400' },
    personal: { label: 'Personal', color: 'text-neon-500', bg: 'bg-neon-500', border: 'border-neon-500' },
    code: { label: 'LeetCode', color: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500' },
  };

  const DIFFICULTY_COLORS = {
    Easy: 'text-green-500 bg-green-500/10 border-green-500/20',
    Medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    Hard: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  const addCustomList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    if (!customLists.includes(newListName)) {
      setCustomLists([...customLists, newListName]);
      setFilter(newListName);
    }
    setNewListName('');
    setIsModalOpen(false);
  };

  // --- REPLACE THIS FUNCTION ---
  const confirmDeleteList = async () => {
    if (listToDelete) {
      // 1. Optimistic Update (Remove from UI immediately)
      const prevLists = [...customLists];
      setCustomLists(customLists.filter(l => l !== listToDelete));
      setFilter('all');

      const listName = listToDelete; // Capture before nulling
      setListToDelete(null);

      try {
        // 2. Call API to update Database
        // We use encodeURIComponent to handle names with spaces like "Side Project"
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/list/${encodeURIComponent(listName)}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });

        if (!res.ok) throw new Error('Failed to delete list');

        // 3. Update local tasks state to reflect the change (so they don't recreate the list if we don't refresh)
        setTasks(prevTasks => prevTasks.map(t =>
          t.customList === listName ? { ...t, customList: null } : t
        ));

      } catch (err) {
        console.error("Error deleting list:", err);
        alert("Failed to delete list. Please try again.");
        setCustomLists(prevLists); // Revert on error
      }
    }
  };

  const handleListClick = (listName) => {
    if (filter === listName) {
      setListToDelete(listName);
    } else {
      setFilter(listName);
    }
  };

  const copyToToday = (taskToCopy) => {
    const newTask = { ...taskToCopy, id: Date.now(), date: getTodayDate(), completed: false };
    // We treat copying as creating a new task
    // Since this requires ID generation from backend, we skip optimal sync for now and just add locally for effect
    // Real implementation would call API
    setTasks(prev => [...prev, newTask]);
    setCopiedId(taskToCopy.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const navigateDate = (days) => {
    const date = new Date(historyDate);
    date.setDate(date.getDate() + days);
    setHistoryDate(date.toISOString().split('T')[0]);
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditTime(task.time);
  };

  const cancelEdit = () => setEditingId(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editRef.current && !editRef.current.contains(event.target)) cancelEdit();
    };
    if (editingId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId]);

  let displayTasks = [];

  if (filter === 'history') {
    displayTasks = tasks.filter(t => t.date === historyDate);
  } else if (filter === 'upcoming') {
    displayTasks = tasks.filter(t => t.date > getTodayDate());
  } else if (filter === 'leetcode') {
    displayTasks = tasks.filter(t => t.category === 'code');
  } else if (customLists.includes(filter)) {
    displayTasks = tasks.filter(t => t.customList === filter);
  } else {
    displayTasks = tasks.filter(t => t.date === getTodayDate());
    if (filter === 'active') displayTasks = displayTasks.filter(t => !t.completed);
    if (filter === 'completed') displayTasks = displayTasks.filter(t => t.completed);
  }

  displayTasks.sort((a, b) => {
    if (filter === 'upcoming' || filter === 'leetcode') {
      if (a.date !== b.date) return filter === 'leetcode' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    }
    return (a.time || '').localeCompare(b.time || '');
  });

  const groupedUpcoming = displayTasks.reduce((groups, task) => {
    const date = task.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(task);
    return groups;
  }, {});

  const completionRate = displayTasks.length > 0
    ? Math.round((displayTasks.filter(t => t.completed).length / displayTasks.length) * 100)
    : 0;

  const isOverdue = (taskTime, isCompleted, taskDate) => {
    if (isCompleted || !taskTime) return false;
    if (taskDate < getTodayDate()) return true;
    if (taskDate === getTodayDate()) {
      const current = getCurrentTime();
      return taskTime < current;
    }
    return false;
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 size={32} className="animate-spin text-neon-500" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-6 relative">

      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">My Tasks</h1>
          <p className="text-zinc-500 font-medium mt-2 flex items-center gap-2">
            <Calendar size={18} />
            {customLists.includes(filter) ? filter : filter === 'history' ? 'Archive' : filter === 'leetcode' ? 'Code Arena' : filter === 'upcoming' ? 'Future Planner' : "Today's Agenda"}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Progress</span>
            <span className="text-2xl font-mono font-bold text-neon-500">{completionRate}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-neon-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* INPUT */}
      {filter !== 'history' && filter !== 'leetcode' && (
        <form onSubmit={addTask} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 pl-3 md:pl-4 rounded-3xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-20">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative group shrink-0">
              <button type="button" className={`p-3 rounded-2xl ${CATEGORIES[selectedCategory]?.bg} bg-opacity-20 text-${selectedCategory}-500 hover:bg-opacity-30 transition-all`}><Tag size={20} className={CATEGORIES[selectedCategory]?.color} /></button>
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-xl hidden group-hover:flex flex-col gap-1 min-w-[140px] z-50">
                {Object.keys(CATEGORIES).map(cat => (
                  <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={`text-left px-3 py-2 rounded-xl text-sm font-bold capitalize hover:bg-zinc-50 dark:hover:bg-zinc-800 ${selectedCategory === cat ? CATEGORIES[cat].color : 'text-zinc-500'}`}>{CATEGORIES[cat].label}</button>
                ))}
              </div>
            </div>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder={filter === 'upcoming' ? "Plan future..." : customLists.includes(filter) ? `Add to ${filter}...` : "Add task..."} className="flex-1 bg-transparent text-lg font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none min-w-0" />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            {filter === 'upcoming' && (
              <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2.5 flex-1 min-w-0">
                <CalendarDays size={16} className="text-zinc-400 mr-2 shrink-0" />
                <input type="date" min={getTomorrowDate()} value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-transparent text-zinc-900 dark:text-white font-mono text-xs font-bold outline-none w-full p-0" />
              </div>
            )}
            <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2.5 flex-1 min-w-0 md:flex-none">
              <Clock size={16} className="text-zinc-400 mr-2 shrink-0" />
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-transparent text-zinc-900 dark:text-white font-mono text-xs font-bold outline-none w-full p-0" />
            </div>
            <button type="submit" className="p-3 md:p-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"><Plus size={24} strokeWidth={3} /></button>
          </div>
        </form>
      )}

      {/* LEETCODE CONTROLS */}
      {filter === 'leetcode' && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-zinc-900 text-white p-3 md:p-4 rounded-3xl shadow-lg border border-zinc-800 gap-3">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="p-2 md:p-3 bg-yellow-500/20 rounded-2xl text-yellow-500 shrink-0"><Code2 size={24} /></div>
            <div><h3 className="font-bold text-base md:text-lg leading-none">Code Arena</h3><p className="text-xs text-zinc-400 mt-1">Keep streak alive!</p></div>
          </div>
          <button onClick={fetchDailyProblem} className="px-5 py-3 bg-yellow-500 text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 whitespace-nowrap"><Terminal size={18} /> Fetch Problem</button>
        </div>
      )}

      {/* HISTORY CONTROLS */}
      {filter === 'history' && (
        <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => navigateDate(-1)} className="p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-colors"><ChevronLeft size={20} className="text-zinc-500 dark:text-white" /></button>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{formatDateDisplay(historyDate)}</span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{historyDate}</span>
          </div>
          <button onClick={() => navigateDate(1)} className="p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-colors" disabled={historyDate === getTodayDate()}><ChevronRight size={20} className={`text-zinc-500 dark:text-white ${historyDate === getTodayDate() ? 'opacity-30' : ''}`} /></button>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
          {['all', 'active', 'completed', 'upcoming', 'history', 'leetcode'].map(f => (
            <button key={f} onClick={() => { setFilter(f); if (f === 'history') setHistoryDate(getTodayDate()); if (f === 'upcoming') setNewDate(getTomorrowDate()); }} className={`px-5 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all border flex items-center gap-2 ${filter === f ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
              {f === 'history' && <History size={14} />} {f === 'upcoming' && <CalendarDays size={14} />} {f === 'leetcode' && <Code2 size={14} />} {f}
            </button>
          ))}

          {customLists.map(list => (
            <button key={list} onClick={() => handleListClick(list)} className={`px-5 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all border flex items-center gap-2 ${filter === list ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
              <Layers size={14} /> {list}
            </button>
          ))}

          <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0"><FolderPlus size={20} /></button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-32 pr-1 custom-scrollbar">
          {displayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 opacity-50"><CheckSquare size={64} className="mb-4" /><p className="font-bold">{filter === 'history' ? 'No history' : filter === 'upcoming' ? 'No future plans' : filter === 'leetcode' ? 'No code tasks' : customLists.includes(filter) ? `No tasks in ${filter}` : 'No tasks found'}</p></div>
          ) : (
            filter === 'upcoming' ? (
              Object.keys(groupedUpcoming).map(date => (
                <div key={date} className="mb-6">
                  <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-3 pl-2 sticky top-0 bg-[#F8F9FA] dark:bg-black py-2 z-10 backdrop-blur-sm bg-opacity-80">{formatDateDisplay(date)} <span className="opacity-50 mx-2">—</span> {date}</h3>
                  <div className="space-y-3">{groupedUpcoming[date].map(task => <TaskItem key={task.id} task={task} CATEGORIES={CATEGORIES} DIFFICULTY_COLORS={DIFFICULTY_COLORS} toggleTask={toggleTask} startEditing={startEditing} deleteTask={deleteTask} editingId={editingId} editRef={editRef} editText={editText} setEditText={setEditText} editTime={editTime} setEditTime={setEditTime} saveEdit={saveEdit} cancelEdit={cancelEdit} filter={filter} />)}</div>
                </div>
              ))
            ) : (
              displayTasks.map(task => <TaskItem key={task.id} task={task} CATEGORIES={CATEGORIES} DIFFICULTY_COLORS={DIFFICULTY_COLORS} toggleTask={toggleTask} startEditing={startEditing} deleteTask={deleteTask} editingId={editingId} editRef={editRef} editText={editText} setEditText={setEditText} editTime={editTime} setEditTime={setEditTime} saveEdit={saveEdit} cancelEdit={cancelEdit} filter={filter} copyToToday={copyToToday} copiedId={copiedId} isOverdue={isOverdue} />)
            )
          )}
        </div>
      </div>

      {/* CREATE LIST MODAL */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-zinc-900 dark:text-white">New Workspace</h3><button onClick={() => setIsModalOpen(false)}><X size={20} className="text-zinc-400" /></button></div>
            <form onSubmit={addCustomList} className="flex flex-col gap-4">
              <input type="text" placeholder="e.g. College, Side Project..." value={newListName} onChange={(e) => setNewListName(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl outline-none font-bold text-zinc-900 dark:text-white" autoFocus />
              <button type="submit" className="w-full py-4 rounded-2xl bg-neon-500 text-white font-bold hover:scale-[1.02] transition-transform">Create List</button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE LIST MODAL */}
      {listToDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500"><AlertTriangle size={32} /></div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Delete "{listToDelete}"?</h3>
                <p className="text-zinc-500 text-sm mt-2">This workspace will be removed. Existing tasks will remain in 'All'.</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setListToDelete(null)} className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
                <button onClick={confirmDeleteList} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPACT TASK ITEM ---
const TaskItem = ({ task, CATEGORIES, DIFFICULTY_COLORS, toggleTask, startEditing, deleteTask, editingId, editRef, editText, setEditText, editTime, setEditTime, saveEdit, cancelEdit, filter, copyToToday, copiedId, isOverdue }) => {
  const checkOverdue = () => !isOverdue ? false : isOverdue(task.time, task.completed, task.date);
  const categoryStyle = CATEGORIES[task.category] || CATEGORIES['work']; // Fallback

  return (
    <div ref={editingId === task.id ? editRef : null} className={`group w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl flex items-center justify-between transition-all duration-300 relative overflow-hidden ${task.completed ? 'opacity-60 grayscale-[0.5]' : 'hover:border-zinc-300 dark:hover:border-zinc-700'} ${editingId === task.id ? 'ring-2 ring-neon-500 border-transparent' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${categoryStyle.bg}`}></div>

      {editingId === task.id ? (
        <div className="flex flex-col w-full pl-3 gap-3">
          <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 outline-none font-bold text-zinc-900 dark:text-white text-sm" autoFocus />
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl pl-9 pr-2 py-2 outline-none font-mono font-bold text-xs text-zinc-900 dark:text-white" />
            </div>
            <button onClick={saveEdit} className="p-2 bg-neon-500 text-white rounded-xl hover:scale-105 shrink-0"><Save size={16} /></button>
            <button onClick={cancelEdit} className="p-2 bg-red-500 text-white rounded-xl hover:scale-105 shrink-0"><X size={16} /></button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 overflow-hidden pl-2 flex-1">
            <button onClick={() => toggleTask(task.id)} className={`shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? `bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-black` : `border-zinc-300 dark:border-zinc-700 text-transparent hover:border-neon-500`}`}>
              <CheckCircle2 size={14} strokeWidth={3} />
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center">
                <span className={`text-sm md:text-base font-bold truncate transition-all ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>{task.text}</span>
                {copiedId === task.id && <span className="text-[10px] font-bold text-neon-500 animate-pulse ml-2 whitespace-nowrap">Copied!</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${categoryStyle.color}`}>{categoryStyle.label}</span>
                {task.category === 'code' && task.difficulty && <span className={`text-[8px] font-bold px-1 py-px rounded border ${DIFFICULTY_COLORS[task.difficulty]}`}>{task.difficulty}</span>}
                <span className={`text-[9px] font-mono font-medium flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md ${checkOverdue() ? 'text-red-500 border border-red-500/20' : 'text-zinc-400'}`}>
                  <Clock size={8} /> {task.time} {checkOverdue() && <span className="ml-1 font-bold text-red-500 uppercase tracking-wider text-[8px]">LATE</span>}
                </span>
                {task.customList && filter !== task.customList && <span className="text-[9px] font-bold px-1.5 py-px rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">{task.customList}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 ml-2 shrink-0">
            {task.category === 'code' && task.link && <a href={task.link} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-500/10 transition-colors"><ExternalLink size={16} /></a>}
            {filter === 'history' ? (
              <button onClick={() => copyToToday(task)} className="p-1.5 rounded-lg text-neon-500 hover:bg-neon-500/10 transition-colors"><Copy size={16} /></button>
            ) : (
              <button onClick={() => startEditing(task)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"><Edit2 size={16} /></button>
            )}
            {filter !== 'history' && <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"><Trash2 size={16} /></button>}
          </div>
        </>
      )}
    </div>
  );
};

export default TasksPage;