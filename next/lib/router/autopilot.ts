import { os, z, getAuthSession } from "./helpers";
import { ObjectId } from "mongodb";
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

// Get toggles for current user
export const getToggles = os
  .input(z.object({}))
  .output(toggleSettingsSchema)
  .route({ method: "GET", path: "/toggles" })
  .handler(async () => {
    const session = await getAuthSession();

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
        gmailCategory: "primary",
        autoProcess: true,
      };
      await settings.insertOne({
        userId: String(session.user.id),
        ...defaults,
      });
      return defaults;
    }

    return toggleSettingsSchema.parse({
      autoReply: Boolean(record.autoReply),
      autoInvoice: Boolean(record.autoInvoice),
      autoFollowUp: Boolean(record.autoFollowUp),
      autoReporting: Boolean(record.autoReporting),
      gmailCategory: record.gmailCategory || "primary",
      autoProcess: record.autoProcess ?? true,
    });
  });

// Update toggles for current user
export const setToggles = os
  .input(toggleSettingsSchema)
  .output(toggleSettingsSchema)
  .route({ method: "POST", path: "/toggles" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const settings = db.collection("settings");

    await settings.updateOne(
      {
        $or: [
          { userId: session.user.id },
          { userId: new ObjectId(session.user.id) },
        ],
      },
      { $set: { ...input, userId: String(session.user.id) } },
      { upsert: true }
    );

    return input;
  });

// Create an agent task
export const createTask = os
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
    const session = await getAuthSession();

    const now = new Date();
    const task: AgentTask = {
      ...input,
      id: new ObjectId().toHexString(),
      userId: String(session.user.id),
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
      userId: String(session.user.id),
      action: `task_created:${task.agent}`,
      context: { taskId: task.id },
      createdAt: now,
    };
    await logs.insertOne(log);

    return task;
  });

// List recent activity
export const listActivity = os
  .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
  .output(z.object({ items: z.array(activityLogSchema) }))
  .route({ method: "GET", path: "/activity" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const logs = db.collection("activity_log");

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
          userId: item.userId?.toString() ?? String(session.user.id),
          action: item.action ?? item.details ?? "unknown",
          context: item.context ?? item.metadata ?? {},
          createdAt: item.createdAt ?? item.timestamp ?? new Date(),
        })
      ),
    };
  });

// List tasks
export const listTasks = os
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
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");

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
      items: items.map((item) => {
        return agentTaskSchema.parse({
          id: item.id ?? item._id?.toString(),
          userId: item.userId?.toString() ?? String(session.user.id),
          agent: item.agent,
          input: item.input,
          output: item.output,
          status: item.status,
          confidence: item.confidence,
          requiresApproval: Boolean(item.requiresApproval),
          approvalNote: item.approvalNote,
          createdAt: item.createdAt ?? new Date(),
          updatedAt: item.updatedAt ?? new Date(),
          // Include extended fields
          classification: item.classification,
          draftReply: item.draftReply,
          suggestedAction: item.suggestedAction,
        });
      }),
    };
  });

// Update task status
export const setTaskStatus = os
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
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");

    let existing;
    try {
      existing = await tasks.findOne({ _id: new ObjectId(input.taskId) });
    } catch {
      existing = await tasks.findOne({ id: input.taskId });
    }

    if (!existing) {
      throw new Error("Task not found");
    }

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
      userId: String(session.user.id),
      action: `task_${input.status}:${input.taskId}`,
      context: { taskId: input.taskId, note: input.approvalNote },
      createdAt: now,
    };
    await logs.insertOne(log);

    return agentTaskSchema.parse({
      id: updated.id ?? updated._id?.toString(),
      userId: updated.userId?.toString() ?? String(session.user.id),
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

// Get summary
export const getSummary = os
  .input(z.object({ window: z.enum(["daily", "weekly"]).default("daily") }))
  .output(summarySchema)
  .route({ method: "GET", path: "/summary" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");
    const invoices = db.collection("invoices");
    const contacts = db.collection("crm_contacts");

    const now = new Date();
    const startDate = new Date();
    if (input.window === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const dateFilter = { $gte: startDate, $lte: now };

    const userFilter = {
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    };

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

    return {
      tasksCompleted,
      tasksPending,
      leads,
      invoicesSent,
      invoicesOverdue,
      paymentsReceived,
    };
  });

// Get detailed report
export const getReport = os
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
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const tasks = db.collection("agent_tasks");
    const invoices = db.collection("invoices");
    const contacts = db.collection("crm_contacts");
    const logs = db.collection("activity_log");

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
    const userFilter = {
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    };

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
        userId: item.userId?.toString() ?? String(session.user.id),
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
