import confetti from 'canvas-confetti';
import { storage } from './storage';
import { getLocalDate } from './date';

// --- BROWSER NOTIFICATIONS ---
export const requestPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
     alert('⚠️ Notifications are blocked! Please reset permission in your browser settings.');
     return false;
  }
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
     // Use the new service worker send method
     sendNotification("Permission Granted! 🚀", "You will now receive task alerts.");
     return true;
  }
  return false;
};

export const sendNotification = async (title, body) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
     try {
        // Method 1: Try Service Worker (Best for Mobile)
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                console.log("🚀 Sending via Service Worker");
                await reg.showNotification(title, {
                    body,
                    icon: '/pwa-192x192.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: true
                });
                return;
            }
        }

        // Method 2: Fallback to regular Notification API (Desktop)
        console.log("🚀 Sending via Standard API (Fallback)");
        const notif = new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
        
        notif.onclick = function() {
           window.focus();
           this.close();
        };
     } catch (e) {
        console.error("Notification Error:", e);
        // Last resort alert for testing
        // alert(`NOTIFICATION: ${title}\n${body}`); 
     }
  }
};

// --- VISUAL CELEBRATIONS ---
export const celebrateMilestone = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};

export const triggerSmallConfetti = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
};

// --- LOGIC LOOP ---
export const initNotificationLoop = () => {
  // Keep track of tasks we've already notified about to avoid spam
  // We use a Set of strings: "taskId-date"
  const notifiedTasks = new Set();

  // Check every minute
  const intervalId = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const today = getLocalDate();

    // --- 1. TASK REFINDER (5 Minutes Before) ---
    // Every minute, check if any task is due in 5 mins
    const cachedTasks = storage.get('cachedTasks', []);
    
    // Debug log just to ensure loop is running (open Console to see)
    // console.log(`⏰ Checking ${cachedTasks.length} tasks at ${hour}:${minute}`);

    cachedTasks.forEach(task => {
        // Skip if not today, completed, or no time set
        if (task.date !== today || task.completed || !task.time) return;

        // Parse task time (Format "HH:MM")
        const [taskH, taskM] = task.time.split(':').map(Number);
        const taskDate = new Date();
        taskDate.setHours(taskH, taskM, 0, 0);

        // Calculate difference in minutes
        const diffMs = taskDate - now;
        const diffMins = Math.floor(diffMs / 60000);

        // DEBUG: Logging specific tasks close to time
        if (diffMins >= 0 && diffMins <= 10) {
           console.log(`Task "${task.text}" is due in ${diffMins} minutes`);
        }

        // Logic: specific 5 minute warning (allow 4-5 min window to be safe)
        if (diffMins === 5) {
            const outputKey = `${task.id}-${today}`;
            if (!notifiedTasks.has(outputKey)) {
                sendNotification(
                    `⏰ Upcoming: ${task.text}`,
                    `Starting in 5 minutes! Get ready to focus.`
                );
                notifiedTasks.add(outputKey);
            }
        }
    });


    // Only check general alerts on exact hour marks to save resources
    if (minute !== 0) return;

    const lastLogDate = storage.get('lastTaskLogDate');
    const hasLoggedToday = lastLogDate === today;

    // 2. 8 PM Reminder
    if (hour === 20 && !hasLoggedToday) {
      sendNotification(
        "📝 Keep your streak alive!",
        "You haven't logged any progress today. Take 5 minutes to record your wins."
      );
    }

    // 2. 10 PM Urgent Warning
    if (hour === 22 && !hasLoggedToday) {
      sendNotification(
        "⚠️ Streak Risk: 2 Hours Left",
        "Don't break the chain! Log something now to maintain your productive streak."
      );
    }

  }, 60000); // Run every minute

  return () => clearInterval(intervalId); // Return cleanup function
};

// Call this when a task is completed
export const markTaskCompleted = () => {
    storage.set('lastTaskLogDate', getLocalDate());
    triggerSmallConfetti();
};

// Call this when a Focus Timer session ends
export const markFocusCompleted = (mode) => {
    storage.set('lastTaskLogDate', getLocalDate()); // Counts as activity
    
    if (mode === 'focus') {
        sendNotification("Focus Session Complete! 🎉", "Great job! Take a short break now.");
        celebrateMilestone(); // Big celebration for focus
    } else {
        sendNotification("Break Over! ⏳", "Time to get back to focus.");
        triggerSmallConfetti();
    }
};

// Call this when a Journal entry is saved
export const markJournalSaved = () => {
    storage.set('lastTaskLogDate', getLocalDate()); // Counts as activity
    triggerSmallConfetti();
};
