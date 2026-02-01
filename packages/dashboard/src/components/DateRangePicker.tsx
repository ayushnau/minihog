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
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
        >
          Apply
        </button>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => handleQuickSelect(7)}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            7d
          </button>
          <button
            onClick={() => handleQuickSelect(30)}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            30d
          </button>
          <button
            onClick={() => handleQuickSelect(90)}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            90d
          </button>
        </div>
      </div>
    </div>
  );
}

