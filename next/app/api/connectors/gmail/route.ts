import { NextRequest, NextResponse } from "next/server";
import {
  gmailPushNotificationSchema,
  gmailNotificationDataSchema,
} from "@/lib/connectors/types";
import {
  verifyGmailWebhook,
  logConnectorActivity,
  createTaskFromConnector,
  findUserByEmail,
  getUserToggles,
  classifyTaskBasic,
} from "@/lib/connectors/utils";

/**
 * Gmail Push Notification Webhook Handler
 *
 * Google Cloud Pub/Sub sends notifications here when new emails arrive.
 * This endpoint:
 * 1. Verifies the webhook authenticity
 * 2. Decodes the notification
 * 3. Looks up the user by email
 * 4. Checks if autoReply is enabled
 * 5. Creates an agent task for processing
 *
 * Setup: Configure Gmail API watch on user's inbox to push to this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const authHeader = request.headers.get("authorization");
    if (!verifyGmailWebhook(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the push notification
    const body = await request.json();
    const parseResult = gmailPushNotificationSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("Invalid Gmail notification format:", parseResult.error);
      return NextResponse.json(
        { error: "Invalid notification format" },
        { status: 400 }
      );
    }

    const notification = parseResult.data;

    // Decode the base64 message data
    const decodedData = Buffer.from(
      notification.message.data,
      "base64"
    ).toString("utf-8");
    let notificationData;

    try {
      notificationData = gmailNotificationDataSchema.parse(
        JSON.parse(decodedData)
      );
    } catch {
      console.error("Failed to parse notification data:", decodedData);
      return NextResponse.json(
        { error: "Invalid notification data" },
        { status: 400 }
      );
    }

    // Find user by email address
    const user = await findUserByEmail(notificationData.emailAddress);

    if (!user) {
      console.warn(
        `User not found for email: ${notificationData.emailAddress}`
      );
      // Acknowledge the notification to prevent retries
      return NextResponse.json({ received: true, processed: false });
    }

    const userId = user._id.toString();

    // Check if auto-reply is enabled for this user
    const toggles = await getUserToggles(userId);

    if (!toggles.autoReply) {
      await logConnectorActivity(
        userId,
        "gmail",
        "skipped",
        "Email notification received but autoReply is disabled",
        { historyId: notificationData.historyId }
      );
      return NextResponse.json({
        received: true,
        processed: false,
        reason: "autoReply disabled",
      });
    }

    // Log the incoming email notification
    await logConnectorActivity(
      userId,
      "gmail",
      "email_received",
      `New email notification (historyId: ${notificationData.historyId})`,
      {
        historyId: notificationData.historyId,
        messageId: notification.message.messageId,
      }
    );

    // Create a connector event
    const connectorEvent = {
      source: "gmail" as const,
      eventType: "email_received" as const,
      externalId: notification.message.messageId,
      payload: {
        historyId: notificationData.historyId,
        emailAddress: notificationData.emailAddress,
        messageId: notification.message.messageId,
        // In production, you would fetch the actual email content here
        // using the Gmail API with the historyId
      },
      timestamp: new Date(notification.message.publishTime),
    };

    // Classify the task (basic classification, AI can enhance this)
    const classification = classifyTaskBasic(
      connectorEvent.source,
      connectorEvent.eventType,
      connectorEvent.payload
    );

    // Create agent task
    const taskId = await createTaskFromConnector(
      userId,
      connectorEvent,
      classification
    );

    return NextResponse.json({
      received: true,
      processed: true,
      taskId,
      requiresApproval: classification.requiresApproval,
    });
  } catch (error) {
    console.error("Gmail webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Gmail webhook verification (GET request)
 * Used by Google to verify the endpoint when setting up Pub/Sub subscription
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    // Return the challenge token to verify the endpoint
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({
    status: "Gmail webhook endpoint ready",
    timestamp: new Date().toISOString(),
  });
}
