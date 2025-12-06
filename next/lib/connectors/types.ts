import { z } from "zod";

// ============================================
// Connector Types & Schemas
// ============================================

// Gmail Push Notification
export const gmailPushNotificationSchema = z.object({
  message: z.object({
    data: z.string(), // Base64 encoded
    messageId: z.string(),
    publishTime: z.string(),
  }),
  subscription: z.string(),
});

export type GmailPushNotification = z.infer<typeof gmailPushNotificationSchema>;

// Decoded Gmail notification data
export const gmailNotificationDataSchema = z.object({
  emailAddress: z.string().email(),
  historyId: z.number(),
});

export type GmailNotificationData = z.infer<typeof gmailNotificationDataSchema>;

// WhatsApp Cloud API Webhook
export const whatsappWebhookSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal("whatsapp"),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z
              .array(
                z.object({
                  profile: z.object({ name: z.string() }),
                  wa_id: z.string(),
                })
              )
              .optional(),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.enum([
                    "text",
                    "image",
                    "audio",
                    "video",
                    "document",
                    "location",
                    "contacts",
                    "interactive",
                    "button",
                    "reaction",
                  ]),
                  text: z.object({ body: z.string() }).optional(),
                })
              )
              .optional(),
            statuses: z
              .array(
                z.object({
                  id: z.string(),
                  status: z.enum(["sent", "delivered", "read", "failed"]),
                  timestamp: z.string(),
                  recipient_id: z.string(),
                })
              )
              .optional(),
          }),
          field: z.literal("messages"),
        })
      ),
    })
  ),
});

export type WhatsAppWebhook = z.infer<typeof whatsappWebhookSchema>;

// Generic connector event for internal processing
export const connectorEventSchema = z.object({
  source: z.enum(["gmail", "whatsapp", "sheets", "crm", "manual"]),
  eventType: z.enum([
    "email_received",
    "email_sent",
    "message_received",
    "message_sent",
    "message_status",
    "sheet_updated",
    "contact_updated",
    "lead_created",
    "invoice_created",
  ]),
  externalId: z.string(),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.date(),
});

export type ConnectorEvent = z.infer<typeof connectorEventSchema>;

// Task classification result from AI
export const taskClassificationSchema = z.object({
  taskType: z.enum([
    "reply_email",
    "send_whatsapp",
    "create_invoice",
    "update_crm",
    "follow_up",
    "schedule_meeting",
    "generate_report",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  requiresApproval: z.boolean(),
  confidence: z.number().min(0).max(1),
  suggestedAction: z.string(),
  extractedData: z.record(z.string(), z.unknown()).optional(),
});

export type TaskClassification = z.infer<typeof taskClassificationSchema>;
