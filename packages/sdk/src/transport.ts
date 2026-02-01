import { Retry } from './retry';

/**
 * Transport layer for sending events to the API
 * Handles network requests with retry logic
 */
export class Transport {
  private endpoint: string;
  private retry: Retry;

  constructor(endpoint: string, enableRetry: boolean, maxRetries: number) {
    this.endpoint = endpoint;
    this.retry = new Retry(enableRetry, maxRetries);
  }

  /**
   * Send data to the API endpoint
   * Uses native fetch (available in Node.js 18+ and all modern browsers)
   */
  async send(path: string, data: Record<string, any>): Promise<void> {
    const url = `${this.endpoint}${path}`;

    await this.retry.execute(async () => {
      // fetch is available in Node.js 18+ and all modern browsers
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

