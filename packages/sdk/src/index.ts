import { Queue } from './queue';
import { Transport } from './transport';
import { Session } from './session';

/**
 * MiniHog SDK Configuration
 */
export interface MiniHogConfig {
  apiKey?: string; // Optional for now, can be used for authentication later
  endpoint: string; // API endpoint URL
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
  private config: Required<MiniHogConfig>;
  private queue: Queue;
  private transport: Transport;
  private session: Session;
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    // Default config (will be overridden by init)
    this.config = {
      apiKey: '',
      endpoint: '',
      batchSize: 10,
      flushInterval: 5000,
      enableRetry: true,
      maxRetries: 3,
    };

    this.session = new Session();
    this.transport = new Transport(this.config.endpoint, this.config.enableRetry, this.config.maxRetries);
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
    this.config = {
      ...this.config,
      ...config,
    };

    // Reinitialize transport with new config
    this.transport = new Transport(
      this.config.endpoint,
      this.config.enableRetry,
      this.config.maxRetries
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
    if (!this.config.endpoint) {
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
   */
  private async flushEvents(events: Array<{
    event: string;
    distinct_id: string;
    timestamp: number;
    properties: EventProperties;
  }>): Promise<void> {
    // Send events one by one (in production, you might batch them)
    for (const event of events) {
      await this.transport.send('/track', event);
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
  }
}

// Export singleton instance
const miniHog = new MiniHog();
export default miniHog;

// Also export class for advanced usage
export { MiniHog };

