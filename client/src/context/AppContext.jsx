import React, { createContext, useContext, useState } from 'react';
import { format, subMonths } from 'date-fns';

const AppContext = createContext(null);

function getCurrentPeriodKey() {
  const today = new Date();
  const day = today.getDate();
  // Billing period: 16th of month M → 15th of month M+1. Key = yyyy-MM of month M.
  if (day <= 15) {
    return format(subMonths(today, 1), 'yyyy-MM');
  }
  return format(today, 'yyyy-MM');
}

export function AppProvider({ children }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentPeriodKey());

  return (
    <AppContext.Provider value={{ selectedMonth, setSelectedMonth }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

