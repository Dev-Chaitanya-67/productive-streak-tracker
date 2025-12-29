/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronUp, ChevronDown } from 'lucide-react';

const FocusTimer = () => {
  // State for the timer
  const [defaultMinutes, setDefaultMinutes] = useState(25); // User-selected time
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60); // Countdown value in seconds
  const [isActive, setIsActive] = useState(false); // Is timer running?
  const [isEditing, setIsEditing] = useState(true); // Are we in "pick time" mode?
  
  const intervalRef = useRef(null);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished!
      setIsActive(false);
      setIsEditing(true);
      // Optional: Add a sound effect here
      alert("Focus session complete!"); 
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  // --- HELPERS ---
  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Change time in edit mode (min 5, max 120 mins)
  const incrementMinutes = () => setDefaultMinutes(prev => Math.min(prev + 5, 120));
  const decrementMinutes = () => setDefaultMinutes(prev => Math.max(prev - 5, 5));

  // Start the session
  const startTimer = () => {
    setTimeLeft(defaultMinutes * 60);
    setIsEditing(false);
    setIsActive(true);
  };

  // Reset back to edit mode
  const resetTimer = () => {
    setIsActive(false);
    setIsEditing(true);
    setTimeLeft(defaultMinutes * 60);
  };

  // --- CIRCULAR PROGRESS CALCS ---
  const radius = 80; // Radius of the SVG circle
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = defaultMinutes * 60;
  const progress = timeLeft / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`
      w-full flex flex-col justify-between
      bg-zinc-50 dark:bg-[#0A0A0A] 
      border border-zinc-200 dark:border-zinc-800/60 
      rounded-3xl p-6 relative overflow-hidden transition-all duration-300 
      ${!isEditing && isActive ? 'ring-2 ring-neon-500 dark:shadow-neon-glow' : ''}
    `}>
      
      {/* Background Pulse Effect (Only when active) */}
      {!isEditing && isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-500/10 blur-3xl rounded-full animate-pulse"></div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${!isEditing && isActive ? 'bg-neon-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
            <Timer size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white">Deep Work</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Focus Mode</p>
          </div>
        </div>
        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${!isEditing && isActive ? 'bg-neon-100 text-neon-700 dark:bg-neon-900/30 dark:text-neon-400' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'}`}>
          {isEditing ? 'Set Time' : isActive ? 'Running' : 'Paused'}
        </div>
      </div>

      {/* --- MAIN DISPLAY AREA --- */}
      <div className="flex-1 flex items-center justify-center my-6 z-10 relative">
        
        {isEditing ? (
          // === MODE 1: EDIT TIMER (Image 1) ===
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-2 border border-zinc-200 dark:border-zinc-700/50">
            <div className="px-8 py-4 text-center border-r border-zinc-200 dark:border-zinc-700/50">
              <span className="font-mono text-6xl font-bold text-zinc-900 dark:text-white">
                {defaultMinutes}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 uppercase tracking-wider">minutes</p>
            </div>
            <div className="flex flex-col">
              <button onClick={incrementMinutes} className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-t-xl transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <ChevronUp size={24} />
              </button>
              <button onClick={decrementMinutes} className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-b-xl transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <ChevronDown size={24} />
              </button>
            </div>
          </div>
        ) : (
          // === MODE 2: ACTIVE TIMER (Image 2 - Circular Progress) ===
          <div className="relative flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-56 h-56 transform -rotate-90">
              {/* Background Circle (Gray) */}
              <circle
                cx="50%" cy="50%" r={radius}
                stroke="currentColor" strokeWidth="8" fill="transparent"
                className="text-zinc-200 dark:text-zinc-800"
              />
              {/* Progress Circle (Neon) */}
              <circle
                cx="50%" cy="50%" r={radius}
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="text-neon-500 transition-all duration-1000 ease-linear dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]"
              />
            </svg>
            {/* Time in Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`
                font-mono font-bold tracking-tighter transition-all text-5xl
                text-zinc-900 dark:text-white 
                ${isActive ? 'dark:text-neon-accent dark:[text-shadow:0_0_15px_rgba(45,212,191,0.5)]' : ''}
              `}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- CONTROLS --- */}
      <div className="flex gap-3 z-10">
        {isEditing ? (
          // "Start Focus" Button
          <button
            onClick={startTimer}
            className="flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-neon-500 text-white hover:bg-neon-600 shadow-lg shadow-neon-500/20 dark:shadow-neon-glow"
          >
            <Play size={20} /> Start Focus
          </button>
        ) : (
          // "Pause/Resume" & "Reset" Buttons
          <>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`
                flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 
                ${isActive 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                  : 'bg-neon-500 text-white hover:bg-neon-600 shadow-lg shadow-neon-500/20 dark:shadow-neon-glow'}
              `}
            >
              {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Resume</>}
            </button>
            <button onClick={resetTimer} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <RotateCcw size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;