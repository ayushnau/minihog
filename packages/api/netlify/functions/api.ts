import serverless from 'serverless-http';
import app from '../../src/index';

// Wrap Express app as a Netlify Function
// serverless-http handles the Lambda event → Express req/res conversion
export const handler = serverless(app);
