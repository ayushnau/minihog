/**
 * Example usage of MiniHog SDK
 * 
 * This demonstrates how to use the SDK in a Node.js environment
 * For browser usage, import the SDK and use it similarly
 */

// Note: In a real application, you would import from the built package:
// import MiniHog from 'minihog-sdk';

// For this example, we'll show the API usage pattern
console.log('MiniHog SDK Usage Example\n');

// Initialize the SDK
console.log('1. Initialize SDK:');
console.log(`
  import MiniHog from 'minihog-sdk';
  
  MiniHog.init({
    endpoint: 'http://localhost:3000',
    batchSize: 10,
    flushInterval: 5000,
  });
`);

// Track events
console.log('\n2. Track events:');
console.log(`
  // Simple event
  MiniHog.track('app_open');
  
  // Event with properties
  MiniHog.track('purchase', {
    amount: 299,
    currency: 'INR',
    product_id: 'prod_123'
  });
  
  // Track page views with page name (for user behavior analysis)
  MiniHog.track('page_view', { page: '/home' });
  MiniHog.track('page_view', { page: '/pricing' });
  
  // Track button clicks with page and button name
  MiniHog.track('button_click', { 
    page: '/home',
    button_name: 'signup' 
  });
  
  // Track user actions with properties
  MiniHog.track('signup', { 
    page: '/signup',
    plan: 'premium' 
  });
  
  // Track purchases with details
  MiniHog.track('purchase', { 
    page: '/checkout',
    amount: 299,
    currency: 'USD',
    product_id: 'prod_123'
  });
`);

// Manual flush
console.log('\n3. Manual flush:');
console.log(`
  // Flush all queued events immediately
  MiniHog.flush();
`);

console.log('\n✅ SDK is ready to use!');


