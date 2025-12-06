import { os, z, getAuthSession } from "./helpers";
import {
  processIncomingEmails,
  approveDraftReply,
  rejectDraftReply,
  getEmailAnalytics,
} from "@/lib/ai/email-processor";

// Process incoming emails with AI
export const aiProcessEmails = os
  .input(
    z.object({
      maxEmails: z.number().min(1).max(50).default(10),
      autoProcess: z.boolean().default(false),
      category: z.enum(["all", "primary", "updates"]).default("primary"),
      includeProcessed: z.boolean().optional(),
    })
  )
  .output(
    z.object({
      processed: z.number(),
      tasks: z.array(z.string()),
      autoReplied: z.number(),
    })
  )
  .route({ method: "POST", path: "/ai/process-emails" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    return processIncomingEmails(session.user.id, {
      maxEmails: input.maxEmails,
      autoProcess: input.autoProcess,
      category: input.category,
      includeProcessed: input.includeProcessed ?? false,
    });
  });

// Approve a draft reply
export const aiApproveReply = os
  .input(
    z.object({
      taskId: z.string(),
      modifiedSubject: z.string().optional(),
      modifiedBody: z.string().optional(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    })
  )
  .route({ method: "POST", path: "/ai/approve-reply" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    return approveDraftReply(
      session.user.id,
      input.taskId,
      input.modifiedSubject,
      input.modifiedBody
    );
  });

// Reject a draft reply
export const aiRejectReply = os
  .input(
    z.object({
      taskId: z.string(),
      reason: z.string().optional(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .route({ method: "POST", path: "/ai/reject-reply" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    return rejectDraftReply(session.user.id, input.taskId, input.reason);
  });

// Get email analytics
export const aiEmailAnalytics = os
  .input(z.object({ days: z.number().min(1).max(90).default(7) }))
  .output(
    z.object({
      totalProcessed: z.number(),
      autoReplied: z.number(),
      needsApproval: z.number(),
      byCategory: z.record(z.string(), z.number()),
      bySentiment: z.record(z.string(), z.number()),
      averageConfidence: z.number(),
    })
  )
  .route({ method: "GET", path: "/ai/email-analytics" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    return getEmailAnalytics(session.user.id, input.days);
  });
