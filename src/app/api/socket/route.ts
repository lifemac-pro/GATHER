import { NextRequest, NextResponse } from "next/server";
import { initializeSocketServer, NextApiResponseWithSocket } from "@/server/socket";

export async function GET(req: NextRequest, res: NextApiResponseWithSocket) {
  try {
    // Initialize Socket.IO server
    initializeSocketServer(req as any, res);
    
    return new NextResponse("Socket.IO server initialized", {
      status: 200,
    });
  } catch (error) {
    console.error("Error initializing Socket.IO server:", error);
    
    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}

export const dynamic = "force-dynamic";
