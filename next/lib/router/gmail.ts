import { os, z, getAuthSession } from "./helpers";
import client from "@/lib/mongodb";
import { env } from "@/env";
import {
  checkGmailConnection,
  getRecentEmails,
  getUnreadCount,
  sendGmailEmail,
  replyToEmail,
  markAsRead,
  archiveEmail,
} from "@/lib/connectors/gmail";

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
export const gmailStatus = os
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
    const session = await getAuthSession();
    return checkGmailConnection(session.user.id);
  });

// Get recent emails
export const gmailList = os
  .input(
    z.object({
      maxResults: z.number().min(1).max(50).default(10),
      query: z.string().optional(),
    })
  )
  .output(z.object({ emails: z.array(emailSchema) }))
  .route({ method: "GET", path: "/gmail/list" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    const emails = await getRecentEmails(
      session.user.id,
      input.maxResults,
      input.query
    );
    return { emails };
  });

// Get unread count
export const gmailUnreadCount = os
  .input(z.object({}))
  .output(z.object({ count: z.number() }))
  .route({ method: "GET", path: "/gmail/unread" })
  .handler(async () => {
    const session = await getAuthSession();
    const count = await getUnreadCount(session.user.id);
    return { count };
  });

// Send a new email
export const gmailSend = os
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
    const session = await getAuthSession();
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
export const gmailReply = os
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
    const session = await getAuthSession();

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
export const gmailMarkRead = os
  .input(z.object({ messageId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .route({ method: "POST", path: "/gmail/read" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    const success = await markAsRead(session.user.id, input.messageId);
    return { success };
  });

// Archive email
export const gmailArchive = os
  .input(z.object({ messageId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .route({ method: "POST", path: "/gmail/archive" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();
    const success = await archiveEmail(session.user.id, input.messageId);
    return { success };
  });
