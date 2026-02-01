import axios, { AxiosError } from 'axios';
import { handleApiError } from './errorHandler';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Transform error to user-friendly message
    const userFriendlyError = handleApiError(error);
    return Promise.reject(new Error(userFriendlyError));
  }
);

// Types
export interface EventCountResponse {
  success: boolean;
  event: string;
  from: string;
  to: string;
  total_count: number;
  unique_users: number;
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

// API functions
export const api = {
  // Get event counts
  getEventCounts: async (
    event: string,
    from: string,
    to: string
  ): Promise<EventCountResponse> => {
    const response = await apiClient.get('/analytics/events', {
      params: { event, from, to },
    });
    return response.data;
  },

  // Get funnel analysis
  getFunnelAnalysis: async (
    steps: string[],
    from: string,
    to: string
  ): Promise<FunnelResponse> => {
    const response = await apiClient.get('/analytics/funnel', {
      params: { steps: steps.join(','), from, to },
    });
    return response.data;
  },

  // Get retention analysis
  getRetentionAnalysis: async (
    cohort: string,
    day: number,
    from: string,
    to: string
  ): Promise<RetentionResponse> => {
    const response = await apiClient.get('/analytics/retention', {
      params: { cohort, day, from, to },
    });
    return response.data;
  },

  // Get attribution analytics
  getAttributionAnalytics: async (): Promise<AttributionResponse> => {
    const response = await apiClient.get('/analytics/attribution');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

