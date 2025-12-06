import { generateObject } from "ai";
import { z } from "zod";
import { aiModel } from "@/ai/config";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";
import { env } from "@/env";
import {
  getRecentEmails,
  replyToEmail,
  type EmailMessage,
} from "@/lib/connectors/gmail";

// ============================================
// AI Email Processor
// ============================================

const db = client.db(env.MONGODB_DB_NAME);

// Email classification schema
const emailClassificationSchema = z.object({
  category: z.enum([
    "inquiry",
    "support",
    "complaint",
    "sales",
    "follow_up",
    "spam",
    "newsletter",
    "personal",
    "urgent",
    "other",
  ]),
  priority: z.enum(["high", "medium", "low"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  requiresResponse: z.boolean(),
  suggestedAction: z.string(),
  keyPoints: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type EmailClassification = z.infer<typeof emailClassificationSchema>;

// Auto-reply schema
const autoReplySchema = z.object({
  shouldReply: z.boolean(),
  replyBody: z.string(),
  tone: z.enum(["professional", "friendly", "formal", "casual"]),
  requiresHumanReview: z.boolean(),
  reason: z.string(),
});

export type AutoReply = z.infer<typeof autoReplySchema>;

/**
 * Classify an email using AI
 */
export async function classifyEmail(
  email: EmailMessage
): Promise<EmailClassification> {
  const { object } = await generateObject({
    model: aiModel,
    schema: emailClassificationSchema,
    prompt: `Analyze this email and classify it:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body:
${email.body || email.snippet}

Provide:
- Category of the email
- Priority level (high for urgent business matters, medium for normal, low for newsletters/spam)
- Sentiment of the sender
- Whether it requires a response
- Suggested action to take
- Key points from the email
- Your confidence in this classification (0-1)`,
  });

  return object;
}

/**
 * Generate an auto-reply for an email
 */
export async function generateAutoReply(
  email: EmailMessage,
  classification: EmailClassification,
  businessContext?: string
): Promise<AutoReply> {
  const { object } = await generateObject({
    model: aiModel,
    schema: autoReplySchema,
    prompt: `Generate an appropriate auto-reply for this email.

Email Details:
From: ${email.from}
Subject: ${email.subject}
Body:
${email.body || email.snippet}

Classification:
- Category: ${classification.category}
- Priority: ${classification.priority}
- Sentiment: ${classification.sentiment}
- Key Points: ${classification.keyPoints.join(", ")}

${businessContext ? `Business Context: ${businessContext}` : ""}

Guidelines:
- Be professional and helpful
- Address the key points from the email
- If the email is spam or newsletter, set shouldReply to false
- If the matter is complex or sensitive, set requiresHumanReview to true
- Keep the reply concise but complete
- Match the appropriate tone based on the email context

Generate a reply that:
1. Acknowledges receipt (if appropriate)
2. Addresses the main concern or question
3. Provides helpful next steps if applicable`,
  });

  return object;
}

/**
 * Process incoming emails with AI and create tasks
 */
export async function processIncomingEmails(
  userId: string,
  options?: { maxEmails?: number; autoProcess?: boolean }
): Promise<{
  processed: number;
  tasks: string[];
  autoReplied: number;
}> {
  const { maxEmails = 10, autoProcess = false } = options || {};

  // Get unread emails
  const emails = await getRecentEmails(userId, maxEmails, "is:unread");

  const tasks: string[] = [];
  let autoReplied = 0;

  // Get user's toggle settings
  const settings = db.collection("settings");
  const userSettings = await settings.findOne({ userId: new ObjectId(userId) });
  const autoReplyEnabled = userSettings?.autoReply ?? false;

  for (const email of emails) {
    try {
      // Classify the email
      const classification = await classifyEmail(email);

      // Skip spam/newsletters
      if (
        classification.category === "spam" ||
        classification.category === "newsletter"
      ) {
        await logActivity(userId, "email:skipped", {
          emailId: email.id,
          reason: classification.category,
        });
        continue;
      }

      // Create agent task
      const taskId = await createEmailTask(userId, email, classification);
      tasks.push(taskId);

      // Generate auto-reply if enabled
      if (autoReplyEnabled && classification.requiresResponse && autoProcess) {
        const autoReply = await generateAutoReply(email, classification);

        if (autoReply.shouldReply && !autoReply.requiresHumanReview) {
          // Send auto-reply
          await replyToEmail(userId, email, autoReply.replyBody, false);
          autoReplied++;

          // Update task status
          await updateTaskStatus(taskId, "completed", {
            autoReplied: true,
            replyBody: autoReply.replyBody,
          });

          await logActivity(userId, "email:auto_replied", {
            emailId: email.id,
            taskId,
            tone: autoReply.tone,
          });
        } else if (autoReply.requiresHumanReview) {
          // Store draft reply for human approval
          await updateTaskWithDraft(taskId, autoReply);

          await logActivity(userId, "email:draft_created", {
            emailId: email.id,
            taskId,
            reason: autoReply.reason,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to process email ${email.id}:`, error);
      await logActivity(userId, "email:process_failed", {
        emailId: email.id,
        error: String(error),
      });
    }
  }

  return {
    processed: emails.length,
    tasks,
    autoReplied,
  };
}

/**
 * Create an email task in the database
 */
async function createEmailTask(
  userId: string,
  email: EmailMessage,
  classification: EmailClassification
): Promise<string> {
  const agentTasks = db.collection("agent_tasks");

  const task = {
    userId: new ObjectId(userId),
    agent: "email",
    source: "gmail",
    externalId: email.id,
    threadId: email.threadId,
    input: {
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body || email.snippet,
      date: email.date,
    },
    classification: {
      category: classification.category,
      priority: classification.priority,
      sentiment: classification.sentiment,
      keyPoints: classification.keyPoints,
      confidence: classification.confidence,
    },
    suggestedAction: classification.suggestedAction,
    status: classification.requiresResponse ? "needs_approval" : "completed",
    requiresApproval:
      classification.priority === "high" || classification.confidence < 0.7,
    confidence: classification.confidence,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await agentTasks.insertOne(task);
  return result.insertedId.toString();
}

/**
 * Update task status
 */
async function updateTaskStatus(
  taskId: string,
  status: string,
  output?: Record<string, unknown>
) {
  const agentTasks = db.collection("agent_tasks");

  await agentTasks.updateOne(
    { _id: new ObjectId(taskId) },
    {
      $set: {
        status,
        output,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Update task with draft reply for approval
 */
async function updateTaskWithDraft(taskId: string, autoReply: AutoReply) {
  const agentTasks = db.collection("agent_tasks");

  await agentTasks.updateOne(
    { _id: new ObjectId(taskId) },
    {
      $set: {
        status: "needs_approval",
        draftReply: {
          body: autoReply.replyBody,
          tone: autoReply.tone,
          reason: autoReply.reason,
        },
        requiresApproval: true,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Log activity
 */
async function logActivity(
  userId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  const activityLog = db.collection("activity_log");

  await activityLog.insertOne({
    userId: new ObjectId(userId),
    action,
    metadata,
    timestamp: new Date(),
  });
}

/**
 * Approve and send a draft reply
 */
export async function approveDraftReply(
  userId: string,
  taskId: string,
  modifiedBody?: string
): Promise<{ success: boolean; error?: string }> {
  const agentTasks = db.collection("agent_tasks");
  const task = await agentTasks.findOne({ _id: new ObjectId(taskId) });

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  if (!task.draftReply) {
    return { success: false, error: "No draft reply found" };
  }

  const replyBody = modifiedBody || task.draftReply.body;

  // Reconstruct the email for reply
  const originalEmail: EmailMessage = {
    id: task.externalId,
    threadId: task.threadId,
    from: task.input.from,
    to: task.input.to,
    subject: task.input.subject,
    body: task.input.body,
    snippet: task.input.body.slice(0, 100),
    date: task.input.date,
    isUnread: false,
    labels: [],
  };

  try {
    await replyToEmail(userId, originalEmail, replyBody, false);

    // Update task status
    await agentTasks.updateOne(
      { _id: new ObjectId(taskId) },
      {
        $set: {
          status: "completed",
          output: {
            approved: true,
            sentBody: replyBody,
            sentAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    );

    await logActivity(userId, "email:reply_approved", {
      taskId,
      modified: !!modifiedBody,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Reject a draft reply
 */
export async function rejectDraftReply(
  userId: string,
  taskId: string,
  reason?: string
): Promise<{ success: boolean }> {
  const agentTasks = db.collection("agent_tasks");

  await agentTasks.updateOne(
    { _id: new ObjectId(taskId) },
    {
      $set: {
        status: "rejected",
        output: {
          rejected: true,
          reason,
          rejectedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    }
  );

  await logActivity(userId, "email:reply_rejected", {
    taskId,
    reason,
  });

  return { success: true };
}

/**
 * Get email analytics for reporting
 */
export async function getEmailAnalytics(
  userId: string,
  days: number = 7
): Promise<{
  totalProcessed: number;
  autoReplied: number;
  needsApproval: number;
  byCategory: Record<string, number>;
  bySentiment: Record<string, number>;
  averageConfidence: number;
}> {
  const agentTasks = db.collection("agent_tasks");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const tasks = await agentTasks
    .find({
      userId: new ObjectId(userId),
      agent: "email",
      createdAt: { $gte: startDate },
    })
    .toArray();

  const byCategory: Record<string, number> = {};
  const bySentiment: Record<string, number> = {};
  let totalConfidence = 0;
  let autoReplied = 0;
  let needsApproval = 0;

  for (const task of tasks) {
    // Count by category
    const category = task.classification?.category || "unknown";
    byCategory[category] = (byCategory[category] || 0) + 1;

    // Count by sentiment
    const sentiment = task.classification?.sentiment || "unknown";
    bySentiment[sentiment] = (bySentiment[sentiment] || 0) + 1;

    // Sum confidence
    totalConfidence += task.confidence || 0;

    // Count auto-replied
    if (task.output?.autoReplied) autoReplied++;

    // Count needs approval
    if (task.status === "needs_approval") needsApproval++;
  }

  return {
    totalProcessed: tasks.length,
    autoReplied,
    needsApproval,
    byCategory,
    bySentiment,
    averageConfidence: tasks.length > 0 ? totalConfidence / tasks.length : 0,
  };
}
