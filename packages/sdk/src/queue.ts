/**
 * Event queue for batching events before sending
 */
export class Queue {
  private events: Array<{
    event: string;
    distinct_id: string;
    timestamp: number;
    properties: Record<string, any>;
  }> = [];
  private readonly batchSize: number;
  private readonly onFlush: (events: Array<{
    event: string;
    distinct_id: string;
    timestamp: number;
    properties: Record<string, any>;
  }>) => void;

  constructor(
    batchSize: number,
    onFlush: (events: Array<{
      event: string;
      distinct_id: string;
      timestamp: number;
      properties: Record<string, any>;
    }>) => void
  ) {
    this.batchSize = batchSize;
    this.onFlush = onFlush;
  }

  /**
   * Add an event to the queue
   */
  add(event: {
    event: string;
    distinct_id: string;
    timestamp: number;
    properties: Record<string, any>;
  }): void {
    this.events.push(event);
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.events.length;
  }

  /**
   * Flush all events from the queue and return them
   */
  flush(): Array<{
    event: string;
    distinct_id: string;
    timestamp: number;
    properties: Record<string, any>;
  }> {
    const events = [...this.events];
    this.events = [];
    return events;
  }

  /**
   * Clear the queue without flushing
   */
  clear(): void {
    this.events = [];
  }
}

