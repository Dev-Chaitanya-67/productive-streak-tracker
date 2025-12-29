import React from 'react';
import { Plus } from 'lucide-react';

const SectionHeader = ({ title }) => {
  return (
    <div className="flex justify-between items-center mb-4 mt-2">
      {/* Responsive Heading Size */}
      <h2 className="font-display text-lg lg:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
        {title}
      </h2>
      <button 
        className="group flex items-center gap-2 text-[10px] lg:text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-neon-600 dark:hover:text-neon-400 transition-colors bg-transparent hover:bg-neon-50 dark:hover:bg-neon-900/20 px-3 py-1.5 rounded-full"
        onClick={() => alert(`Adding widget to ${title}...`)}
      >
        <span>ADD WIDGET</span>
        <div className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-neon-200 dark:group-hover:bg-neon-800 transition-colors">
          <Plus size={14} className="text-zinc-500 dark:text-zinc-400 group-hover:text-neon-700 dark:group-hover:text-white" />
        </div>
      </button>
    </div>
  );
};

export default SectionHeader;