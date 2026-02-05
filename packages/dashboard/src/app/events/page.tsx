'use client';

import { useEffect, useState } from 'react';
import { api, EventCountResponse } from '@/lib/api';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/useAuth';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useDebounce } from '@/lib/useDebounce';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444'];

export default function EventsPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventName, setEventName] = useState('button_click');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventCountResponse | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('page');
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');

  // Debounce eventName to prevent API calls on every keystroke
  const debouncedEventName = useDebounce(eventName, 500);

  useEffect(() => {
    // Only load data if debounced eventName is not empty
    if (!debouncedEventName.trim()) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Load data with all enhancements
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getEventCounts(debouncedEventName.trim(), from, to, {
          includeTimeSeries: true,
          includeProperties: true,
          includeJourneys: true,
          propertyKey: selectedProperty,
          granularity,
        });
        setData(result);
      } catch (err) {
        setError('Failed to load event data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [from, to, debouncedEventName, selectedProperty, granularity]);

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  const handleLoad = () => {
    if (!eventName.trim()) {
      setError('Please enter an event name');
      return;
    }
    // Trigger reload by updating a dependency
    setEventName(eventName.trim());
  };

  // Calculate comparison with previous period (if we have time series data)
  const getComparison = () => {
    if (!data?.time_series || data.time_series.length < 2) return null;
    
    const currentPeriod = data.total_count;
    const timeSeries = data.time_series;
    const midPoint = Math.floor(timeSeries.length / 2);
    const previousPeriod = timeSeries.slice(0, midPoint).reduce((sum, point) => sum + point.count, 0);
    const currentPeriodSum = timeSeries.slice(midPoint).reduce((sum, point) => sum + point.count, 0);
    
    if (previousPeriod === 0) return null;
    
    const change = ((currentPeriodSum - previousPeriod) / previousPeriod) * 100;
    return {
      change: Math.round(change),
      isIncrease: change > 0,
    };
  };

  const comparison = getComparison();

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Event Analytics</h1>
      
        <DateRangePicker onDateChange={handleDateChange} />
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Event Name:</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && eventName.trim()) {
                    handleLoad();
                  }
                }}
                placeholder="e.g., button_click, page_view, signup"
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full max-w-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Granularity:</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as 'day' | 'hour')}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="day">Daily</option>
                <option value="hour">Hourly</option>
              </select>
            </div>
            <button
              onClick={handleLoad}
              disabled={!eventName.trim()}
              className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Load
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading event data...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!error && !loading && data && (
          <div className="space-y-6">
            {/* Account Info Section */}
            {user && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Dashboard User</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data Period</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(from).toLocaleDateString()} - {new Date(to).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Event Analyzed</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{data.event}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Events</h3>
                <p className="text-4xl font-bold text-primary-600">{data.total_count.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique End Users</h3>
                  <div className="group relative">
                    <svg 
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Number of unique visitors to your website who triggered this event. Each visitor is identified by a unique device/browser.
                    </div>
                  </div>
                </div>
                <p className="text-4xl font-bold text-primary-600">{data.unique_users.toLocaleString()}</p>
              </div>
              {comparison && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Trend</h3>
                  <p className={`text-4xl font-bold ${comparison.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.isIncrease ? '+' : ''}{comparison.change}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs previous period</p>
                </div>
              )}
            </div>

            {/* Time Series Chart */}
            {data.time_series && data.time_series.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Event Trends Over Time ({granularity === 'day' ? 'Daily' : 'Hourly'})
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.time_series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                        name="Event Count"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="unique_users" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Unique End Users"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Properties Breakdown */}
            {data.properties_breakdown && data.properties_breakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Breakdown by {selectedProperty}
                  </h3>
                  {data.available_properties && data.available_properties.length > 0 && (
                    <select
                      value={selectedProperty}
                      onChange={(e) => setSelectedProperty(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {data.available_properties.map((prop) => (
                        <option key={prop} value={prop}>
                          {prop}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.properties_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="value" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0ea5e9" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.properties_breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {data.properties_breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {data.properties_breakdown.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.count} events</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.unique_users} end users</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Journeys */}
            {data.user_journeys && data.user_journeys.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Individual User Journeys</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {data.user_journeys.slice(0, 10).map((journey, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          User: {journey.user_id.substring(0, 8)}...
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {journey.total_events} events
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {journey.events.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded text-xs font-medium"
                          >
                            {event.event_name}
                            {event.properties?.page && (
                              <span className="ml-1 text-primary-600 dark:text-primary-300">
                                ({event.properties.page})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common User Paths */}
            {data.common_paths && data.common_paths.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Common User Paths</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Most common sequences of events users take
                </p>
                <div className="space-y-3">
                  {data.common_paths.map((path, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Path #{index + 1}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {path.count} end users ({path.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {path.path.map((step, stepIndex) => {
                          // Get button_id from path_with_ids if available
                          const stepWithId = path.path_with_ids?.[stepIndex];
                          const buttonId = stepWithId?.button_id;
                          const displayText = buttonId ? `${step} [${buttonId}]` : step;
                          
                          return (
                            <div key={stepIndex} className="flex items-center">
                              <span className="px-3 py-1 bg-primary-600 text-white rounded text-sm font-medium" title={buttonId ? `Button ID: ${buttonId}` : step}>
                                {displayText}
                              </span>
                              {stepIndex < path.path.length - 1 && (
                                <span className="mx-2 text-gray-400">→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty States */}
            {(!data.time_series || data.time_series.length === 0) &&
             (!data.properties_breakdown || data.properties_breakdown.length === 0) &&
             (!data.user_journeys || data.user_journeys.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No detailed analytics available for this event. Try tracking events with properties like 'page' to see breakdowns.
                </p>
              </div>
            )}
          </div>
        )}

        {!error && !loading && !data && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No event data available for the selected criteria.</p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
