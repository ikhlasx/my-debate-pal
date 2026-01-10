import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';

const DEMO_MODE_KEY = 'debate-tracker-demo-mode';

interface DemoModeContextType {
  isDemoMode: boolean;
  setIsDemoMode: (value: boolean) => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return false; // Default to real user mode during SSR
    }
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    // Only access localStorage in browser
    if (typeof window === 'undefined') {
      return;
    }
    
    // Save demo mode preference
    localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));
    
    // Don't clear any data when switching modes
    // Demo and real data are kept separate and will be loaded as needed
  }, [isDemoMode]);

  const setIsDemoMode = useCallback((value: boolean) => {
    setIsDemoModeState(value);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoModeState(prev => {
      const newValue = !prev;
      
      // Just toggle the mode - no data reset
      // Demo data and real data are kept separate
      // When switching to real mode, it will load from Supabase
      // When switching to demo mode, it will show sample data
      
      return newValue;
    });
  }, []);

  const contextValue: DemoModeContextType = useMemo(
    () => ({
      isDemoMode,
      setIsDemoMode,
      toggleDemoMode,
    }),
    [isDemoMode, setIsDemoMode, toggleDemoMode]
  );

  return (
    <DemoModeContext.Provider value={contextValue}>
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
