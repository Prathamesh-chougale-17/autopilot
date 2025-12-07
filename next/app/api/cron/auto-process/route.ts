import { NextRequest, NextResponse } from "next/server";
import { processIncomingEmails } from "@/lib/ai/email-processor";
import client from "@/lib/mongodb";
import { env } from "@/env";

/**
 * Background cron job to automatically process new emails
 * This endpoint is called by GitHub Actions every 10 minutes
 * Protected with CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret from GitHub Actions
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users who have autoProcess enabled from settings
    const db = client.db(env.MONGODB_DB_NAME);
    const settings = db.collection("settings");
    const users = await settings.find({ autoProcess: true }).toArray();

    const results = [];

    // Process emails for each user with autoProcess enabled
    for (const userSetting of users) {
      try {
        const result = await processIncomingEmails(String(userSetting.userId), {
          maxEmails: 20,
          autoProcess: false, // Don't auto-send, create approvals
          category: userSetting.gmailCategory || "primary",
          includeProcessed: false,
        });

        results.push({
          userId: String(userSetting.userId),
          processed: result.processed,
          tasks: result.tasks.length,
        });
      } catch (error) {
        console.error(
          `Failed to process emails for user ${userSetting.userId}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auto-process cron error:", error);
    return NextResponse.json(
      { error: "Failed to process emails", details: String(error) },
      { status: 500 }
    );
  }
}
