import axios, { AxiosError } from 'axios';
import { handleApiError } from './errorHandler';

// For analytics, we use Next.js API routes (same domain, cookies work)
// For health check, we might still need the external API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: '', // Use relative URLs for Next.js API routes (same domain)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for JWT authentication
});

// Add request interceptor to include JWT token from cookie
apiClient.interceptors.request.use(
  (config) => {
    // Browser will automatically send cookies with withCredentials: true
    // No need to manually extract token - it's sent via cookie header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // 304 Not Modified is a valid success response
    if (response.status === 304) {
      return response;
    }
    return response;
  },
  (error: AxiosError) => {
    // Only handle actual errors (not 2xx or 3xx responses)
    if (error.response && error.response.status >= 400) {
      const userFriendlyError = handleApiError(error);
      return Promise.reject(new Error(userFriendlyError));
    }
    // For network errors or other issues
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
  // Get event counts (uses Next.js API route proxy - cookies work on same domain)
  getEventCounts: async (
    event: string,
    from: string,
    to: string
  ): Promise<EventCountResponse> => {
    const response = await apiClient.get('/api/analytics/events', {
      params: { event, from, to },
    });
    return response.data;
  },

  // Get funnel analysis (uses Next.js API route proxy - cookies work on same domain)
  getFunnelAnalysis: async (
    steps: string[],
    from: string,
    to: string
  ): Promise<FunnelResponse> => {
    const response = await apiClient.get('/api/analytics/funnel', {
      params: { steps: steps.join(','), from, to },
    });
    return response.data;
  },

  // Get retention analysis (uses Next.js API route proxy - cookies work on same domain)
  getRetentionAnalysis: async (
    cohort: string,
    day: number,
    from: string,
    to: string
  ): Promise<RetentionResponse> => {
    const response = await apiClient.get('/api/analytics/retention', {
      params: { cohort, day, from, to },
    });
    return response.data;
  },

  // Get attribution analytics (uses Next.js API route proxy - cookies work on same domain)
  getAttributionAnalytics: async (): Promise<AttributionResponse> => {
    const response = await apiClient.get('/api/analytics/attribution');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

