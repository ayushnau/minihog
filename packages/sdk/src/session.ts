/**
 * Session management for MiniHog SDK
 * Handles distinct_id generation and persistence
 */
export class Session {
  private distinctId: string;
  private readonly STORAGE_KEY = 'minihog_distinct_id';

  constructor() {
    this.distinctId = this.loadOrCreateDistinctId();
  }

  /**
   * Get or create a distinct ID for this user/device
   * Tries to persist across sessions using localStorage (browser) or memory (Node.js)
   */
  getDistinctId(): string {
    return this.distinctId;
  }

  /**
   * Generate a new distinct ID
   */
  private generateDistinctId(): string {
    // Generate a UUID-like identifier
    // Format: minihog_<timestamp>_<random>
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `minihog_${timestamp}_${random}`;
  }

  /**
   * Load distinct ID from storage or create a new one
   */
  private loadOrCreateDistinctId(): string {
    // Try to load from localStorage (browser)
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return stored;
      }

      // Create new and store
      const newId = this.generateDistinctId();
      try {
        localStorage.setItem(this.STORAGE_KEY, newId);
      } catch (e) {
        // localStorage might be disabled, fall back to memory
        console.warn('MiniHog: Could not persist distinct_id to localStorage');
      }
      return newId;
    }

    // Node.js environment - use memory (won't persist across restarts)
    return this.generateDistinctId();
  }

  /**
   * Reset the distinct ID (useful for testing)
   */
  reset(): void {
    this.distinctId = this.generateDistinctId();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, this.distinctId);
      } catch (e) {
        // Ignore
      }
    }
  }
}


