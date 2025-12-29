import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, ListTodo, Loader2, X, Trash2 } from 'lucide-react';

// Accepts props now!
const TaskWidget = ({ title = "Essentials", listName = null, onDelete }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // --- HELPERS ---
  const getTodayDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const API_URL = `${import.meta.env.VITE_API_URL}/tasks`;
  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // 1. FETCH TASKS
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeader() });
      const data = await res.json();
      
      if (res.ok) {
        let relevantTasks = [];

        if (listName) {
          // MODE A: Specific Custom List (e.g., "College")
          relevantTasks = data.filter(t => t.customList === listName);
        } else {
          // MODE B: Default Essentials (Today OR Essential)
          const today = getTodayDate();
          relevantTasks = data.filter(t => t.date === today || t.category === 'essential');
        }
        
        // Sort: Incomplete first, then by time
        relevantTasks.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.time || '').localeCompare(b.time || '');
        });
        
        setTasks(relevantTasks);
      }
    } catch (err) {
      console.error("Failed to fetch widget tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listName]); // Re-fetch if the listName prop changes

  // 2. ADD TASK
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const payload = {
      text: newTaskText,
      date: getTodayDate(),
      time: getCurrentTime(),
      completed: false,
      // If adding to a custom list widget, tag it automatically!
      customList: listName || null, 
      category: listName ? 'work' : 'essential' // Default category fallback
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });
      const savedTask = await res.json();
      
      if (res.ok) {
        setTasks([savedTask, ...tasks]);
        setNewTaskText('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Error adding task", err);
    }
  };

  // 3. TOGGLE COMPLETE
  const toggleTask = async (id, currentStatus) => {
    setTasks(tasks.map(t => t._id === id ? { ...t, completed: !currentStatus } : t));

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ completed: !currentStatus }),
      });
    } catch (err) {
      fetchTasks();
    }
  };

  return (
    <div className="group w-full bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden min-h-[320px] flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <ListTodo size={24} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white truncate max-w-[120px]">
              {title}
            </h3>
            {/* Show different subtitle based on mode */}
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {listName ? 'Custom List' : "Today's Agenda"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`p-2 rounded-full transition-colors ${isAdding ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
          </button>
          
          {/* Only show delete button for Custom Widgets (not the main Essentials one) */}
          {listName && onDelete && (
            <button 
              onClick={onDelete} 
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ADD INPUT */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="mb-4 animate-in slide-in-from-top-2 z-10">
          <input 
            autoFocus
            type="text" 
            placeholder={`Add to ${title}...`} 
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none text-sm font-bold text-zinc-900 dark:text-white placeholder:font-normal shadow-lg"
          />
        </form>
      )}

      {/* TASK LIST */}
      <div className="space-y-3 z-10 relative flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs font-medium uppercase tracking-wider opacity-60">
            Empty list. <br/> Stay focused.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task._id} onClick={() => toggleTask(task._id, task.completed)} className="flex items-start gap-3 group/item cursor-pointer">
              <div className={`mt-0.5 transition-colors ${task.completed ? 'text-neon-500 dark:text-neon-accent' : 'text-zinc-300 dark:text-zinc-600 group-hover/item:text-neon-500'}`}>
                {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm lg:text-base leading-relaxed truncate transition-all ${task.completed ? 'text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-700' : 'text-zinc-700 dark:text-zinc-300 font-medium'}`}>
                  {task.text}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-50 dark:from-[#0A0A0A] to-transparent pointer-events-none"></div>
    </div>
  );
};

export default TaskWidget;