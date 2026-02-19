'use client';

import { useState } from 'react';
import { format, subDays } from 'date-fns';

interface DateRangePickerProps {
  onDateChange: (from: string, to: string) => void;
  defaultDays?: number;
}

export function DateRangePicker({ onDateChange, defaultDays = 7 }: DateRangePickerProps) {
  const [from, setFrom] = useState(format(subDays(new Date(), defaultDays), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleApply = () => {
    onDateChange(from, to);
  };

  const handleQuickSelect = (days: number) => {
    const newFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const newTo = format(new Date(), 'yyyy-MM-dd');
    setFrom(newFrom);
    setTo(newTo);
    onDateChange(newFrom, newTo);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      {/* Stack on mobile, row on larger screens; touch-friendly spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 sm:flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 sm:py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px] sm:min-h-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 sm:py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px] sm:min-h-0"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-2.5 sm:py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 min-h-[44px] sm:min-h-0"
        >
          Apply
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickSelect(7)}
            className="px-3 py-2 sm:py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[44px] sm:min-h-0"
          >
            7d
          </button>
          <button
            onClick={() => handleQuickSelect(30)}
            className="px-3 py-2 sm:py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[44px] sm:min-h-0"
          >
            30d
          </button>
          <button
            onClick={() => handleQuickSelect(90)}
            className="px-3 py-2 sm:py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[44px] sm:min-h-0"
          >
            90d
          </button>
        </div>
      </div>
    </div>
  );
}

