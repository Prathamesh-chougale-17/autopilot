import { z } from "zod";

// Toggle settings for autopilot features
export const toggleSettingsSchema = z.object({
  autoReply: z.boolean().default(false),
  autoInvoice: z.boolean().default(false),
  autoFollowUp: z.boolean().default(false),
  autoReporting: z.boolean().default(false),
  gmailCategory: z.enum(["all", "primary", "updates"]).default("primary"),
  autoProcess: z.boolean().default(true), // Auto-process emails on fetch
});
export type ToggleSettings = z.infer<typeof toggleSettingsSchema>;

// Contact / lead record
export const contactSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Contact = z.infer<typeof contactSchema>;

// Invoice record
export const invoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  dueDate: z.date(),
  status: z.enum(["pending", "sent", "paid", "overdue", "canceled"]),
  description: z.string().optional(),
  remindersSent: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

// Agent task record (generic for agents)
export const agentTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  agent: z.enum([
    "email",
    "whatsapp",
    "billing",
    "crm",
    "data-entry",
    "reporting",
    "learning",
    "policy",
  ]),
  input: z.record(z.string(), z.any()),
  output: z.record(z.string(), z.any()).optional(),
  status: z.enum([
    "pending",
    "processing",
    "needs_approval",
    "approved",
    "rejected",
    "completed",
    "failed",
  ]),
  confidence: z.number().min(0).max(1).optional(),
  requiresApproval: z.boolean().default(false),
  approvalNote: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AgentTask = z.infer<typeof agentTaskSchema>;

// Activity log entry for transparency/audit
export const activityLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
});
export type ActivityLog = z.infer<typeof activityLogSchema>;

// Summary payload for daily/weekly reporting
export const summarySchema = z.object({
  tasksCompleted: z.number(),
  tasksPending: z.number(),
  leads: z.number(),
  invoicesSent: z.number(),
  invoicesOverdue: z.number(),
  paymentsReceived: z.number(),
});
export type Summary = z.infer<typeof summarySchema>;

// Business context for AI email generation
export const businessContextSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessName: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  tone: z
    .enum(["formal", "friendly", "professional", "casual"])
    .default("professional"),
  signatureTemplate: z.string().optional(),
  commonResponses: z
    .array(
      z.object({
        label: z.string(),
        template: z.string(),
      })
    )
    .default([]),
  keywords: z.array(z.string()).default([]),
  additionalContext: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BusinessContext = z.infer<typeof businessContextSchema>;

// Input schema for updating business context (without system fields)
export const businessContextInputSchema = businessContextSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type BusinessContextInput = z.infer<typeof businessContextInputSchema>;
