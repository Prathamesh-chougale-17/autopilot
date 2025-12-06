import { generateObject } from "ai";
import { z } from "zod";
import { aiModel } from "@/ai/config";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";
import { env } from "@/env";

// ============================================
// Reply Learning & Context Generation
// ============================================

const db = client.db(env.MONGODB_DB_NAME);

// Schema for daily summary
const dailySummarySchema = z.object({
  commonTopics: z.array(z.string()),
  writingStyle: z.object({
    tone: z.string(),
    formality: z.enum([
      "very_formal",
      "formal",
      "professional",
      "casual",
      "friendly",
    ]),
    avgLength: z.enum(["brief", "moderate", "detailed"]),
    signaturePattern: z.string().optional(),
  }),
  responsePatterns: z.array(
    z.object({
      scenario: z.string(),
      approach: z.string(),
    })
  ),
  keyPhrases: z.array(z.string()),
  clientHandling: z.object({
    greetingStyle: z.string(),
    closingStyle: z.string(),
    empathyLevel: z.enum(["low", "medium", "high"]),
  }),
  industryContext: z.string().optional(),
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

/**
 * Generate a daily summary from approved replies
 */
export async function generateDailySummary(
  userId: string,
  date?: Date
): Promise<DailySummary> {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const approvedReplies = db.collection("approved_replies");
  const replies = await approvedReplies
    .find({
      $or: [{ userId }, { userId: new ObjectId(userId) }],
      approvedAt: { $gte: startOfDay, $lte: endOfDay },
    })
    .toArray();

  if (replies.length === 0) {
    // Return default summary if no replies today
    return {
      commonTopics: [],
      writingStyle: {
        tone: "professional",
        formality: "professional",
        avgLength: "moderate",
      },
      responsePatterns: [],
      keyPhrases: [],
      clientHandling: {
        greetingStyle: "Hi [Name],",
        closingStyle: "Best regards,",
        empathyLevel: "medium",
      },
    };
  }

  // Build prompt with all today's approved replies
  const repliesText = replies
    .map(
      (r, i) =>
        `
--- Reply ${i + 1} ---
Client: ${r.clientEmail}
Original: ${r.originalSubject}
${r.originalBody}

Your Reply Subject: ${r.sentSubject}
Your Reply:
${r.sentBody}
${
  r.wasModified
    ? "(User edited this reply before sending)"
    : "(AI draft sent as-is)"
}
`
    )
    .join("\n");

  const { object } = await generateObject({
    model: aiModel,
    schema: dailySummarySchema,
    prompt: `Analyze these approved email replies sent today and extract patterns about the writing style, tone, and approach:

${repliesText}

Generate a summary that captures:
1. Common topics/themes addressed
2. Writing style characteristics (tone, formality, length)
3. Response patterns (how different scenarios are handled)
4. Key phrases and expressions frequently used
5. Client handling approach (greetings, closings, empathy level)
6. Any industry-specific context evident

This summary will be used to train the AI to write future replies in the same style.`,
  });

  return object;
}

/**
 * Store daily summary in the reply_summaries collection
 */
export async function storeDailySummary(
  userId: string,
  summary: DailySummary,
  date?: Date
): Promise<string> {
  const targetDate = date || new Date();
  const summaries = db.collection("reply_summaries");

  const result = await summaries.insertOne({
    userId: String(userId),
    date: targetDate,
    summary,
    createdAt: new Date(),
  });

  return result.insertedId.toString();
}

/**
 * Merge daily summaries into global user context
 */
export async function updateUserContext(userId: string): Promise<void> {
  const summaries = db.collection("reply_summaries");
  const userContext = db.collection("user_context");

  // Get all summaries for this user
  const allSummaries = await summaries
    .find({
      $or: [{ userId }, { userId: new ObjectId(userId) }],
    })
    .sort({ date: -1 })
    .limit(30) // Last 30 days
    .toArray();

  if (allSummaries.length === 0) {
    return;
  }

  // Get existing context
  const existingContext = await userContext.findOne({
    $or: [{ userId }, { userId: new ObjectId(userId) }],
  });

  // Build prompt to merge summaries
  const summariesText = allSummaries
    .map(
      (s) =>
        `
--- Summary from ${s.date.toISOString().split("T")[0]} ---
Common Topics: ${s.summary.commonTopics.join(", ")}
Tone: ${s.summary.writingStyle.tone}
Formality: ${s.summary.writingStyle.formality}
Length: ${s.summary.writingStyle.avgLength}
Greeting: ${s.summary.clientHandling.greetingStyle}
Closing: ${s.summary.clientHandling.closingStyle}
Empathy: ${s.summary.clientHandling.empathyLevel}

Response Patterns:
${s.summary.responsePatterns
  .map(
    (p: { scenario: string; approach: string }) =>
      `- ${p.scenario}: ${p.approach}`
  )
  .join("\n")}

Key Phrases: ${s.summary.keyPhrases.join(", ")}
${s.summary.industryContext ? `Industry: ${s.summary.industryContext}` : ""}
`
    )
    .join("\n");

  const existingContextText = existingContext
    ? `
Current Global Context:
${existingContext.context}
`
    : "No existing context.";

  const { object } = await generateObject({
    model: aiModel,
    schema: z.object({
      globalContext: z.string(),
      writingStyleGuidelines: z.string(),
      commonScenarios: z.array(
        z.object({
          scenario: z.string(),
          preferredApproach: z.string(),
        })
      ),
      keyVocabulary: z.array(z.string()),
      doAndDont: z.object({
        dos: z.array(z.string()),
        donts: z.array(z.string()),
      }),
    }),
    prompt: `You are creating a comprehensive writing style guide based on historical email reply patterns.

${existingContextText}

Recent Daily Summaries:
${summariesText}

Create a unified global context that:
1. Describes the overall writing style and tone consistently used
2. Provides clear guidelines for writing future replies
3. Lists common scenarios and how they should be handled
4. Identifies key vocabulary and phrases to use (or avoid)
5. Gives explicit dos and don'ts for reply generation

This will be used as context for AI to generate new replies that match the user's established style.`,
  });

  // Store or update user context
  await userContext.updateOne(
    {
      $or: [{ userId }, { userId: new ObjectId(userId) }],
    },
    {
      $set: {
        userId: String(userId),
        context: object.globalContext,
        writingStyleGuidelines: object.writingStyleGuidelines,
        commonScenarios: object.commonScenarios,
        keyVocabulary: object.keyVocabulary,
        doAndDont: object.doAndDont,
        lastUpdated: new Date(),
        summariesCount: allSummaries.length,
      },
    },
    { upsert: true }
  );
}

/**
 * Get user context for AI reply generation
 */
export async function getUserContext(
  userId: string
): Promise<string | undefined> {
  const userContext = db.collection("user_context");
  const context = await userContext.findOne({
    $or: [{ userId }, { userId: new ObjectId(userId) }],
  });

  if (!context) return undefined;

  // Format context for AI prompt
  return `
USER WRITING STYLE CONTEXT (learned from approved replies):

${context.context}

WRITING GUIDELINES:
${context.writingStyleGuidelines}

COMMON SCENARIOS:
${context.commonScenarios
  ?.map(
    (s: { scenario: string; preferredApproach: string }) =>
      `- ${s.scenario}: ${s.preferredApproach}`
  )
  .join("\n")}

KEY VOCABULARY TO USE:
${context.keyVocabulary?.join(", ")}

DO's:
${context.doAndDont?.dos?.map((d: string) => `✓ ${d}`).join("\n")}

DON'Ts:
${context.doAndDont?.donts?.map((d: string) => `✗ ${d}`).join("\n")}
`;
}

/**
 * Process daily summary (run as cron/scheduled job)
 */
export async function processDailySummaryForUser(
  userId: string
): Promise<void> {
  try {
    // Generate today's summary
    const summary = await generateDailySummary(userId);

    // Store it
    await storeDailySummary(userId, summary);

    // Update global user context
    await updateUserContext(userId);

    console.log(`Daily summary processed for user ${userId}`);
  } catch (error) {
    console.error(`Failed to process daily summary for ${userId}:`, error);
    throw error;
  }
}
