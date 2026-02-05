import { Retry } from './retry';

/**
 * Transport layer for sending events to the API
 * Handles network requests with retry logic
 */
export class Transport {
  private endpoint: string;
  private apiKey?: string;
  private retry: Retry;

  constructor(endpoint: string, enableRetry: boolean, maxRetries: number, apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.retry = new Retry(enableRetry, maxRetries);
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey?: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Send data to the API endpoint
   * Uses native fetch (available in Node.js 18+ and all modern browsers)
   */
  async send(path: string, data: Record<string, any>): Promise<void> {
    const url = `${this.endpoint}${path}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key to headers if provided
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    await this.retry.execute(async () => {
      // fetch is available in Node.js 18+ and all modern browsers
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    });
  }
}

