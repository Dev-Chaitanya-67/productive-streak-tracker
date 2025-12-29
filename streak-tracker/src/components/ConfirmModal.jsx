import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  isDanger = false 
}) => {
  if (!isOpen) return null;

  return (
    // Z-Index 100 ensures it sits above everything (Sidebar, Task Modals, etc.)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className={`p-4 rounded-full ${isDanger ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-neon-100 dark:bg-neon-900/20 text-neon-600 dark:text-neon-400'}`}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-zinc-500 mt-2 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`
              flex-1 py-3 rounded-xl font-bold text-white transition-transform active:scale-95 shadow-lg
              ${isDanger 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-neon-500 hover:bg-neon-600 shadow-neon-500/20'}
            `}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;