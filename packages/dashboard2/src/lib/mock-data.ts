// Mock data for the MiniHog dashboard

export const generateTimeSeries = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 500) + 100,
      unique_users: Math.floor(Math.random() * 200) + 50,
    });
  }
  return data;
};

export const mockEventBreakdown = [
  { event: 'install', total_count: 2847, unique_users: 1923 },
  { event: 'signup', total_count: 1456, unique_users: 1456 },
  { event: 'purchase', total_count: 832, unique_users: 687 },
  { event: 'app_open', total_count: 12543, unique_users: 3201 },
];

export const mockFunnelData = [
  { step: 1, event_name: 'install', users: 2847, drop_off_percentage: 0 },
  { step: 2, event_name: 'signup', users: 1456, drop_off_percentage: 48.9 },
  { step: 3, event_name: 'purchase', users: 832, drop_off_percentage: 42.9 },
];

export const mockRetention = {
  cohort: 'install',
  day: 7,
  cohort_size: 2847,
  retained_users: 1142,
  retention_percentage: 40.1,
};

export const mockAttribution = {
  installs_by_campaign: [
    { campaign_id: 'google_ads_q1', install_count: 1203 },
    { campaign_id: 'facebook_winter', install_count: 856 },
    { campaign_id: 'twitter_launch', install_count: 432 },
    { campaign_id: 'Unattributed', install_count: 356 },
  ],
  purchases_by_campaign: [
    { campaign_id: 'google_ads_q1', purchase_count: 387 },
    { campaign_id: 'facebook_winter', purchase_count: 234 },
    { campaign_id: 'twitter_launch', purchase_count: 142 },
    { campaign_id: 'Unattributed', purchase_count: 69 },
  ],
};

export const mockApiKeys = [
  { id: '1', name: 'Production Key', created_at: '2026-01-15T10:30:00Z' },
  { id: '2', name: 'Development Key', created_at: '2026-02-01T14:20:00Z' },
];

export const mockProperties = {
  available_properties: ['browser', 'os', 'country', 'device_type'],
  breakdown: [
    { value: 'Chrome', count: 4521, unique_users: 2103 },
    { value: 'Safari', count: 2876, unique_users: 1456 },
    { value: 'Firefox', count: 1243, unique_users: 876 },
    { value: 'Edge', count: 654, unique_users: 432 },
    { value: 'Other', count: 234, unique_users: 178 },
  ],
};

export const mockJourneys = [
  { user_id: 'usr_8f3a2b', events: [{ event: 'install', page: '/download' }, { event: 'signup', page: '/register' }, { event: 'app_open', page: '/home' }], total_events: 3 },
  { user_id: 'usr_1c4d9e', events: [{ event: 'install', page: '/download' }, { event: 'app_open', page: '/home' }, { event: 'purchase', page: '/checkout' }], total_events: 3 },
  { user_id: 'usr_7b2f4a', events: [{ event: 'app_open', page: '/home' }, { event: 'signup', page: '/register' }], total_events: 2 },
];

export const mockPaths = [
  { path: ['install', 'signup', 'purchase'], count: 432, percentage: 15.2 },
  { path: ['install', 'app_open', 'signup'], count: 876, percentage: 30.8 },
  { path: ['app_open', 'signup', 'purchase'], count: 312, percentage: 11.0 },
];
