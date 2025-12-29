import React, { useState } from 'react';
import { RefreshCw, Code, GitBranch, CheckCircle2, Activity } from 'lucide-react';

const LiveMetrics = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ leetcode: 450, github: 1240 });

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="w-full flex flex-col bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 justify-between">
      
      {/* HEADER WITH ICON */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {/* Blue Activity Icon */}
          <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
              Live Metrics
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Real-time stats</p>
          </div>
        </div>
        <button 
          onClick={handleSync} 
          className={`p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all ${isSyncing ? 'animate-spin text-neon-500' : ''}`}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {/* LeetCode */}
        <div className="group p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-neon-500/30 dark:hover:border-neon-500/30 transition-all flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 rounded-xl">
              <Code size={24} />
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-zinc-900 dark:text-white group-hover:dark:text-neon-accent transition-colors">{stats.leetcode}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Problems Solved</div>
            </div>
          </div>
          <div className="text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">Top 15%</div>
        </div>

        {/* GitHub */}
        <div className="group p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-neon-500/30 dark:hover:border-neon-500/30 transition-all flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl">
              <GitBranch size={24} />
            </div>
            <div>
               <div className="font-mono text-2xl font-bold text-zinc-900 dark:text-white group-hover:dark:text-neon-accent transition-colors">{stats.github}</div>
               <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Commits</div>
            </div>
          </div>
          <div className="text-xs font-bold px-2.5 py-1 bg-neon-100 dark:bg-neon-900/20 text-neon-700 dark:text-neon-400 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} /> Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMetrics;