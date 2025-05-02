/**
 * Client-side analytics functions that are safe to use in client components
 */

// Track a user event
export async function trackUserEvent({
  userId,
  eventType,
  properties = {},
}: {
  userId: string;
  eventType: string;
  properties?: Record<string, any>;
}) {
  try {
    // Make a fetch request to our API endpoint
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        eventType,
        properties,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track event');
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking user event:', error);
    return { success: false, error };
  }
}
