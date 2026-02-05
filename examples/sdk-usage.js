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
  
  // Track page views (for user behavior analysis)
  MiniHog.track('page_view', { page: '/home' });
  MiniHog.track('page_view', { page: '/pricing', page_title: 'Pricing Page' });
  
  // Track button clicks with button IDs and page context
  MiniHog.track('button_click', { 
    page: '/home',
    button_id: 'signup-btn',
    button_name: 'signup',
    button_text: 'Sign Up Now'
  });
  
  // Track form submissions with form IDs
  MiniHog.track('form_submit', { 
    page: '/contact',
    form_id: 'contact-form',
    form_name: 'Contact Form'
  });
  
  // Track link clicks with link IDs
  MiniHog.track('link_click', { 
    page: '/blog',
    link_id: 'read-more-link',
    link_url: '/blog/article-1',
    link_text: 'Read More'
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
  
  // Track other custom events
  MiniHog.track('video_play', {
    page: '/tutorials',
    video_id: 'tutorial-1',
    video_title: 'Getting Started'
  });
`);

// Manual flush
console.log('\n3. Manual flush:');
console.log(`
  // Flush all queued events immediately
  MiniHog.flush();
`);

console.log('\n✅ SDK is ready to use!');


