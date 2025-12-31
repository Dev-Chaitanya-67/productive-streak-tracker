/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, 
  Brain, Coffee, CheckCircle2, Music,
  ChevronUp, ChevronDown, LayoutGrid, X, List, Plus, Trash2, History, Volume2, 
  Zap // <--- Add this!
} from 'lucide-react';

// --- BUILT-IN SOUNDS (Store these in public/sounds/) ---
const PRESET_SOUNDS = [
  { id: 'rain', label: 'Heavy Rain', url: '/sounds/rain.mp3' },
  { id: 'study', label: 'Deep Study', url: '/sounds/DeepStudy.mp3' },
];

const FocusPage = () => {
  // --- STATE ---
  const [mode, setMode] = useState('focus');
  const [isActive, setIsActive] = useState(false);
  
  // TIMER
  const [focusLength, setFocusLength] = useState(25);
  const [shortLength, setShortLength] = useState(5);
  const [timeLeft, setTimeLeft] = useState(focusLength * 60);

  // TASKS
  const [taskInput, setTaskInput] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]); 
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // --- AUDIO ENGINE (NATIVE) ---
  const [activeSound, setActiveSound] = useState(null); // The URL
  const [isPlayingAudio, setIsPlayingAudio] = useState(false); 
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(new Audio()); // Native HTML5 Audio Object

  // CUSTOM UPLOADS (If you still want to allow users to paste MP3 links)
  const [customSounds, setCustomSounds] = useState([]); 
  const [isAddingSound, setIsAddingSound] = useState(false);
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [newSoundName, setNewSoundName] = useState('');

  // STATS
  const [focusReport, setFocusReport] = useState([]);

  const MODES = {
    focus: { label: 'Deep Focus', color: 'text-neon-500', bg: 'bg-neon-500', stroke: 'text-neon-500', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    short: { label: 'Short Break', color: 'text-blue-400', bg: 'bg-blue-400', stroke: 'text-blue-400', glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' },
  };

  const API_BASE = import.meta.env.VITE_API_URL;
  const getAuth = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    fetchTasks();
    fetchSounds(); // Custom DB sounds
    fetchStats();
    
    // Cleanup audio on unmount
    return () => {
      audioRef.current.pause();
      audioRef.current.src = "";
    };
  }, []);

  // --- 2. AUDIO ENGINE LOGIC ---
  // Handle Play/Pause/Source Change
  useEffect(() => {
    const audio = audioRef.current;
    
    if (activeSound) {
      // If the source changed, update it
      if (audio.src !== window.location.origin + activeSound && audio.src !== activeSound) {
        audio.src = activeSound;
        audio.loop = true; // CRITICAL: Always loop for focus music
        audio.load();
      }

      // Handle Play/Pause
      if (isPlayingAudio) {
        // Promise handling to prevent "play() interrupted" errors
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => console.log("Playback prevented:", error));
        }
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [activeSound, isPlayingAudio]);

  // Handle Volume Change
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const toggleAudio = (url) => {
    if (activeSound === url) {
      setIsPlayingAudio(!isPlayingAudio);
    } else {
      setActiveSound(url);
      setIsPlayingAudio(true);
    }
  };

  // --- 3. FETCHING ---
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, { headers: getAuth() });
      const data = await res.json();
      if (res.ok) setAvailableTasks(data.filter(t => !t.completed));
    } catch (err) { console.error(err); }
  };

  const fetchSounds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/focus/sounds`, { headers: getAuth() });
      const data = await res.json();
      if (res.ok) setCustomSounds(data);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/focus`, { headers: getAuth() });
      const data = await res.json();
      if (res.ok) setFocusReport(data);
    } catch (err) { console.error(err); }
  };

  // --- 4. TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      logSession();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const logSession = async () => {
    try {
      const duration = mode === 'focus' ? focusLength : shortLength;
      const date = new Date();
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      await fetch(`${API_BASE}/api/focus`, {
        method: 'POST',
        headers: getAuth(),
        body: JSON.stringify({ duration, mode, date: date.toISOString().split('T')[0] })
      });
      fetchStats();
      alert("Session Saved!");
    } catch (err) { console.error(err); }
  };

  // --- 5. HANDLERS ---
  const handleTaskSubmit = async (e) => {
    if (e.key === 'Enter' && taskInput.trim()) {
      setShowTaskDropdown(false);
      const existing = availableTasks.find(t => t.text.toLowerCase() === taskInput.toLowerCase());
      if (!existing) {
        try {
          const payload = { text: taskInput, category: 'essential', date: new Date().toISOString().split('T')[0] };
          const res = await fetch(`${API_BASE}/tasks`, { method: 'POST', headers: getAuth(), body: JSON.stringify(payload) });
          const newTask = await res.json();
          if (res.ok) setAvailableTasks([{ ...newTask, id: newTask._id }, ...availableTasks]);
        } catch (err) { console.error(err); }
      }
    }
  };

  const selectTask = (task) => {
    setTaskInput(task.text);
    setSelectedTask(task); // eslint-disable-line no-unused-vars
    setShowTaskDropdown(false);
  };

  const clearTask = () => {
    setTaskInput('');
    setSelectedTask(null); // eslint-disable-line no-unused-vars
  };

  const addSound = async (e) => {
    e.preventDefault();
    if(!newSoundUrl || !newSoundName) return;
    try {
      // NOTE: For this native player, URL must be a direct MP3 link, NOT a YouTube link
      const res = await fetch(`${API_BASE}/api/focus/sounds`, { method: 'POST', headers: getAuth(), body: JSON.stringify({ label: newSoundName, url: newSoundUrl }) });
      const data = await res.json();
      if(res.ok) { setCustomSounds([data, ...customSounds]); setIsAddingSound(false); setNewSoundName(''); setNewSoundUrl(''); }
    } catch(err) { console.error(err); }
  };

  const deleteSound = async (id, url) => {
    try {
      await fetch(`${API_BASE}/api/focus/sounds/${id}`, { method: 'DELETE', headers: getAuth() });
      setCustomSounds(customSounds.filter(s => s._id !== id));
      if(activeSound === url) { setActiveSound(null); setIsPlayingAudio(false); }
    } catch(err) { console.error(err); }
  };

  // --- HELPER FUNCS ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustDuration = (targetMode, amount) => {
    if (targetMode === 'focus') {
      const newTime = Math.max(1, focusLength + amount);
      setFocusLength(newTime);
      if (mode === 'focus' && !isActive) setTimeLeft(newTime * 60);
    } else {
      const newTime = Math.max(1, shortLength + amount);
      setShortLength(newTime);
      if (mode === 'short' && !isActive) setTimeLeft(newTime * 60);
    }
  };

  const activateMode = (selectedMode) => {
    setIsActive(false);
    setMode(selectedMode);
    const duration = selectedMode === 'focus' ? focusLength : shortLength;
    setTimeLeft(duration * 60);
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    const duration = mode === 'focus' ? focusLength : shortLength;
    setTimeLeft(duration * 60);
  };

  // --- VISUALS ---
  const totalSeconds = (mode === 'focus' ? focusLength : shortLength) * 60;
  const progress = Math.min(1, timeLeft / totalSeconds); 
  const rMobile = 100; const cMobile = 2 * Math.PI * rMobile; const offMobile = cMobile * (1 - progress);
  const rDesktop = 180; const cDesktop = 2 * Math.PI * rDesktop; const offDesktop = cDesktop * (1 - progress);
  const filteredTasks = availableTasks.filter(t => t.text.toLowerCase().includes(taskInput.toLowerCase()));

  const StatsCard = () => (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 lg:p-5 flex justify-between items-center relative overflow-hidden h-20 lg:h-24 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-500/5 to-transparent opacity-50"></div>
      <div className="flex z-10 w-full justify-around divide-x divide-zinc-100 dark:divide-zinc-800/50">
        <div className="flex flex-col items-center px-2 lg:px-4 w-full">
           <span className="text-2xl lg:text-3xl font-bold font-mono text-zinc-900 dark:text-white">{focusReport.length}</span>
           <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Days</span>
        </div>
        <div className="flex flex-col items-center px-2 lg:px-4 w-full">
           <span className="text-2xl lg:text-3xl font-bold font-mono text-zinc-900 dark:text-white">{Math.floor(focusReport.reduce((acc, curr) => acc + curr.totalMinutes, 0) / 60)}h</span>
           <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Total Focus</span>
        </div>
        <div className="flex flex-col items-center px-2 lg:px-4 w-full">
           <span className="text-2xl lg:text-3xl font-bold font-mono text-neon-500 flex items-center gap-1">0 <Zap size={16} className="fill-current" /></span>
           <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Streak</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full">
      
      {/* LEFT COLUMN */}
      <div className="lg:col-span-8 flex flex-col gap-6 order-1">
        <div className="relative flex-1 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-[2.5rem] p-6 flex gap-6 items-center justify-between overflow-hidden min-h-[360px]">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-15' : 'opacity-0'} ${MODES[mode].bg} blur-[120px]`}></div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
            {/* MOBILE TASK */}
            {taskInput && <div className="flex lg:hidden items-center justify-center gap-2 mb-2 z-20 w-full px-4"><h3 className={`text-lg font-bold ${MODES[mode].color} ${MODES[mode].glow} truncate max-w-[80%] text-center`}>{taskInput}</h3></div>}
            
            {/* DESKTOP TASK */}
            {taskInput && (
              <div className="hidden lg:flex items-center justify-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 z-20 w-full">
                <CheckCircle2 className={`${MODES[mode].color} shrink-0`} size={28} />
                <h3 className={`text-4xl font-display font-bold ${MODES[mode].color} ${MODES[mode].glow} truncate max-w-[80%] text-center leading-tight`}>{taskInput}</h3>
                <button onClick={clearTask} className="p-1.5 rounded-full bg-zinc-800/50 text-zinc-400 hover:text-red-500 transition-colors"><X size={18} /></button>
              </div>
            )}

            {/* Desktop SVG */}
            <div className="hidden lg:block relative">
                <svg className="w-[420px] h-[420px] transform -rotate-90">
                    <circle cx="50%" cy="50%" r={rDesktop} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-300 dark:text-zinc-800" />
                    <circle cx="50%" cy="50%" r={rDesktop} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={cDesktop} strokeDashoffset={offDesktop} strokeLinecap="round" className={`transition-all duration-1000 ease-linear ${MODES[mode].stroke} ${isActive ? 'drop-shadow-[0_0_20px_currentColor]' : ''}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-mono text-8xl font-bold tracking-tighter ${MODES[mode].color}`}>{formatTime(timeLeft)}</span>
                    <span className="mt-4 font-display text-sm text-zinc-400 font-bold uppercase tracking-widest opacity-80">{isActive ? 'Running' : 'Paused'}</span>
                </div>
            </div>

            {/* Mobile SVG */}
            <div className="block lg:hidden relative">
                <svg className="w-64 h-64 transform -rotate-90">
                    <circle cx="50%" cy="50%" r={rMobile} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-300 dark:text-zinc-800" />
                    <circle cx="50%" cy="50%" r={rMobile} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={cMobile} strokeDashoffset={offMobile} strokeLinecap="round" className={`transition-all duration-1000 ease-linear ${MODES[mode].stroke} ${isActive ? 'drop-shadow-[0_0_10px_currentColor]' : ''}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-mono text-5xl font-bold tracking-tighter ${MODES[mode].color}`}>{formatTime(timeLeft)}</span>
                </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-3 w-24 lg:w-32 z-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center group hover:border-neon-500/50 transition-colors cursor-pointer"><LayoutGrid size={22} className="text-zinc-400 opacity-50" /></div>
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-auto lg:h-24">
          <button onClick={toggleTimer} className={`h-16 lg:h-full rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'bg-neon-500 text-white shadow-neon-500/20'}`}>
            {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button onClick={resetTimer} className="h-16 lg:h-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 transition-all flex items-center justify-center active:scale-95"><RotateCcw size={20} /></button>
          {['focus', 'short'].map(m => (
            <div key={m} className={`col-span-1 flex rounded-2xl border-2 transition-all overflow-hidden h-16 lg:h-full ${mode === m ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white shadow-xl' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-neon-500/50'}`}>
              <button onClick={() => { setMode(m); setTimeLeft((m === 'focus' ? focusLength : shortLength) * 60); setIsActive(false); }} className="flex-1 flex flex-col items-center justify-center gap-0.5">
                {m === 'focus' ? <Brain size={20} className={mode === m ? 'text-neon-500' : 'text-zinc-400'} /> : <Coffee size={20} className={mode === m ? 'text-blue-500' : 'text-zinc-400'} />}
                <span className={`font-display font-bold text-base ${mode === m ? 'text-white dark:text-black' : 'text-zinc-500'}`}>{m === 'focus' ? focusLength : shortLength}m</span>
              </button>
              <div className={`flex flex-col w-10 border-l ${mode === m ? 'border-zinc-700 dark:border-zinc-200' : 'border-zinc-100 dark:border-zinc-800'}`}>
                <button onClick={() => adjustDuration(m, 1)} className="flex-1 flex items-center justify-center"><ChevronUp size={18} /></button>
                <button onClick={() => adjustDuration(m, -1)} className="flex-1 flex items-center justify-center"><ChevronDown size={18} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block"><StatsCard /></div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-4 flex flex-col gap-6 order-2">
        {/* MISSION */}
        <div ref={dropdownRef} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm h-32 flex flex-col justify-center relative z-30">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400"><CheckCircle2 size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Current Mission</span></div>
          <div className="relative">
            <input type="text" maxLength={30} placeholder="What's the goal?" value={taskInput} onFocus={() => setShowTaskDropdown(true)} onChange={(e) => { setTaskInput(e.target.value); setShowTaskDropdown(true); }} onKeyDown={handleTaskSubmit} className={`w-full bg-transparent text-xl font-bold outline-none border-none p-0 focus:ring-0 ${taskInput ? MODES[mode].color + ' ' + MODES[mode].glow : 'text-zinc-900 dark:text-white'}`} />
            {showTaskDropdown && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar z-50">
                {taskInput && !availableTasks.some(t => t.text.toLowerCase() === taskInput.toLowerCase()) && (
                  <button onClick={() => handleTaskSubmit({ key: 'Enter' })} className="w-full flex items-center gap-3 p-3 hover:bg-neon-50 dark:hover:bg-neon-900/20 text-neon-600 transition-colors text-left"><Plus size={14} /><span className="text-sm font-bold">Create & Focus</span></button>
                )}
                {filteredTasks.length > 0 ? filteredTasks.map(t => (
                  <button key={t.id} onClick={() => selectTask(t)} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800"><List size={14} /><span className="text-sm font-bold truncate">{t.text}</span></button>
                )) : (!taskInput && <div className="p-4 text-center text-xs text-zinc-400 font-medium">Type to search...</div>)}
              </div>
            )}
          </div>
        </div>
        
        {/* AUDIO PLAYER (Native) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-4 text-zinc-500"><div className="flex items-center gap-3"><Music size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Focus Audio</span></div><button onClick={() => setIsAddingSound(!isAddingSound)} className="p-1.5 hover:bg-zinc-100 rounded-lg"><Plus size={16} /></button></div>
          
          {/* VOLUME */}
          {activeSound && <div className="flex items-center gap-2 mb-4 px-2"><Volume2 size={16} /><input type="range" min={0} max={1} step={0.1} value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full h-1 accent-neon-500 cursor-pointer" /></div>}
          
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
             {isAddingSound && <div className="p-3 border border-dashed border-zinc-700 rounded-xl mb-2"><input type="text" placeholder="Name" value={newSoundName} onChange={e => setNewSoundName(e.target.value)} className="w-full bg-transparent text-sm font-bold mb-2 outline-none" /><input type="text" placeholder="URL (Direct MP3)" value={newSoundUrl} onChange={e => setNewSoundUrl(e.target.value)} className="w-full bg-transparent text-xs mb-2 outline-none" /><div className="flex gap-2"><button onClick={addSound} className="flex-1 py-1.5 bg-neon-500 text-white rounded-lg text-xs font-bold">Add</button></div></div>}
             
             {/* PRESETS */}
             {PRESET_SOUNDS.map((sound) => (
                <div key={sound.id} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${activeSound === sound.url ? 'border-neon-500 bg-neon-500/10' : 'border-zinc-100 dark:border-zinc-800'}`}>
                  <div className="flex items-center gap-3 flex-1" onClick={() => toggleAudio(sound.url)}>
                    <div className={`p-2 rounded-xl ${activeSound === sound.url ? 'bg-neon-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{activeSound === sound.url && isPlayingAudio ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</div>
                    <span className="font-bold text-sm">{sound.label}</span>
                  </div>
                </div>
             ))}

             {/* CUSTOM UPLOADS */}
             {customSounds.map((sound) => (
               <div key={sound._id} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${activeSound === sound.url ? 'border-neon-500 bg-neon-500/10' : 'border-zinc-100 dark:border-zinc-800'}`}>
                 <div className="flex items-center gap-3 flex-1" onClick={() => toggleAudio(sound.url)}>
                   <div className={`p-2 rounded-xl ${activeSound === sound.url ? 'bg-neon-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{activeSound === sound.url && isPlayingAudio ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</div>
                   <span className="font-bold text-sm">{sound.label}</span>
                 </div>
                 <button onClick={() => deleteSound(sound._id, sound.url)} className="p-2 text-zinc-300 hover:text-red-500"><Trash2 size={14} /></button>
               </div>
             ))}
          </div>
        </div>

        {/* FOCUS HISTORY */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm max-h-[300px] overflow-hidden flex flex-col">
           <div className="flex items-center gap-3 mb-4 text-zinc-500"><History size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Focus History</span></div>
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {focusReport.map((day) => (
                <div key={day._id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border">
                   <div><p className="text-xs font-bold">{day._id}</p><p className="text-[10px] text-zinc-400">{day.sessions} sessions</p></div>
                   <span className="font-mono font-bold text-neon-500 text-sm">{day.totalMinutes}m</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="lg:hidden order-3 pb-32"><StatsCard /></div>
    </div>
  );
};

export default FocusPage;