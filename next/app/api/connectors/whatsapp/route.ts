import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { whatsappWebhookSchema } from "@/lib/connectors/types";
import {
  verifyWhatsAppWebhook,
  logConnectorActivity,
  createTaskFromConnector,
  getUserToggles,
  classifyTaskBasic,
} from "@/lib/connectors/utils";
import client from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const db = client.db(env.MONGODB_DB_NAME);

/**
 * WhatsApp Cloud API Webhook Handler
 *
 * Meta sends webhook events here when messages are received/status updates occur.
 * This endpoint:
 * 1. Handles webhook verification (GET)
 * 2. Processes incoming messages (POST)
 * 3. Creates agent tasks for auto-reply if enabled
 *
 * Setup: Configure in Meta Developer Console -> WhatsApp -> Configuration -> Webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify webhook signature
    if (!verifyWhatsAppWebhook(signature, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parseResult = whatsappWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("Invalid WhatsApp webhook format:", parseResult.error);
      // Still acknowledge to prevent retries
      return NextResponse.json({ received: true });
    }

    const webhook = parseResult.data;

    // Process each entry
    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Process incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await processIncomingMessage(
              message,
              value.contacts?.[0],
              value.metadata.phone_number_id
            );
          }
        }

        // Process status updates (sent, delivered, read)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            await processMessageStatus(status);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * WhatsApp webhook verification (GET request)
 * Required by Meta to verify the webhook URL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify the webhook
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Process an incoming WhatsApp message
 */
async function processIncomingMessage(
  message: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
  },
  contact: { profile: { name: string }; wa_id: string } | undefined,
  phoneNumberId: string
) {
  // Find user associated with this WhatsApp business number
  // In a real implementation, you'd have a mapping of phone_number_id to user
  const settings = db.collection("settings");
  const userSettings = await settings.findOne({
    whatsappPhoneNumberId: phoneNumberId,
  });

  if (!userSettings) {
    console.warn(`No user found for WhatsApp phone number: ${phoneNumberId}`);
    return;
  }

  const userId = userSettings.userId.toString();

  // Check if auto-reply is enabled
  const toggles = await getUserToggles(userId);

  if (!toggles.autoReply) {
    await logConnectorActivity(
      userId,
      "whatsapp",
      "skipped",
      `Message from ${
        contact?.profile.name || message.from
      } skipped - autoReply disabled`,
      { messageId: message.id, from: message.from }
    );
    return;
  }

  // Log the incoming message
  await logConnectorActivity(
    userId,
    "whatsapp",
    "message_received",
    `Message from ${contact?.profile.name || message.from}: ${
      message.text?.body?.slice(0, 50) || "[non-text message]"
    }...`,
    {
      messageId: message.id,
      from: message.from,
      contactName: contact?.profile.name,
      messageType: message.type,
    }
  );

  // Create connector event
  const connectorEvent = {
    source: "whatsapp" as const,
    eventType: "message_received" as const,
    externalId: message.id,
    payload: {
      from: message.from,
      contactName: contact?.profile.name,
      messageType: message.type,
      text: message.text?.body,
      timestamp: message.timestamp,
      phoneNumberId,
    },
    timestamp: new Date(parseInt(message.timestamp) * 1000),
  };

  // Classify and create task
  const classification = classifyTaskBasic(
    connectorEvent.source,
    connectorEvent.eventType,
    connectorEvent.payload
  );

  await createTaskFromConnector(userId, connectorEvent, classification);

  // Also update or create CRM contact
  await upsertCrmContact(userId, message.from, contact?.profile.name);
}

/**
 * Process message status updates
 */
async function processMessageStatus(status: {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}) {
  // Update the agent task status if this is a message we sent
  const agentTasks = db.collection("agent_tasks");

  await agentTasks.updateOne(
    { "payload.sentMessageId": status.id },
    {
      $set: {
        "payload.deliveryStatus": status.status,
        "payload.statusTimestamp": status.timestamp,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Create or update CRM contact from WhatsApp message
 */
async function upsertCrmContact(
  userId: string,
  phoneNumber: string,
  name?: string
) {
  const contacts = db.collection("crm_contacts");

  await contacts.updateOne(
    { userId: new ObjectId(userId), phone: phoneNumber },
    {
      $set: {
        name: name || "Unknown",
        phone: phoneNumber,
        source: "whatsapp",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId: new ObjectId(userId),
        createdAt: new Date(),
        status: "lead",
      },
    },
    { upsert: true }
  );
}
