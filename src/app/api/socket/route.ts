import { NextResponse } from 'next/server';
import { initializeSocketServer } from '@/server/socket';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const res = new NextResponse();
    // Initialize Socket.IO with the response object
    await initializeSocketServer(req, res);
    
    return new NextResponse('Socket initialized', { status: 200 });
  } catch (error) {
    console.error('Socket initialization error:', error);
    return new NextResponse('Failed to initialize socket', { status: 500 });
  }
}
