/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { 
  Plus, Calendar, Tag, ChevronRight, ChevronLeft, 
  X, Trash2, Layers, AlertCircle
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal'; // 1. Import

const ProjectsPage = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Setup React Router", tag: "Frontend", priority: "High", status: "Done", date: "2025-12-20" },
    { id: 2, title: "Design DB Schema", tag: "Backend", priority: "High", status: "Done", date: "2025-12-21" },
    { id: 3, title: "Integrate Auth0", tag: "Security", priority: "Medium", status: "In Progress", date: "2025-12-25" },
    { id: 4, title: "Fix Dark Mode Flicker", tag: "Bug", priority: "Low", status: "Todo", date: "2025-12-26" },
    { id: 5, title: "Research AWS Lambda", tag: "DevOps", priority: "Medium", status: "Backlog", date: "2026-01-10" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null); 
  const [activeColId, setActiveColId] = useState('Todo');

  // 2. New State for Deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTag, setNewTaskTag] = useState('Feature');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskStatus, setNewTaskStatus] = useState('Backlog');

  const COLUMNS = [
    { id: 'Backlog', label: 'Backlog', color: 'bg-zinc-500' },
    { id: 'Todo', label: 'To Do', color: 'bg-blue-500' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-yellow-500' },
    { id: 'Done', label: 'Completed', color: 'bg-neon-500' },
  ];

  const PRIORITY_COLORS = {
    High: 'text-red-500 bg-red-500/10 border-red-500/20',
    Medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    Low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (activeTask) {
      setTasks(tasks.map(t => t.id === activeTask.id ? { 
        ...t, title: newTaskTitle, tag: newTaskTag, priority: newTaskPriority, status: newTaskStatus 
      } : t));
    } else {
      const newTask = {
        id: Date.now(),
        title: newTaskTitle,
        tag: newTaskTag,
        priority: newTaskPriority,
        status: newTaskStatus,
        date: new Date().toISOString().split('T')[0]
      };
      setTasks([...tasks, newTask]);
    }
    closeModal();
  };

  const openModal = (task = null, defaultStatus = 'Backlog') => {
    if (task) {
      setActiveTask(task);
      setNewTaskTitle(task.title);
      setNewTaskTag(task.tag);
      setNewTaskPriority(task.priority);
      setNewTaskStatus(task.status);
    } else {
      setActiveTask(null);
      setNewTaskTitle('');
      setNewTaskTag('Feature');
      setNewTaskPriority('Medium');
      setNewTaskStatus(defaultStatus);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTask(null);
  };

  const moveTask = (task, direction) => {
    const currentIndex = COLUMNS.findIndex(c => c.id === task.status);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      const newStatus = COLUMNS[newIndex].id;
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  // 3. Initiate Delete
  const confirmDelete = (task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  // 4. Perform Delete
  const performDelete = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      closeModal(); // Close the edit modal too
    }
  };

  const TaskCard = ({ task, columnId }) => (
    <div 
      onClick={() => openModal(task)}
      className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">{task.tag}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
      </div>
      <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 leading-snug">{task.title}</h4>
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mt-auto">
        <div className="flex items-center gap-1"><Calendar size={12} /> {task.date}</div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {columnId !== 'Backlog' && <button onClick={() => moveTask(task, -1)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>}
          {columnId !== 'Done' && <button onClick={() => moveTask(task, 1)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* 5. The Delete Modal */}
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={performDelete}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmText="Delete Forever"
        isDanger={true}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">Projects</h1>
          <p className="text-zinc-500 font-medium mt-1 flex items-center gap-2 text-sm"><Layers size={14} /> Kanban Board</p>
        </div>
        <button onClick={() => openModal(null, activeColId)} className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl text-sm">
          <Plus size={18} strokeWidth={3} /> <span className="hidden md:inline">New Ticket</span><span className="md:hidden">Add Task</span>
        </button>
      </div>

      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {COLUMNS.map(col => (
          <button key={col.id} onClick={() => setActiveColId(col.id)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${activeColId === col.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-md' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>
            {col.label} <span className="ml-1 opacity-60">({tasks.filter(t => t.status === col.id).length})</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="lg:hidden h-full overflow-y-auto custom-scrollbar pb-20">
          <div className="flex flex-col gap-3">
            {tasks.filter(t => t.status === activeColId).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 opacity-50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <AlertCircle size={32} className="mb-2" />
                <p className="text-sm font-bold">No tasks in {activeColId}</p>
              </div>
            ) : (
              tasks.filter(t => t.status === activeColId).map(task => <TaskCard key={task.id} task={task} columnId={activeColId} />)
            )}
          </div>
        </div>

        <div className="hidden lg:flex h-full gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
              <div key={column.id} className="flex-1 flex flex-col min-w-[280px] h-full">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                    <h3 className="font-bold text-xs text-zinc-500 uppercase tracking-widest">{column.label}</h3>
                    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{columnTasks.length}</span>
                  </div>
                  <button onClick={() => openModal(null, column.id)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
                <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-3xl p-3 overflow-y-auto custom-scrollbar space-y-3 border border-zinc-100 dark:border-zinc-800/50">
                  {columnTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-xs font-bold uppercase tracking-widest opacity-50">Empty</div>
                  ) : (
                    columnTasks.map(task => <TaskCard key={task.id} task={task} columnId={column.id} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 scale-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{activeTask ? 'Edit Ticket' : 'New Ticket'}</h3>
              <button onClick={closeModal} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTask} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Title</label>
                <input autoFocus type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none font-bold text-zinc-900 dark:text-white border-2 border-transparent focus:border-neon-500/50 transition-colors" placeholder="e.g. Fix Login Bug" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Tag</label>
                  <select value={newTaskTag} onChange={(e) => setNewTaskTag(e.target.value)} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none font-bold text-sm text-zinc-900 dark:text-white appearance-none">
                    <option>Feature</option><option>Bug</option><option>DevOps</option><option>Design</option><option>Backend</option><option>Frontend</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Priority</label>
                  <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none font-bold text-sm text-zinc-900 dark:text-white appearance-none">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLUMNS.map(col => (
                    <button key={col.id} type="button" onClick={() => setNewTaskStatus(col.id)} className={`py-2.5 rounded-lg text-[9px] font-bold uppercase transition-all ${newTaskStatus === col.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                      {col.id === 'In Progress' ? 'In Prog' : col.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {activeTask && (
                  <button 
                    type="button" 
                    onClick={() => confirmDelete(activeTask)} // 6. Trigger Modal
                    className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button type="submit" className="flex-1 py-3 rounded-xl bg-neon-500 text-white font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-neon-500/20">
                  {activeTask ? 'Update Ticket' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;