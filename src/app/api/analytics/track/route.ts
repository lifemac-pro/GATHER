import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Get the user ID from Clerk for verification
    const { userId: authUserId } = getAuth(request);
    
    // Parse the request body
    const body = await request.json();
    const { userId, eventType, properties } = body;
    
    // Verify that the user ID matches the authenticated user
    if (!authUserId || authUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Track the event
    await trackEvent({
      userId,
      eventType,
      properties,
      request,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in analytics API route:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
