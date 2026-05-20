import axios, { AxiosError } from 'axios';
import { handleApiError } from './errorHandler';

const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status >= 400) {
      return Promise.reject(new Error(handleApiError(error)));
    }
    return Promise.reject(new Error(handleApiError(error)));
  }
);

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
  unique_users: number;
}

export interface PropertyBreakdown {
  value: string;
  count: number;
  unique_users: number;
}

export interface UserJourneyEvent {
  event_name: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

export interface UserJourney {
  user_id: string;
  events: UserJourneyEvent[];
  total_events: number;
}

export interface CommonPath {
  path: string[];
  path_with_ids?: Array<{ event_name: string; button_id?: string }>;
  count: number;
  percentage: number;
}

export interface EventCountResponse {
  success: boolean;
  event: string;
  from: string;
  to: string;
  total_count: number;
  unique_users: number;
  time_series?: TimeSeriesDataPoint[];
  properties_breakdown?: PropertyBreakdown[];
  available_properties?: string[];
  user_journeys?: UserJourney[];
  common_paths?: CommonPath[];
}

export interface FunnelStep {
  step: number;
  event_name: string;
  users: number;
  drop_off_percentage: number;
}

export interface FunnelResponse {
  success: boolean;
  steps: string[];
  from: string;
  to: string;
  funnel: FunnelStep[];
  total_users_at_first_step: number;
}

export interface RetentionResponse {
  success: boolean;
  cohort: string;
  day: number;
  from: string;
  to: string;
  cohort_size: number;
  retained_users: number;
  retention_percentage: number;
}

export interface AttributionCampaign {
  campaign_id: string | null;
  install_count?: number;
  purchase_count?: number;
}

export interface AttributionResponse {
  success: boolean;
  installs_by_campaign: AttributionCampaign[];
  purchases_by_campaign: AttributionCampaign[];
}

export interface EventNameItem {
  name: string;
  count: number;
}

export interface EventNamesResponse {
  success: boolean;
  event_names: EventNameItem[];
}

export const api = {
  getEventNames: async (): Promise<EventNameItem[]> => {
    const { data } = await apiClient.get<EventNamesResponse>('/api/analytics/event-names');
    return data.event_names;
  },

  getEventCounts: async (
    event: string,
    from: string,
    to: string,
    options?: {
      includeTimeSeries?: boolean;
      includeProperties?: boolean;
      includeJourneys?: boolean;
      propertyKey?: string;
      granularity?: 'day' | 'hour';
    }
  ): Promise<EventCountResponse> => {
    const params: Record<string, string> = { event, from, to };
    if (options?.includeTimeSeries) params.include_time_series = 'true';
    if (options?.includeProperties) params.include_properties = 'true';
    if (options?.includeJourneys) params.include_journeys = 'true';
    if (options?.propertyKey) params.property_key = options.propertyKey;
    if (options?.granularity) params.granularity = options.granularity;
    const { data } = await apiClient.get<EventCountResponse>('/api/analytics/events', { params });
    return data;
  },

  getFunnelAnalysis: async (steps: string[], from: string, to: string): Promise<FunnelResponse> => {
    const { data } = await apiClient.get<FunnelResponse>('/api/analytics/funnel', {
      params: { steps: steps.join(','), from, to },
    });
    return data;
  },

  getRetentionAnalysis: async (
    cohort: string,
    day: number,
    from: string,
    to: string
  ): Promise<RetentionResponse> => {
    const { data } = await apiClient.get<RetentionResponse>('/api/analytics/retention', {
      params: { cohort, day, from, to },
    });
    return data;
  },

  getAttributionAnalytics: async (): Promise<AttributionResponse> => {
    const { data } = await apiClient.get<AttributionResponse>('/api/analytics/attribution');
    return data;
  },

  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const { data } = await apiClient.get<{ status: string; timestamp: string }>('/api/health');
    return data;
  },
};
