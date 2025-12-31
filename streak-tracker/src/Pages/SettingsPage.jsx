import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Moon, Smartphone, Database, Shield, 
  ChevronRight, Download, Trash2, 
  Bell, ToggleLeft, ToggleRight, Layout, Terminal, 
  LogOut as LogoutIcon, FileSpreadsheet, Loader2, CheckCircle2 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ConfirmModal from '../components/ConfirmModal';
import Papa from 'papaparse'; // Ensure you ran: npm install papaparse

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // --- IMPORT STATE ---
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // 'success', 'error'

  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [devMode, setDevMode] = useState(false);

  const SETTING_TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Layout },
    { id: 'general', label: 'General', icon: Smartphone },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  const performLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); 
  };

  // --- GOOGLE SHEET IMPORT LOGIC ---
// --- GOOGLE SHEET IMPORT LOGIC (UPDATED) ---
  // --- GOOGLE SHEET IMPORT LOGIC (SMART SCANNER) ---
  const handleSheetImport = async () => {
    if(!window.confirm("Import data from your 2025 Google Sheet?")) return;
    
    setIsImporting(true);
    setImportStatus(null);

    const SHEET_ID = '1afqaABuNezq7KSxn-cKD2vRekh50h7dcE-r5viCcDOw';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

    try {
      Papa.parse(CSV_URL, {
        download: true,
        header: false, // 1. Turn OFF auto-headers to inspect rows manually
        skipEmptyLines: true,
        
        complete: async (results) => {
          const rows = results.data;
          
          if (!rows || rows.length === 0) {
             alert("Sheet is empty.");
             setIsImporting(false);
             return;
          }

          console.log("Raw Rows Scanned:", rows.slice(0, 5)); // Debug: Check console to see what it found

          // 2. SMART SCAN: Find the Header Row
          let headerIndex = -1;
          let dateIdx = -1;
          let contentIdx = -1;
          
          // Scan first 10 rows for "Date" and "Summary"
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
            // Normalize row to lowercase strings
            const rowStr = rows[i].map(cell => String(cell || '').toLowerCase().trim());
            
            // Look for columns
            const d = rowStr.findIndex(c => c === 'date' || c === 'day'); // Matches 'DATE' column
            const s = rowStr.findIndex(c => c === 'summary' || c.includes('content')); // Matches 'SUMMARY' column
            
            if (d !== -1 && s !== -1) {
              headerIndex = i;
              dateIdx = d;
              contentIdx = s;
              console.log(`Found Headers at Row ${i}: Date[${d}], Content[${s}]`);
              break;
            }
          }

          if (headerIndex === -1) {
             alert("Could not find 'DATE' and 'SUMMARY' columns.\nPlease ensure your sheet has these headers.");
             setIsImporting(false);
             return;
          }

          // 3. Extract & Format Data
          const validRows = rows.slice(headerIndex + 1); // Skip header row
          
          const formattedData = validRows
            .filter(row => row[dateIdx] && row[contentIdx]) // Ensure row has date & content
            .map(row => {
               const rawDate = row[dateIdx];
               const rawContent = row[contentIdx];
               let isoDate = new Date().toISOString().split('T')[0];

               // Date Fixer
               try {
                  const d = new Date(rawDate);
                  if(!isNaN(d)) {
                    // Adjust for Timezone offset to prevent "yesterday" bug
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    isoDate = d.toISOString().split('T')[0];
                  }
               } catch(e) { console.warn("Date error", rawDate); }

               return {
                 date: isoDate,
                 title: `Journal Entry`, // Or use a 'Day' column if you have one
                 content: rawContent,
                 type: 'daily'
               };
            });

           console.log(`Prepared ${formattedData.length} entries for import.`);

           if (formattedData.length === 0) throw new Error("Headers found but no data rows.");
           
           // 4. Send to Backend
           const token = localStorage.getItem('token');
           const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journals/bulk`, {
             method: 'POST',
             headers: { 
               'Content-Type': 'application/json', 
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify(formattedData)
           });

           if (res.ok) {
             setImportStatus('success');
             alert(`Success! Imported ${formattedData.length} entries.`);
             window.location.reload(); // Refresh to see data immediately
           } else {
             const errData = await res.json();
             throw new Error(errData.message || 'Backend failed to save data.');
           }
           setIsImporting(false);
        },
        error: (err) => {
          console.error(err);
          alert("CSV Download Failed. Check internet connection.");
          setIsImporting(false);
        }
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
      setIsImporting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
              <div className="relative group">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-xl" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin User</h2>
                <p className="text-zinc-500 font-medium">CSE Student • COEP Tech University</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  {['React', 'Node.js', 'Python'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Full Name</label><input type="text" defaultValue="Admin User" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white outline-none" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Username</label><input type="text" defaultValue="@dev_admin" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white outline-none" /></div>
              </div>
              <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Bio</label><textarea rows="3" defaultValue="Building the future, one commit at a time." className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white outline-none resize-none" /></div>
              
              <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 mt-4">
                 <button 
                    onClick={() => setShowLogoutModal(true)} 
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-colors"
                 >
                    <LogoutIcon size={18} /> Log Out
                 </button>
                <button className="px-6 py-2 bg-neon-500 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-neon-500/20">Save Changes</button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Theme Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => theme === 'dark' && toggleTheme()} className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${theme === 'light' ? 'border-neon-500 bg-neon-500/5' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900"><Layout size={24} /></div>
                  <div className="text-left"><p className="font-bold text-zinc-900 dark:text-white">Light Mode</p><p className="text-xs text-zinc-500">Clean & Bright</p></div>
                </button>
                <button onClick={() => theme === 'light' && toggleTheme()} className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${theme === 'dark' ? 'border-neon-500 bg-neon-500/5' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white"><Moon size={24} /></div>
                  <div className="text-left"><p className="font-bold text-zinc-900 dark:text-white">Dark Mode</p><p className="text-xs text-zinc-500">For the late nights</p></div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300"><Bell size={20} /></div><div><p className="font-bold text-zinc-900 dark:text-white">Notifications</p><p className="text-xs text-zinc-500">Get reminders for tasks</p></div></div>
                <button onClick={() => setNotifications(!notifications)} className="text-zinc-400 hover:text-neon-500 transition-colors">{notifications ? <ToggleRight size={40} className="text-neon-500" /> : <ToggleLeft size={40} />}</button>
              </div>
              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300"><Database size={20} /></div><div><p className="font-bold text-zinc-900 dark:text-white">Auto-Save Journal</p><p className="text-xs text-zinc-500">Save content while typing</p></div></div>
                <button onClick={() => setAutoSave(!autoSave)} className="text-zinc-400 hover:text-neon-500 transition-colors">{autoSave ? <ToggleRight size={40} className="text-neon-500" /> : <ToggleLeft size={40} />}</button>
              </div>
              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300"><Terminal size={20} /></div><div><p className="font-bold text-zinc-900 dark:text-white">Developer Mode</p><p className="text-xs text-zinc-500">Show raw JSON data</p></div></div>
                <button onClick={() => setDevMode(!devMode)} className="text-zinc-400 hover:text-neon-500 transition-colors">{devMode ? <ToggleRight size={40} className="text-neon-500" /> : <ToggleLeft size={40} />}</button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Data Management</h3>
              <div className="space-y-4">
                
                {/* --- NEW IMPORT BUTTON --- */}
                <button 
                  onClick={handleSheetImport}
                  disabled={isImporting}
                  className="w-full flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                      {isImporting ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-900 dark:text-emerald-100">
                        {isImporting ? 'Importing...' : 'Sync 2025 Google Sheet'}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {importStatus === 'success' ? 'Import Complete!' : 'One-click import from your public sheet'}
                      </p>
                    </div>
                  </div>
                  {importStatus === 'success' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <ChevronRight size={18} className="text-emerald-300 group-hover:text-emerald-600 transition-colors" />}
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4"><Download size={20} className="text-zinc-500" /><div className="text-left"><p className="font-bold text-zinc-900 dark:text-white">Export Data</p><p className="text-xs text-zinc-500">Download JSON backup</p></div></div>
                  <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                </button>

                <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                  <div className="flex items-center gap-4 mb-3"><div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-500"><Shield size={20} /></div><div><p className="font-bold text-red-600 dark:text-red-400">Danger Zone</p><p className="text-xs text-red-400 dark:text-red-500/70">Irreversible actions</p></div></div>
                  <button className="w-full py-3 bg-white dark:bg-black border border-red-200 dark:border-red-900/50 text-red-500 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"><Trash2 size={18} /> Delete All Data</button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <ConfirmModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        isDanger={true}
      />

      <div className="shrink-0">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 font-medium mt-1 flex items-center gap-2 text-sm">Preferences & Controls</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="lg:w-64 shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {SETTING_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 lg:pb-0">
          <div className="max-w-3xl">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;