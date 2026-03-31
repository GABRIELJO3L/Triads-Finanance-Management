import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, addMonths, subMonths, parse } from 'date-fns';
import { getMonthName } from '../utils/format';

// Returns the billing period key (yyyy-MM) for a given date.
// Billing period: 16th of month M to 15th of month M+1 → key is "yyyy-MM" (of month M).
function getCurrentPeriodKey() {
  const today = new Date();
  const day = today.getDate();
  // If today is the 1st–15th, the active period started on the 16th of the PREVIOUS month
  if (day <= 15) {
    return format(subMonths(today, 1), 'yyyy-MM');
  }
  // If today is the 16th–31st, the active period started on the 16th of this month
  return format(today, 'yyyy-MM');
}

export default function MonthSelector({ className = '' }) {
  const { selectedMonth, setSelectedMonth } = useApp();

  const handlePrev = () => {
    const date = parse(selectedMonth, 'yyyy-MM', new Date());
    setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'));
  };

  const handleNext = () => {
    const currentKey = getCurrentPeriodKey();
    if (selectedMonth >= currentKey) return; // already at the latest period
    const date = parse(selectedMonth, 'yyyy-MM', new Date());
    setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'));
  };

  const isCurrentPeriod = selectedMonth === getCurrentPeriodKey();

  return (
    <div className={`flex items-center gap-2 bg-[#1e2035] border border-white/10 rounded-xl px-3 py-2 ${className}`}>
      <button
        onClick={handlePrev}
        className="text-slate-400 hover:text-white transition-colors p-0.5 hover:bg-white/10 rounded-lg"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-white font-semibold text-sm min-w-[170px] text-center">
        {getMonthName(selectedMonth)}
      </span>
      <button
        onClick={handleNext}
        disabled={isCurrentPeriod}
        className="text-slate-400 hover:text-white transition-colors p-0.5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

