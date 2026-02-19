export function handleApiError(error: unknown): string {
  if (!error || typeof (error as { response?: unknown }).response === 'undefined') {
    return (error as Error)?.message?.includes('fetch')
      ? 'Unable to connect to the server. Please check your connection.'
      : 'An unexpected error occurred. Please try again.';
  }
  const err = error as { response?: { status?: number; data?: { error?: string } } };
  const status = err.response?.status;
  const data = err.response?.data;
  if (data?.error && typeof data.error === 'string') return data.error;
  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Please sign in to continue.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'This resource already exists.';
    case 429: return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503: return 'Server error. Please try again later.';
    default: return 'An error occurred. Please try again.';
  }
}
