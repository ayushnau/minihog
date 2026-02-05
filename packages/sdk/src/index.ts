import { Queue } from './queue';
import { Transport } from './transport';
import { Session } from './session';

/**
 * Environment types for MiniHog SDK
 */
export type MiniHogEnvironment = 'production' | 'sandbox' | 'development';

/**
 * Endpoint mapping for different environments
 */
const ENDPOINT_MAP: Record<MiniHogEnvironment, string> = {
  production: 'https://backendapiserver.vercel.app',
  sandbox: 'https://backendapiserver.vercel.app', // Same as production for now
  development: 'http://localhost:3000', // Local development
};

/**
 * MiniHog SDK Configuration
 */
export interface MiniHogConfig {
  apiKey?: string; // Optional for now, can be used for authentication later
  environment?: MiniHogEnvironment; // Environment: 'production' | 'sandbox' | 'development' (default: 'production')
  batchSize?: number; // Number of events to batch before sending (default: 10)
  flushInterval?: number; // Milliseconds between automatic flushes (default: 5000)
  enableRetry?: boolean; // Enable retry logic (default: true)
  maxRetries?: number; // Maximum number of retries (default: 3)
}

/**
 * Event properties
 */
export interface EventProperties {
  [key: string]: any;
}

/**
 * Main MiniHog SDK class
 */
class MiniHog {
  private config: Required<MiniHogConfig> & { endpoint: string };
  private queue: Queue;
  private transport: Transport;
  private session: Session;
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    // Default config (will be overridden by init)
    const defaultEnvironment: MiniHogEnvironment = 'production';
    this.config = {
      apiKey: '',
      environment: defaultEnvironment,
      endpoint: ENDPOINT_MAP[defaultEnvironment],
      batchSize: 10,
      flushInterval: 5000,
      enableRetry: true,
      maxRetries: 3,
    };

    this.session = new Session();
    this.transport = new Transport(this.config.endpoint, this.config.enableRetry, this.config.maxRetries, this.config.apiKey);
    this.queue = new Queue(this.config.batchSize, (events) => this.flushEvents(events));

    // Setup page unload handler for browser environments
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Initialize the SDK with configuration
   */
  init(config: MiniHogConfig): void {
    const environment = config.environment || 'production';
    const endpoint = ENDPOINT_MAP[environment];

    this.config = {
      ...this.config,
      ...config,
      environment,
      endpoint,
    };

    // Reinitialize transport with new config
    this.transport = new Transport(
      this.config.endpoint,
      this.config.enableRetry,
      this.config.maxRetries,
      this.config.apiKey
    );

    // Reinitialize queue with new batch size
    this.queue = new Queue(this.config.batchSize, (events) => this.flushEvents(events));

    // Start automatic flush timer
    this.startFlushTimer();
  }

  /**
   * Track an event
   */
  track(eventName: string, properties?: EventProperties): void {
    if (!this.config.endpoint || !this.config.environment) {
      console.warn('MiniHog: SDK not initialized. Call init() first.');
      return;
    }

    const event = {
      event: eventName,
      distinct_id: this.session.getDistinctId(),
      timestamp: Date.now(),
      properties: properties || {},
    };

    this.queue.add(event);

    // Auto-flush if queue is full
    if (this.queue.size() >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush all queued events immediately
   */
  flush(): void {
    const events = this.queue.flush();
    if (events.length > 0) {
      this.flushEvents(events);
    }
  }

  /**
   * Internal method to send events to the API
   * Sends all events in a single batch request for better performance
   */
  private async flushEvents(events: Array<{
    event: string;
    distinct_id: string;
    timestamp: number;
    properties: EventProperties;
  }>): Promise<void> {
    if (events.length === 0) {
      return;
    }

    // Send all events in a single batch request
    // This reduces HTTP overhead and improves performance
    if (events.length === 1) {
      // Single event - use regular endpoint for backward compatibility
      await this.transport.send('/track', events[0]);
    } else {
      // Multiple events - use batch endpoint
      await this.transport.send('/track/batch', {
        events: events,
      });
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Reset the SDK (useful for testing)
   */
  reset(): void {
    this.queue.clear();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.session.reset();
  }

  /**
   * Get the current distinct ID (useful for debugging)
   * This will check localStorage and update if it was cleared
   */
  getDistinctId(): string {
    return this.session.getDistinctId();
  }
}

// Export singleton instance
const miniHog = new MiniHog();
export default miniHog;

// Also export class for advanced usage
export { MiniHog };


