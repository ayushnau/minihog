/**
 * Retry logic for failed API requests
 * Uses exponential backoff
 */
export class Retry {
  private enabled: boolean;
  private maxRetries: number;
  private readonly baseDelay = 1000; // 1 second base delay

  constructor(enabled: boolean, maxRetries: number) {
    this.enabled = enabled;
    this.maxRetries = maxRetries;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt < this.maxRetries) {
          // Exponential backoff: delay = baseDelay * 2^attempt
          const delay = this.baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    console.error('MiniHog: Failed to send event after retries:', lastError);
    throw lastError;
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


