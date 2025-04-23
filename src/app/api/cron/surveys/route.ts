import { NextResponse } from "next/server";
import { processSurveySchedules } from "@/lib/survey-scheduler";
import { logger } from "@/lib/logger";

/**
 * API route to process survey schedules
 * This should be called by a cron job every hour
 *
 * Example cron schedule: 0 * * * * (every hour)
 */
export async function GET(request: Request) {
  try {
    // Check for authorization header (optional, but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process survey schedules
    logger.info("Starting survey schedule processing");
    await processSurveySchedules();
    logger.info("Survey schedule processing completed");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error processing survey schedules:", error);

    return NextResponse.json(
      { error: "Failed to process survey schedules" },
      { status: 500 },
    );
  }
}
