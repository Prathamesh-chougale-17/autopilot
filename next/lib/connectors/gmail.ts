import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { env } from "@/env";
import client from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ============================================
// Gmail Service - Full Integration
// ============================================

const db = client.db(env.MONGODB_DB_NAME);

/**
 * Create an OAuth2 client with the user's stored tokens
 */
export async function getGmailClient(
  userId: string
): Promise<gmail_v1.Gmail | null> {
  // Get user's Google account tokens from Better Auth's account collection
  const accounts = db.collection("account");
  const account = await accounts.findOne({
    userId: new ObjectId(userId),
    providerId: "google",
  });

  if (!account?.accessToken) {
    console.error(`No Google account found for user ${userId}`);
    return null;
  }

  const oauth2Client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.BETTER_AUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.accessTokenExpiresAt
      ? new Date(account.accessTokenExpiresAt).getTime()
      : undefined,
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await accounts.updateOne(
        { userId: new ObjectId(userId), providerId: "google" },
        {
          $set: {
            accessToken: tokens.access_token,
            accessTokenExpiresAt: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : null,
            ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          },
        }
      );
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

// ============================================
// Email Reading
// ============================================

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: Date;
  isUnread: boolean;
  labels: string[];
}

/**
 * Mark an email as processed by applying a custom label
 */
export async function markEmailAsProcessed(
  userId: string,
  messageId: string
): Promise<{ success: boolean }> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return { success: false };

  try {
    // Apply "AUTOPILOT_PROCESSED" label (or create if doesn't exist)
    // First check if label exists
    const labelsResponse = await gmail.users.labels.list({ userId: "me" });
    const labels = labelsResponse.data.labels || [];
    let labelId = labels.find((l) => l.name === "AUTOPILOT_PROCESSED")?.id;

    if (!labelId) {
      // Create the label
      const createResponse = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: "AUTOPILOT_PROCESSED",
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      labelId = createResponse.data.id!;
    }

    // Apply the label to the message
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error marking email ${messageId} as processed:`, error);
    return { success: false };
  }
}

/**
 * Get recent emails from user's inbox
 */
export async function getRecentEmails(
  userId: string,
  maxResults: number = 10,
  query?: string,
  category: "all" | "primary" | "updates" = "primary",
  includeProcessed: boolean = false
): Promise<EmailMessage[]> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return [];

  try {
    // Build query with category filter
    let baseQuery = query || "in:inbox";

    // Add category filter
    if (category === "primary") {
      baseQuery += " category:primary";
    } else if (category === "updates") {
      baseQuery += " category:updates";
    }
    // 'all' doesn't add any category filter

    // Add today's date filter by default if no custom query
    if (!query) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      // Gmail accepts epoch seconds for after: filter which is reliable
      const afterSeconds = Math.floor(todayStart.getTime() / 1000);
      baseQuery += ` after:${afterSeconds}`;
    }

    // Exclude already processed emails by label unless caller requested otherwise
    const finalQuery = includeProcessed
      ? baseQuery
      : `${baseQuery} -label:AUTOPILOT_PROCESSED`;

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: finalQuery,
    });

    const messages = response.data.messages || [];
    const emails: EmailMessage[] = [];

    for (const msg of messages.slice(0, maxResults)) {
      const email = await getEmailDetails(gmail, msg.id!);
      if (email) emails.push(email);
    }

    return emails;
  } catch (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
}

/**
 * Get full email details by ID
 */
async function getEmailDetails(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<EmailMessage | null> {
  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || "";

    // Extract body
    let body = "";
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } else if (message.payload?.parts) {
      const textPart = message.payload.parts.find(
        (p) => p.mimeType === "text/plain"
      );
      const htmlPart = message.payload.parts.find(
        (p) => p.mimeType === "text/html"
      );
      const part = textPart || htmlPart;
      if (part?.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }

    return {
      id: message.id!,
      threadId: message.threadId!,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      snippet: message.snippet || "",
      body,
      date: new Date(parseInt(message.internalDate || "0")),
      isUnread: message.labelIds?.includes("UNREAD") || false,
      labels: message.labelIds || [],
    };
  } catch (error) {
    console.error(`Error fetching email ${messageId}:`, error);
    return null;
  }
}

/**
 * Get unread emails count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return 0;

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread in:inbox",
      maxResults: 1,
    });
    return response.data.resultSizeEstimate || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

// ============================================
// Email Sending
// ============================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  replyToMessageId?: string;
  threadId?: string;
}

/**
 * Send an email via Gmail API
 */
export async function sendGmailEmail(
  userId: string,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    return { success: false, error: "Gmail not connected" };
  }

  try {
    // Get user's email address
    const profile = await gmail.users.getProfile({ userId: "me" });
    const fromEmail = profile.data.emailAddress;

    // Build the email
    const contentType = options.isHtml ? "text/html" : "text/plain";
    const emailLines = [
      `From: ${fromEmail}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      `Content-Type: ${contentType}; charset=utf-8`,
    ];

    // Add reply headers if this is a reply
    if (options.replyToMessageId) {
      emailLines.push(`In-Reply-To: ${options.replyToMessageId}`);
      emailLines.push(`References: ${options.replyToMessageId}`);
    }

    emailLines.push("", options.body);

    const email = emailLines.join("\r\n");
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
        threadId: options.threadId,
      },
    });

    return { success: true, messageId: response.data.id! };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Reply to an email
 */
export async function replyToEmail(
  userId: string,
  originalEmail: EmailMessage,
  replyBody: string,
  isHtml: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Extract email address from "Name <email@domain.com>" format
  const fromMatch = originalEmail.from.match(/<([^>]+)>/) || [
    null,
    originalEmail.from,
  ];
  const replyTo = fromMatch[1] || originalEmail.from;

  return sendGmailEmail(userId, {
    to: replyTo,
    subject: originalEmail.subject.startsWith("Re:")
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`,
    body: replyBody,
    isHtml,
    replyToMessageId: originalEmail.id,
    threadId: originalEmail.threadId,
  });
}

// ============================================
// Email Management
// ============================================

/**
 * Mark email as read
 */
export async function markAsRead(
  userId: string,
  messageId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
    return true;
  } catch (error) {
    console.error("Error marking as read:", error);
    return false;
  }
}

/**
 * Archive an email (remove from inbox)
 */
export async function archiveEmail(
  userId: string,
  messageId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });
    return true;
  } catch (error) {
    console.error("Error archiving email:", error);
    return false;
  }
}

/**
 * Add label to email
 */
export async function addLabel(
  userId: string,
  messageId: string,
  labelName: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    // First, find or create the label
    const labelsResponse = await gmail.users.labels.list({ userId: "me" });
    let label = labelsResponse.data.labels?.find(
      (l) => l.name?.toLowerCase() === labelName.toLowerCase()
    );

    if (!label) {
      const createResponse = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      label = createResponse.data;
    }

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: [label.id!],
      },
    });
    return true;
  } catch (error) {
    console.error("Error adding label:", error);
    return false;
  }
}

// ============================================
// Gmail Watch (Push Notifications Setup)
// ============================================

/**
 * Set up Gmail push notifications for a user
 * Requires a Pub/Sub topic to be configured
 */
export async function setupGmailWatch(
  userId: string,
  topicName: string
): Promise<{
  success: boolean;
  historyId?: string;
  expiration?: string;
  error?: string;
}> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    return { success: false, error: "Gmail not connected" };
  }

  try {
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName,
        labelIds: ["INBOX"],
        labelFilterBehavior: "include",
      },
    });

    return {
      success: true,
      historyId: response.data.historyId?.toString(),
      expiration: response.data.expiration?.toString(),
    };
  } catch (error) {
    console.error("Error setting up Gmail watch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set up watch",
    };
  }
}

/**
 * Stop Gmail push notifications
 */
export async function stopGmailWatch(userId: string): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.stop({ userId: "me" });
    return true;
  } catch (error) {
    console.error("Error stopping Gmail watch:", error);
    return false;
  }
}

// ============================================
// Helper: Check Gmail Connection
// ============================================

/**
 * Check if user has Gmail connected and working
 */
export async function checkGmailConnection(
  userId: string
): Promise<{ connected: boolean; email?: string; error?: string }> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    return { connected: false, error: "No Google account linked" };
  }

  try {
    const profile = await gmail.users.getProfile({ userId: "me" });
    return {
      connected: true,
      email: profile.data.emailAddress!,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Gmail connection failed",
    };
  }
}
