import { NextRequest, NextResponse } from "next/server";
import { runScheduledNotifications } from "@/lib/notification-scheduler";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authorization = req.headers.get("authorization");
    if (authorization !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { jobType } = body as { jobType?: "event-reminders" | "survey-invitations" };

    // Run the scheduled notifications
    const result = await runScheduledNotifications(jobType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in cron API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET method for health checks
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authorization = req.headers.get("authorization");
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
