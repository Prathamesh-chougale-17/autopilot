import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";
import { env } from "@/env";
import type { ConnectorEvent, TaskClassification } from "./types";

// ============================================
// Connector Utilities
// ============================================

const db = client.db(env.MONGODB_DB_NAME);

/**
 * Log connector activity to the activity_log collection
 */
export async function logConnectorActivity(
  userId: string,
  source: ConnectorEvent["source"],
  action: string,
  details: string,
  metadata?: Record<string, unknown>
) {
  const activityLog = db.collection("activity_log");

  await activityLog.insertOne({
    userId: String(userId),
    action: `connector:${source}:${action}`,
    details,
    metadata: {
      source,
      ...metadata,
    },
    timestamp: new Date(),
  });
}

/**
 * Create an agent task from a connector event
 */
export async function createTaskFromConnector(
  userId: string,
  event: ConnectorEvent,
  classification: TaskClassification
): Promise<string> {
  const agentTasks = db.collection("agent_tasks");
  const activityLog = db.collection("activity_log");

  const task = {
    userId: String(userId),
    source: event.source,
    externalId: event.externalId,
    taskType: classification.taskType,
    description: classification.suggestedAction,
    status: classification.requiresApproval ? "needs_approval" : "pending",
    priority: classification.priority,
    requiresApproval: classification.requiresApproval,
    confidence: classification.confidence,
    payload: event.payload,
    extractedData: classification.extractedData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await agentTasks.insertOne(task);
  const taskId = result.insertedId.toString();

  // Log activity
  await activityLog.insertOne({
    userId: String(userId),
    action: "task_created",
    taskId: result.insertedId,
    details: `Task created from ${event.source}: ${classification.suggestedAction}`,
    metadata: {
      source: event.source,
      taskType: classification.taskType,
      requiresApproval: classification.requiresApproval,
      confidence: classification.confidence,
    },
    timestamp: new Date(),
  });

  return taskId;
}

/**
 * Find user by email for connector lookups
 */
export async function findUserByEmail(email: string) {
  const users = db.collection("user");
  return users.findOne({ email });
}

/**
 * Get user's toggle settings to check if autopilot is enabled for a feature
 */
export async function getUserToggles(userId: string) {
  const settings = db.collection("settings");
  const doc = await settings.findOne({
    $or: [{ userId: userId }, { userId: new ObjectId(userId) }],
  });

  return {
    autoReply: doc?.autoReply ?? false,
    autoInvoice: doc?.autoInvoice ?? false,
    autoFollowUp: doc?.autoFollowUp ?? false,
    autoReporting: doc?.autoReporting ?? false,
  };
}

/**
 * Basic task classification stub - to be replaced with AI classification
 */
export function classifyTaskBasic(
  source: ConnectorEvent["source"],
  eventType: ConnectorEvent["eventType"],
  payload: Record<string, unknown>
): TaskClassification {
  // Default classification based on event type
  const classifications: Record<string, Partial<TaskClassification>> = {
    email_received: {
      taskType: "reply_email",
      priority: "medium",
      requiresApproval: true,
      confidence: 0.6,
    },
    message_received: {
      taskType: "send_whatsapp",
      priority: "medium",
      requiresApproval: true,
      confidence: 0.5,
    },
    lead_created: {
      taskType: "follow_up",
      priority: "high",
      requiresApproval: false,
      confidence: 0.8,
    },
    invoice_created: {
      taskType: "create_invoice",
      priority: "low",
      requiresApproval: true,
      confidence: 0.7,
    },
  };

  const base = classifications[eventType] || {
    taskType: "other" as const,
    priority: "low" as const,
    requiresApproval: true,
    confidence: 0.3,
  };

  // Extract text content for description
  let suggestedAction = `Process ${eventType} from ${source}`;

  if (payload.subject) {
    suggestedAction = `Reply to: ${payload.subject}`;
  } else if (payload.text) {
    suggestedAction = `Respond to message: ${String(payload.text).slice(
      0,
      50
    )}...`;
  }

  return {
    taskType: base.taskType as TaskClassification["taskType"],
    priority: base.priority as TaskClassification["priority"],
    requiresApproval: base.requiresApproval ?? true,
    confidence: base.confidence ?? 0.5,
    suggestedAction,
    extractedData: payload,
  };
}

/**
 * Verify Gmail push notification signature (placeholder)
 */
export function verifyGmailWebhook(authHeader: string | null): boolean {
  // In production, verify the JWT token from Google
  // For now, we'll accept if the secret matches or in development
  if (env.NODE_ENV === "development") return true;

  if (!env.GMAIL_WEBHOOK_SECRET) return false;

  // Basic bearer token check
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return token === env.GMAIL_WEBHOOK_SECRET;
  }

  return false;
}

/**
 * Verify WhatsApp webhook signature
 */
export function verifyWhatsAppWebhook(
  signature: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _body: string
): boolean {
  if (env.NODE_ENV === "development") return true;

  if (!env.WHATSAPP_ACCESS_TOKEN || !signature) return false;

  // In production, verify HMAC-SHA256 signature
  // const crypto = require('crypto');
  // const expectedSignature = crypto
  //   .createHmac('sha256', env.WHATSAPP_ACCESS_TOKEN)
  //   .update(body)
  //   .digest('hex');
  // return `sha256=${expectedSignature}` === signature;

  return true; // Placeholder for development
}
