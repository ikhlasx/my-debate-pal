import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';

const DEMO_MODE_KEY = 'debate-tracker-demo-mode';

interface DemoModeContextType {
  isDemoMode: boolean;
  setIsDemoMode: (value: boolean) => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));
    
    // When switching from demo to real mode, clear demo data
    if (!isDemoMode) {
      localStorage.removeItem('debate-sessions_demo');
    }
  }, [isDemoMode]);

  const setIsDemoMode = useCallback((value: boolean) => {
    setIsDemoModeState(value);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoModeState(prev => {
      const newValue = !prev;
      
      // When switching from demo to real mode, show confirmation and reset
      if (prev && !newValue) {
        const confirmed = window.confirm(
          'Switching to real user mode will reset all data and start fresh. Continue?'
        );
        if (!confirmed) {
          return prev; // Keep demo mode on if user cancels
        }
        
        // Clear all session data when switching to real mode
        localStorage.removeItem('debate-sessions');
        localStorage.removeItem('debate-sessions_demo');
      }
      
      return newValue;
    });
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
