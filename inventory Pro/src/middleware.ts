// Cloudflare Access middleware - Protect all routes
// Note: Actual Access policies are configured in Cloudflare Zero Trust dashboard
// This middleware checks for CF-Access-Authenticated-User-Email header

import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, url } = context;
  
  // Allow public assets
  if (url.pathname.startsWith('/favicon') || 
      url.pathname.startsWith('/_astro') ||
      url.pathname.startsWith('/api/public')) {
    return next();
  }

  // Check for Cloudflare Access authentication
  // In production, this header is automatically set by Cloudflare Access
  const userEmail = request.headers.get('cf-access-authenticated-user-email');
  const cfAccessToken = request.headers.get('cf-access-token');

  // In development/local, allow access but log warning
  if (!userEmail && process.env.NODE_ENV === 'production') {
    // In production with Cloudflare Access, users should be redirected
    // If header is missing, they're not authenticated
    return new Response('Unauthorized - Cloudflare Access required', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Store user email in context for use in pages
  context.locals.userEmail = userEmail || 'dev@local';
  context.locals.isAuthenticated = !!userEmail || process.env.NODE_ENV !== 'production';

  return next();
};

