import { generateObject } from "ai";
import { z } from "zod";
import { aiModel } from "@/ai/config";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";
import { env } from "@/env";
import {
  getRecentEmails,
  replyToEmail,
  sendGmailEmail,
  markEmailAsProcessed,
  type EmailMessage,
} from "@/lib/connectors/gmail";
import { getUserContext } from "@/lib/ai/reply-learning";

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
  userId: string,
  email: EmailMessage,
  classification: EmailClassification,
  businessContext?: {
    businessName?: string;
    industry?: string;
    description?: string;
    tone?: string;
    signatureTemplate?: string;
    commonResponses?: Array<{ label: string; template: string }>;
    keywords?: string[];
    additionalContext?: string;
  }
): Promise<AutoReply> {
  // Get learned user context (writing style from approved replies)
  const userContextText = await getUserContext(userId);

  // Build business context prompt section
  let contextSection = "";
  if (businessContext) {
    contextSection = `
Business Context:
${
  businessContext.businessName
    ? `- Company: ${businessContext.businessName}`
    : ""
}
${businessContext.industry ? `- Industry: ${businessContext.industry}` : ""}
${
  businessContext.description
    ? `- Description: ${businessContext.description}`
    : ""
}
${businessContext.tone ? `- Preferred Tone: ${businessContext.tone}` : ""}
${
  businessContext.keywords?.length
    ? `- Key Topics/Products: ${businessContext.keywords.join(", ")}`
    : ""
}
${
  businessContext.additionalContext
    ? `- Additional Context: ${businessContext.additionalContext}`
    : ""
}

${
  businessContext.commonResponses?.length
    ? `Common Response Templates (use as inspiration if relevant):
${businessContext.commonResponses
  .map((r) => `- ${r.label}: ${r.template}`)
  .join("\n")}`
    : ""
}

${
  businessContext.signatureTemplate
    ? `Email Signature to use:\n${businessContext.signatureTemplate}`
    : ""
}
`;
  }

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
${contextSection}
${userContextText ? `\n${userContextText}\n` : ""}
Guidelines:
- Be professional and helpful
- Address the key points from the email
- If the email is spam or newsletter, set shouldReply to false
- If the matter is complex or sensitive, set requiresHumanReview to true
- Keep the reply concise but complete
- Match the tone specified in business context (if provided), otherwise use professional tone
- Include the signature template if provided
- Reference relevant keywords/products from business context when appropriate
${
  userContextText
    ? "- IMPORTANT: Follow the user writing style context above to match their established communication patterns and tone"
    : ""
}

Generate a reply that:
1. Acknowledges receipt (if appropriate)
2. Addresses the main concern or question
3. Provides helpful next steps if applicable
4. Uses the business context to make the reply relevant and personalized
${
  userContextText
    ? "5. Matches the learned writing style from previous approved replies"
    : ""
}`,
  });

  return object;
}

/**
 * Process incoming emails with AI and create tasks
 */
export async function processIncomingEmails(
  userId: string,
  options?: {
    maxEmails?: number;
    autoProcess?: boolean;
    category?: "all" | "primary" | "updates";
    includeProcessed?: boolean;
  }
): Promise<{
  processed: number;
  tasks: string[];
  autoReplied: number;
}> {
  const {
    maxEmails = 10,
    autoProcess = false,
    category = "primary",
    includeProcessed = false,
  } = options || {};

  // Ensure unique index on agent_tasks to prevent duplicates
  const agentTasks = db.collection("agent_tasks");
  try {
    await agentTasks.createIndex(
      { userId: 1, externalId: 1 },
      { unique: true, background: true }
    );
  } catch {
    // Index may already exist, ignore error
  }

  // Get user's toggle settings for category preference
  const settings = db.collection("settings");
  const userSettings = await settings.findOne({
    $or: [{ userId: userId }, { userId: new ObjectId(userId) }],
  });
  const autoReplyEnabled = userSettings?.autoReply ?? false;
  const gmailCategory = userSettings?.gmailCategory ?? category;
  const shouldAutoProcess = autoProcess ?? userSettings?.autoProcess ?? true;

  // Get emails from specified category (default: today's primary emails)
  const emails = await getRecentEmails(
    userId,
    maxEmails,
    undefined,
    gmailCategory,
    includeProcessed
  );

  const tasks: string[] = [];
  let autoReplied = 0;

  // Fetch business context for AI
  const contextColl = db.collection("business_context");
  const businessContext = await contextColl.findOne({
    $or: [{ userId }, { userId: new ObjectId(userId) }],
  });

  for (const email of emails) {
    try {
      // Skip emails that already have an agent task created (avoid re-processing)
      const agentTasksColl = db.collection("agent_tasks");
      const already = await agentTasksColl.findOne({
        externalId: email.id,
        $or: [{ userId }, { userId: new ObjectId(userId) }],
      });
      if (already) {
        await logActivity(userId, "email:skipped_already_processed", {
          emailId: email.id,
          subject: email.subject,
          reason: "existing_task",
        });
        continue;
      }

      // Classify the email
      const classification = await classifyEmail(email);

      // Skip spam/newsletters
      if (
        classification.category === "spam" ||
        classification.category === "newsletter"
      ) {
        await logActivity(userId, "email:skipped", {
          emailId: email.id,
          subject: email.subject,
          reason: classification.category,
        });
        continue;
      }

      // Create agent task
      const taskId = await createEmailTask(userId, email, classification);
      tasks.push(taskId);

      // Mark email as processed to avoid re-fetching
      await markEmailAsProcessed(userId, email.id);

      // If this email requires a response, always generate an AI draft reply
      // so that approvals have a ready subject + message related to the query.
      if (classification.requiresResponse) {
        const autoReply = await generateAutoReply(
          userId,
          email,
          classification,
          businessContext
            ? {
                businessName: businessContext.businessName,
                industry: businessContext.industry,
                description: businessContext.description,
                tone: businessContext.tone,
                signatureTemplate: businessContext.signatureTemplate,
                commonResponses: businessContext.commonResponses,
                keywords: businessContext.keywords,
                additionalContext: businessContext.additionalContext,
              }
            : undefined
        );

        // If auto-processing is enabled and the AI says it's safe to auto-send,
        // send the reply and mark the task completed.
        if (
          autoReply.shouldReply &&
          !autoReply.requiresHumanReview &&
          autoReplyEnabled &&
          shouldAutoProcess
        ) {
          await replyToEmail(userId, email, autoReply.replyBody, false);
          autoReplied++;

          await updateTaskStatus(taskId, "completed", {
            autoReplied: true,
            replyBody: autoReply.replyBody,
          });

          await logActivity(userId, "email:auto_replied", {
            emailId: email.id,
            subject: email.subject,
            taskId,
            tone: autoReply.tone,
          });
        } else if (autoReply.shouldReply) {
          // Otherwise, save the AI-generated draft (subject + body) for human approval.
          await updateTaskWithDraft(taskId, autoReply, email.subject);

          await logActivity(userId, "email:draft_created", {
            emailId: email.id,
            subject: email.subject,
            taskId,
            reason: autoReply.reason,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to process email ${email.id}:`, error);
      await logActivity(userId, "email:process_failed", {
        emailId: email.id,
        subject: email.subject,
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
    userId: String(userId),
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
async function updateTaskWithDraft(
  taskId: string,
  autoReply: AutoReply,
  subject?: string
) {
  const agentTasks = db.collection("agent_tasks");

  await agentTasks.updateOne(
    { _id: new ObjectId(taskId) },
    {
      $set: {
        status: "needs_approval",
        draftReply: {
          subject: subject ?? "",
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
    userId: String(userId),
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
  modifiedSubject?: string,
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
  const replySubject = modifiedSubject || task.draftReply.subject;

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
    // Use modified subject if provided, otherwise AI draft, fallback to original
    const finalSubject = replySubject || originalEmail.subject;

    // Send using sendGmailEmail to allow subject override while keeping reply headers
    const sendResult = await sendGmailEmail(userId, {
      to: originalEmail.from.match(/<([^>]+)>/)?.[1] || originalEmail.from,
      subject: finalSubject.startsWith("Re:")
        ? finalSubject
        : `Re: ${finalSubject}`,
      body: replyBody,
      isHtml: false,
      replyToMessageId: originalEmail.id,
      threadId: originalEmail.threadId,
    });

    if (!sendResult.success) {
      return { success: false, error: sendResult.error };
    }

    // Store approved reply in approved_replies collection for learning
    const approvedReplies = db.collection("approved_replies");
    await approvedReplies.insertOne({
      userId: String(userId),
      taskId,
      clientEmail:
        originalEmail.from.match(/<([^>]+)>/)?.[1] || originalEmail.from,
      originalSubject: originalEmail.subject,
      originalBody: originalEmail.body,
      sentSubject: finalSubject.startsWith("Re:")
        ? finalSubject
        : `Re: ${finalSubject}`,
      sentBody: replyBody,
      category: task.classification?.category,
      sentiment: task.classification?.sentiment,
      aiDraftSubject: task.draftReply?.subject,
      aiDraftBody: task.draftReply?.body,
      wasModified: !!modifiedSubject || !!modifiedBody,
      approvedAt: new Date(),
      createdAt: new Date(),
    });

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
            messageId: sendResult.messageId,
          },
          updatedAt: new Date(),
        },
      }
    );

    await logActivity(userId, "email:reply_approved", {
      taskId,
      subject: finalSubject,
      modified: !!modifiedSubject || !!modifiedBody,
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

  // Get task to retrieve subject
  const task = await agentTasks.findOne({ _id: new ObjectId(taskId) });

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
    subject: task?.input?.subject,
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
      $and: [
        { agent: "email" },
        { createdAt: { $gte: startDate } },
        { $or: [{ userId: userId }, { userId: new ObjectId(userId) }] },
      ],
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
