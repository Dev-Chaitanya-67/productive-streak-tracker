/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';

const LogDataModal = ({ isOpen, onClose, onSave }) => {
  // If the modal is closed, don't render anything (return null)
  if (!isOpen) return null;

  // Local state for the form inputs
   
  const [habit, setHabit] = useState('LeetCode');
  const [count, setCount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send data back to App.jsx
    onSave({ habit, count: parseInt(count), date: new Date() });
    onClose(); // Close the modal
    setCount(''); // Reset form
  };

  return (
    // 1. The Backdrop (Dark overlay)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      
      {/* 2. The Modal Card */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Log Progress</h2>
            <p className="text-sm text-zinc-500">Track your wins for today.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Habit Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Activity</label>
            <div className="relative">
              <Activity className="absolute left-3 top-3 text-zinc-400" size={18} />
              <select 
                value={habit}
                onChange={(e) => setHabit(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white appearance-none"
              >
                <option value="LeetCode">LeetCode (Problems)</option>
                <option value="Fitness">Fitness (Workouts)</option>
                <option value="Reading">Reading (Minutes)</option>
              </select>
            </div>
          </div>

          {/* Count Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Count / Amount</label>
            <input 
              type="number" 
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              <Save size={18} /> Save Log
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LogDataModal;