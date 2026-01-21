/**
 * GPS Dental Training - Clerk Client Library
 * Utilities for working with Clerk authentication
 */
import { createClerkClient } from '@clerk/astro/server';

// Create Clerk client for server-side operations
const clerkClient = createClerkClient({
  secretKey: import.meta.env.CLERK_SECRET_KEY,
});

export { clerkClient };

/**
 * Get a user by their Clerk ID
 */
export async function getClerkUser(userId: string) {
  try {
    return await clerkClient.users.getUser(userId);
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    return null;
  }
}

/**
 * Update user's public metadata
 */
export async function updateUserMetadata(
  userId: string,
  publicMetadata: Record<string, unknown>
) {
  try {
    return await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata,
    });
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return null;
  }
}

/**
 * Get user's role from public metadata
 */
export function getUserRole(
  user: Awaited<ReturnType<typeof getClerkUser>>
): 'admin' | 'staff' | 'customer' {
  if (!user) return 'customer';
  const role = user.publicMetadata?.role as string | undefined;
  if (role === 'admin' || role === 'staff') return role;
  return 'customer';
}
