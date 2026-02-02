/**
 * Global error handler for frontend
 * Converts technical errors to user-friendly messages
 */

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

export function handleApiError(error: any): string {
  // Network errors
  if (!error.response) {
    if (error.message?.includes('fetch')) {
      return 'Unable to connect to the server. Please check your connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Use server-provided error message if available
  if (data?.error && typeof data.error === 'string') {
    return data.error;
  }

  // Status-based error messages
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This resource already exists.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Wrapper for API calls with error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  defaultError: string = 'An error occurred. Please try again.'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error: any) {
    const errorMessage = handleApiError(error);
    console.error('API Error:', error);
    return { data: null, error: errorMessage };
  }
}


