import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Define public routes that don't require authentication
const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in',
  '/sign-in/(.*)',
  '/sign-up',
  '/sign-up/(.*)',
  '/api/trpc',
  '/api/trpc/(.*)',
  '/events',
  '/events/:id',
  '/api/webhook',
  '/api/webhook/(.*)',
]);

/**
 * Add security headers to all responses
 */
function addSecurityHeaders(response: NextResponse) {
  // Set security headers
  const headers = response.headers;

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Enable XSS protection in browsers
  headers.set('X-XSS-Protection', '1; mode=block');

  // Strict CSP for production
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://upload-widget.uploadthing.com https://cdn.clerk.io; style-src 'self' 'unsafe-inline' https://cdn.clerk.io; img-src 'self' data: https://cdn.clerk.io https://utfs.io https://images.unsplash.com; font-src 'self' data:; connect-src 'self' https://api.clerk.io https://clerk.io https://utfs.io https://uploadthing.com; frame-src 'self' https://clerk.io; object-src 'none';"
    );
  }

  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

export default clerkMiddleware({
  // Allow public routes without authentication
  publicRoutes,

  // Add security headers and handle errors
  afterAuth: (auth, req, evt) => {
    try {
      // Check for admin routes
      const url = new URL(req.url);
      const isAdminRoute = url.pathname.startsWith('/admin');

      // If the user is trying to access admin routes and isn't signed in
      if (isAdminRoute && !auth.userId) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return addSecurityHeaders(NextResponse.redirect(signInUrl));
      }

      // Continue with the request
      const response = NextResponse.next();

      // Add security headers
      return addSecurityHeaders(response);
    } catch (error) {
      // Log any errors
      logger.error('Middleware error:', { error: error instanceof Error ? error.message : String(error) });

      // Continue with the request even if there's an error in our custom code
      return addSecurityHeaders(NextResponse.next());
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
