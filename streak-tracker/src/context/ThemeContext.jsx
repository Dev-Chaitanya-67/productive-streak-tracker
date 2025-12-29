import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Create the "Context" (The electrical socket)
const ThemeContext = createContext();

// 2. Create the "Provider" (The Power Plant)
export const ThemeProvider = ({ children }) => {
  // Check localStorage first, otherwise default to 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  // 3. The "Effect" (The Switcher)
  // Whenever 'theme' changes, this code runs automatically.
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the old class and add the new one
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Save choice to the browser's memory so it remembers next time
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Function to toggle between modes
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 4. Distribute the power!
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};



// 5. A custom hook (The Plug)
// Instead of typing 'useContext(ThemeContext)' every time, we just type 'useTheme()'
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  return useContext(ThemeContext);
};