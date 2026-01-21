/**
 * GPS Dental Training - Middleware
 * Handles authentication with Clerk and route protection
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/checkout(.*)',
  '/api/user(.*)',
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

export const onRequest = clerkMiddleware((auth, context) => {
  const { userId, sessionClaims } = auth();

  // Protect routes that require authentication
  if (isProtectedRoute(context.request) && !userId) {
    return auth().redirectToSignIn();
  }

  // Protect admin routes - check for admin role in public metadata
  if (isAdminRoute(context.request)) {
    if (!userId) {
      return auth().redirectToSignIn();
    }

    // Check if user has admin role in their metadata
    const userRole = sessionClaims?.public_metadata?.role as string | undefined;
    if (userRole !== 'admin' && userRole !== 'staff') {
      // Redirect to home if not an admin
      return new Response(null, {
        status: 302,
        headers: { Location: '/' },
      });
    }
  }
});
