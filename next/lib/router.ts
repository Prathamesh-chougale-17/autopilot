import { os } from "@orpc/server";
import { z } from "zod";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import client from "@/lib/mongodb";
import { env } from "@/env";
import {
  agentTaskSchema,
  activityLogSchema,
  summarySchema,
  toggleSettingsSchema,
  type AgentTask,
  type ActivityLog,
  type ToggleSettings,
} from "@/lib/models";
import {
  checkGmailConnection,
  getRecentEmails,
  getUnreadCount,
  sendGmailEmail,
  replyToEmail,
  markAsRead,
  archiveEmail,
} from "@/lib/connectors/gmail";
import {
  processIncomingEmails,
  approveDraftReply,
  rejectDraftReply,
  getEmailAnalytics,
} from "@/lib/ai/email-processor";

// Example procedure - replace with your actual procedures
const hello = os
  .input(
    z.object({
      name: z.string(),
    })
  )
  .output(
    z.object({
      message: z.string(),
    })
  )
  .route({
    method: "GET",
    path: "/hello",
  })
  .handler(async ({ input }) => {
    return {
      message: `Hello, ${input.name}!`,
    };
  });

// Admin: Get all users
const getUsers = os
  .input(z.object({}))
  .output(
    z.object({
      users: z.array(
        z.object({
          id: z.string(),
          name: z.string().nullable(),
          email: z.string(),
          role: z.string(),
          banned: z.boolean(),
          banReason: z.string().nullable().optional(),
          banExpires: z.date().nullable().optional(),
          createdAt: z.date().nullable().optional(),
        })
      ),
    })
  )
  .route({
    method: "GET",
    path: "/admin/users",
  })
  .handler(async () => {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const isAdmin = session.user.role === "admin";
    if (!isAdmin) {
      throw new Error("Forbidden: Admin access required");
    }

    // Fetch all users from MongoDB
    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const usersCollection = db.collection("user");

    const users = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        banned: user.banned || false,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
      })),
    };
  });

// Get toggles for current user
const getToggles = os
  .input(z.object({}))
  .output(toggleSettingsSchema)
  .route({ method: "GET", path: "/toggles" })
  .handler(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const settings = db.collection("settings");
    const record = await settings.findOne({ userId: session.user.id });

    if (!record) {
      const defaults: ToggleSettings = {
        autoReply: false,
        autoInvoice: false,
        autoFollowUp: false,
        autoReporting: false,
      };
      await settings.insertOne({ userId: session.user.id, ...defaults });
      return defaults;
    }

    return toggleSettingsSchema.parse({
      autoReply: Boolean(record.autoReply),
      autoInvoice: Boolean(record.autoInvoice),
      autoFollowUp: Boolean(record.autoFollowUp),
      autoReporting: Boolean(record.autoReporting),
    });
  });

// Update toggles for current user
const setToggles = os
  .input(toggleSettingsSchema)
  .output(toggleSettingsSchema)
  .route({ method: "POST", path: "/toggles" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const settings = db.collection("settings");

    await settings.updateOne(
      { userId: session.user.id },
      { $set: { ...input } },
      { upsert: true }
    );

    return input;
  });

// Create an agent task (stores and awaits processing)
const createTask = os
  .input(
    agentTaskSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    })
  )
  .output(agentTaskSchema)
  .route({ method: "POST", path: "/tasks" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const now = new Date();
    const task: AgentTask = {
      ...input,
      id: new ObjectId().toHexString(),
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
    };

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");
    await tasks.insertOne(task);

    const logs = db.collection("activity_log");
    const log: ActivityLog = {
      id: new ObjectId().toHexString(),
      userId: session.user.id,
      action: `task_created:${task.agent}`,
      context: { taskId: task.id },
      createdAt: now,
    };
    await logs.insertOne(log);

    return task;
  });

// List recent activity for transparency
const listActivity = os
  .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
  .output(z.object({ items: z.array(activityLogSchema) }))
  .route({ method: "GET", path: "/activity" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const logs = db.collection("activity_log");

    // Query by both string and ObjectId to handle both formats
    const items = await logs
      .find({
        $or: [
          { userId: session.user.id },
          { userId: new ObjectId(session.user.id) },
        ],
      })
      .sort({ createdAt: -1, timestamp: -1 })
      .limit(input.limit)
      .toArray();

    return {
      items: items.map((item) =>
        activityLogSchema.parse({
          id: item.id ?? item._id?.toString(),
          userId: item.userId?.toString() ?? session.user.id,
          action: item.action ?? item.details ?? "unknown",
          context: item.context ?? item.metadata ?? {},
          createdAt: item.createdAt ?? item.timestamp ?? new Date(),
        })
      ),
    };
  });

// List tasks (for approvals and status visibility)
const listTasks = os
  .input(
    z.object({
      status: z
        .enum([
          "pending",
          "processing",
          "needs_approval",
          "approved",
          "rejected",
          "completed",
          "failed",
        ])
        .optional(),
      limit: z.number().min(1).max(200).default(50),
    })
  )
  .output(z.object({ items: z.array(agentTaskSchema) }))
  .route({ method: "GET", path: "/tasks" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");

    // Query by both string and ObjectId to handle both formats
    const query: Record<string, unknown> = {
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    };
    if (input.status) query.status = input.status;

    const items = await tasks
      .find(query)
      .sort({ createdAt: -1 })
      .limit(input.limit)
      .toArray();

    return {
      items: items.map((item) =>
        agentTaskSchema.parse({
          id: item.id ?? item._id?.toString(),
          userId: item.userId,
          agent: item.agent,
          input: item.input,
          output: item.output,
          status: item.status,
          confidence: item.confidence,
          requiresApproval: Boolean(item.requiresApproval),
          approvalNote: item.approvalNote,
          createdAt: item.createdAt ?? new Date(),
          updatedAt: item.updatedAt ?? new Date(),
        })
      ),
    };
  });

// Approve/reject/update a task status
const setTaskStatus = os
  .input(
    z.object({
      taskId: z.string(),
      status: z.enum(["approved", "rejected", "completed", "failed"]),
      approvalNote: z.string().optional(),
      output: z.record(z.string(), z.any()).optional(),
    })
  )
  .output(agentTaskSchema)
  .route({ method: "POST", path: "/tasks/status" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");

    // Try to find by _id (ObjectId)
    let existing;
    try {
      existing = await tasks.findOne({ _id: new ObjectId(input.taskId) });
    } catch {
      // If invalid ObjectId format, try by id field
      existing = await tasks.findOne({ id: input.taskId });
    }

    if (!existing) {
      throw new Error("Task not found");
    }

    // Check authorization - handle both string and ObjectId userId
    const taskUserId = existing.userId?.toString();
    if (taskUserId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    const now = new Date();
    await tasks.updateOne(
      { _id: existing._id },
      {
        $set: {
          status: input.status,
          approvalNote: input.approvalNote,
          output: input.output ?? existing.output,
          updatedAt: now,
        },
      }
    );

    const updated = await tasks.findOne({ _id: existing._id });
    if (!updated) throw new Error("Failed to update task");

    const logs = db.collection("activity_log");
    const log: ActivityLog = {
      id: new ObjectId().toHexString(),
      userId: session.user.id,
      action: `task_${input.status}:${input.taskId}`,
      context: { taskId: input.taskId, note: input.approvalNote },
      createdAt: now,
    };
    await logs.insertOne(log);

    return agentTaskSchema.parse({
      id: updated.id ?? updated._id?.toString(),
      userId: updated.userId,
      agent: updated.agent,
      input: updated.input,
      output: updated.output,
      status: updated.status,
      confidence: updated.confidence,
      requiresApproval: Boolean(updated.requiresApproval),
      approvalNote: updated.approvalNote,
      createdAt: updated.createdAt ?? now,
      updatedAt: updated.updatedAt ?? now,
    });
  });

// Daily/weekly summary (lightweight aggregation placeholder)
const getSummary = os
  .input(z.object({ window: z.enum(["daily", "weekly"]).default("daily") }))
  .output(summarySchema)
  .route({ method: "GET", path: "/summary" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");
    const invoices = db.collection("invoices");
    const contacts = db.collection("crm_contacts");

    // Calculate date range based on window
    const now = new Date();
    const startDate = new Date();
    if (input.window === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const dateFilter = { $gte: startDate, $lte: now };

    const tasksCompleted = await tasks.countDocuments({
      userId: session.user.id,
      status: "completed",
      updatedAt: dateFilter,
    });
    const tasksPending = await tasks.countDocuments({
      userId: session.user.id,
      status: { $in: ["pending", "processing", "needs_approval"] },
    });
    const leads = await contacts.countDocuments({
      userId: session.user.id,
      createdAt: dateFilter,
    });
    const invoicesSent = await invoices.countDocuments({
      userId: session.user.id,
      createdAt: dateFilter,
    });
    const invoicesOverdue = await invoices.countDocuments({
      userId: session.user.id,
      status: "overdue",
    });
    const paymentsReceived = await invoices.countDocuments({
      userId: session.user.id,
      status: "paid",
      updatedAt: dateFilter,
    });

    return {
      tasksCompleted,
      tasksPending,
      leads,
      invoicesSent,
      invoicesOverdue,
      paymentsReceived,
    };
  });

// Get detailed report data
const getReport = os
  .input(
    z.object({
      window: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    })
  )
  .output(
    z.object({
      window: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      summary: summarySchema,
      tasksByAgent: z.array(
        z.object({
          agent: z.string(),
          count: z.number(),
          completed: z.number(),
          pending: z.number(),
        })
      ),
      tasksByStatus: z.array(
        z.object({
          status: z.string(),
          count: z.number(),
        })
      ),
      recentActivity: z.array(activityLogSchema),
      connectorStats: z.object({
        emailsProcessed: z.number(),
        messagesProcessed: z.number(),
        autoRepliesSent: z.number(),
      }),
    })
  )
  .route({ method: "GET", path: "/report" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");
    const invoices = db.collection("invoices");
    const contacts = db.collection("crm_contacts");
    const logs = db.collection("activity_log");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (input.window === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else if (input.window === "weekly") {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const dateFilter = { $gte: startDate, $lte: endDate };
    const userFilter = { userId: session.user.id };

    // Summary counts
    const tasksCompleted = await tasks.countDocuments({
      ...userFilter,
      status: "completed",
      updatedAt: dateFilter,
    });
    const tasksPending = await tasks.countDocuments({
      ...userFilter,
      status: { $in: ["pending", "processing", "needs_approval"] },
    });
    const leads = await contacts.countDocuments({
      ...userFilter,
      createdAt: dateFilter,
    });
    const invoicesSent = await invoices.countDocuments({
      ...userFilter,
      createdAt: dateFilter,
    });
    const invoicesOverdue = await invoices.countDocuments({
      ...userFilter,
      status: "overdue",
    });
    const paymentsReceived = await invoices.countDocuments({
      ...userFilter,
      status: "paid",
      updatedAt: dateFilter,
    });

    // Aggregate tasks by agent
    const tasksByAgentAgg = await tasks
      .aggregate([
        { $match: { ...userFilter, createdAt: dateFilter } },
        {
          $group: {
            _id: "$agent",
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            pending: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["pending", "processing", "needs_approval"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const tasksByAgent = tasksByAgentAgg.map((item) => ({
      agent: item._id || "unknown",
      count: item.count,
      completed: item.completed,
      pending: item.pending,
    }));

    // Aggregate tasks by status
    const tasksByStatusAgg = await tasks
      .aggregate([
        { $match: { ...userFilter, createdAt: dateFilter } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();

    const tasksByStatus = tasksByStatusAgg.map((item) => ({
      status: item._id || "unknown",
      count: item.count,
    }));

    // Recent activity
    const recentActivityRaw = await logs
      .find({ ...userFilter, createdAt: dateFilter })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const recentActivity = recentActivityRaw.map((item) =>
      activityLogSchema.parse({
        id: item.id ?? item._id?.toString(),
        userId: item.userId,
        action: item.action,
        context: item.context,
        createdAt: item.createdAt ?? new Date(),
      })
    );

    // Connector stats
    const emailsProcessed = await logs.countDocuments({
      ...userFilter,
      action: { $regex: /^connector:gmail/ },
      createdAt: dateFilter,
    });
    const messagesProcessed = await logs.countDocuments({
      ...userFilter,
      action: { $regex: /^connector:whatsapp/ },
      createdAt: dateFilter,
    });
    const autoRepliesSent = await tasks.countDocuments({
      ...userFilter,
      agent: { $in: ["reply_email", "send_whatsapp"] },
      status: "completed",
      updatedAt: dateFilter,
    });

    return {
      window: input.window,
      startDate,
      endDate,
      summary: {
        tasksCompleted,
        tasksPending,
        leads,
        invoicesSent,
        invoicesOverdue,
        paymentsReceived,
      },
      tasksByAgent,
      tasksByStatus,
      recentActivity,
      connectorStats: {
        emailsProcessed,
        messagesProcessed,
        autoRepliesSent,
      },
    };
  });

// ============================================
// Gmail Router
// ============================================

const emailSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  snippet: z.string(),
  body: z.string(),
  date: z.date(),
  isUnread: z.boolean(),
  labels: z.array(z.string()),
});

// Check Gmail connection status
const gmailStatus = os
  .input(z.object({}))
  .output(
    z.object({
      connected: z.boolean(),
      email: z.string().optional(),
      error: z.string().optional(),
    })
  )
  .route({ method: "GET", path: "/gmail/status" })
  .handler(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    return checkGmailConnection(session.user.id);
  });

// Get recent emails
const gmailList = os
  .input(
    z.object({
      maxResults: z.number().min(1).max(50).default(10),
      query: z.string().optional(),
    })
  )
  .output(z.object({ emails: z.array(emailSchema) }))
  .route({ method: "GET", path: "/gmail/list" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const emails = await getRecentEmails(
      session.user.id,
      input.maxResults,
      input.query
    );

    return { emails };
  });

// Get unread count
const gmailUnreadCount = os
  .input(z.object({}))
  .output(z.object({ count: z.number() }))
  .route({ method: "GET", path: "/gmail/unread" })
  .handler(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const count = await getUnreadCount(session.user.id);
    return { count };
  });

// Send a new email
const gmailSend = os
  .input(
    z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      isHtml: z.boolean().default(false),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      messageId: z.string().optional(),
      error: z.string().optional(),
    })
  )
  .route({ method: "POST", path: "/gmail/send" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const result = await sendGmailEmail(session.user.id, input);

    // Log activity
    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    await db.collection("activity_log").insertOne({
      userId: session.user.id,
      action: "gmail:send",
      details: `Email sent to ${input.to}: ${input.subject}`,
      metadata: { to: input.to, subject: input.subject },
      timestamp: new Date(),
    });

    return result;
  });

// Reply to an email
const gmailReply = os
  .input(
    z.object({
      emailId: z.string(),
      threadId: z.string(),
      originalFrom: z.string(),
      originalSubject: z.string(),
      body: z.string(),
      isHtml: z.boolean().default(false),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      messageId: z.string().optional(),
      error: z.string().optional(),
    })
  )
  .route({ method: "POST", path: "/gmail/reply" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const originalEmail = {
      id: input.emailId,
      threadId: input.threadId,
      from: input.originalFrom,
      to: "",
      subject: input.originalSubject,
      snippet: "",
      body: "",
      date: new Date(),
      isUnread: false,
      labels: [],
    };

    const result = await replyToEmail(
      session.user.id,
      originalEmail,
      input.body,
      input.isHtml
    );

    // Log activity
    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    await db.collection("activity_log").insertOne({
      userId: session.user.id,
      action: "gmail:reply",
      details: `Replied to email from ${input.originalFrom}`,
      metadata: {
        emailId: input.emailId,
        threadId: input.threadId,
        from: input.originalFrom,
      },
      timestamp: new Date(),
    });

    return result;
  });

// Mark email as read
const gmailMarkRead = os
  .input(z.object({ messageId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .route({ method: "POST", path: "/gmail/read" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const success = await markAsRead(session.user.id, input.messageId);
    return { success };
  });

// Archive email
const gmailArchive = os
  .input(z.object({ messageId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .route({ method: "POST", path: "/gmail/archive" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const success = await archiveEmail(session.user.id, input.messageId);
    return { success };
  });

// ============================================
// AI Email Processing
// ============================================

// Process incoming emails with AI
const aiProcessEmails = os
  .input(
    z.object({
      maxEmails: z.number().min(1).max(50).default(10),
      autoProcess: z.boolean().default(false),
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    return processIncomingEmails(session.user.id, {
      maxEmails: input.maxEmails,
      autoProcess: input.autoProcess,
    });
  });

// Approve a draft reply
const aiApproveReply = os
  .input(
    z.object({
      taskId: z.string(),
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    return approveDraftReply(session.user.id, input.taskId, input.modifiedBody);
  });

// Reject a draft reply
const aiRejectReply = os
  .input(
    z.object({
      taskId: z.string(),
      reason: z.string().optional(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .route({ method: "POST", path: "/ai/reject-reply" })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    return rejectDraftReply(session.user.id, input.taskId, input.reason);
  });

// Get email analytics
const aiEmailAnalytics = os
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    return getEmailAnalytics(session.user.id, input.days);
  });

export const router = os.router({
  hello,
  admin: os.router({
    getUsers,
  }),
  autopilot: os.router({
    getToggles,
    setToggles,
    createTask,
    listTasks,
    setTaskStatus,
    listActivity,
    getSummary,
    getReport,
  }),
  gmail: os.router({
    status: gmailStatus,
    list: gmailList,
    unreadCount: gmailUnreadCount,
    send: gmailSend,
    reply: gmailReply,
    markRead: gmailMarkRead,
    archive: gmailArchive,
  }),
  ai: os.router({
    processEmails: aiProcessEmails,
    approveReply: aiApproveReply,
    rejectReply: aiRejectReply,
    emailAnalytics: aiEmailAnalytics,
  }),
});
export type Router = typeof router;
