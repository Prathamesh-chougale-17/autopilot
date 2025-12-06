import { ObjectId } from "mongodb";
import { os, z, getAuthSession } from "./helpers";
import client from "@/lib/mongodb";
import { env } from "@/env";
import {
  businessContextSchema,
  businessContextInputSchema,
  type BusinessContext,
} from "@/lib/models";

/**
 * Get current user's business context
 */
export const getContext = os
  .input(z.object({}))
  .output(businessContextSchema.nullable())
  .route({ method: "GET", path: "/context" })
  .handler(async () => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const contextColl = db.collection("business_context");

    const record = await contextColl.findOne({
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    });

    if (!record) {
      return null;
    }

    return {
      id: (record.id ?? record._id)?.toString(),
      userId:
        record.userId instanceof ObjectId
          ? record.userId.toHexString()
          : String(record.userId),
      businessName: record.businessName ?? undefined,
      industry: record.industry ?? undefined,
      description: record.description ?? undefined,
      tone: record.tone ?? "professional",
      signatureTemplate: record.signatureTemplate ?? undefined,
      commonResponses: record.commonResponses ?? [],
      keywords: record.keywords ?? [],
      additionalContext: record.additionalContext ?? undefined,
      createdAt: record.createdAt ?? new Date(),
      updatedAt: record.updatedAt ?? new Date(),
    };
  });

/**
 * Save/update business context
 */
export const setContext = os
  .input(businessContextInputSchema)
  .output(businessContextSchema)
  .route({ method: "POST", path: "/context" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const contextColl = db.collection("business_context");

    const now = new Date();

    // Check if context exists
    const existing = await contextColl.findOne({
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    });

    if (existing) {
      // Update existing
      await contextColl.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...input,
            updatedAt: now,
          },
        }
      );

      return {
        id: (existing.id ?? existing._id)?.toString(),
        userId: String(session.user.id),
        ...input,
        createdAt: existing.createdAt ?? now,
        updatedAt: now,
      };
    } else {
      // Create new
      const newContext: BusinessContext = {
        id: new ObjectId().toHexString(),
        userId: String(session.user.id),
        ...input,
        createdAt: now,
        updatedAt: now,
      };

      await contextColl.insertOne(newContext);

      return newContext;
    }
  });

/**
 * Delete business context
 */
export const deleteContext = os
  .input(z.object({}))
  .output(z.object({ success: z.boolean() }))
  .route({ method: "DELETE", path: "/context" })
  .handler(async () => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const contextColl = db.collection("business_context");

    await contextColl.deleteOne({
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    });

    return { success: true };
  });

/**
 * Add a common response template
 */
export const addCommonResponse = os
  .input(
    z.object({
      label: z.string().min(1),
      template: z.string().min(1),
    })
  )
  .output(businessContextSchema)
  .route({ method: "POST", path: "/context/responses" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const contextColl = db.collection("business_context");

    const now = new Date();

    // First, check if context exists
    const existing = await contextColl.findOne({
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    });

    if (existing) {
      // Update existing - push to array
      const currentResponses = existing.commonResponses || [];
      await contextColl.updateOne(
        { _id: existing._id },
        {
          $set: {
            commonResponses: [...currentResponses, input],
            updatedAt: now,
          },
        }
      );

      return {
        id: (existing.id ?? existing._id)?.toString(),
        userId: String(session.user.id),
        businessName: existing.businessName ?? undefined,
        industry: existing.industry ?? undefined,
        description: existing.description ?? undefined,
        tone: existing.tone ?? "professional",
        signatureTemplate: existing.signatureTemplate ?? undefined,
        commonResponses: [...currentResponses, input],
        keywords: existing.keywords ?? [],
        additionalContext: existing.additionalContext ?? undefined,
        createdAt: existing.createdAt ?? now,
        updatedAt: now,
      };
    } else {
      // Create new context with the response
      const newContext: BusinessContext = {
        id: new ObjectId().toHexString(),
        userId: String(session.user.id),
        tone: "professional",
        commonResponses: [input],
        keywords: [],
        createdAt: now,
        updatedAt: now,
      };

      await contextColl.insertOne(newContext);

      return newContext;
    }
  });

/**
 * Remove a common response template by label
 */
export const removeCommonResponse = os
  .input(z.object({ label: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .route({ method: "DELETE", path: "/context/responses" })
  .handler(async ({ input }) => {
    const session = await getAuthSession();

    const dbClient = await client.connect();
    const db = dbClient.db(env.MONGODB_DB_NAME);
    const contextColl = db.collection("business_context");

    // Find existing context
    const existing = await contextColl.findOne({
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) },
      ],
    });

    if (existing && existing.commonResponses) {
      // Filter out the response with matching label
      const filteredResponses = existing.commonResponses.filter(
        (r: { label: string }) => r.label !== input.label
      );

      await contextColl.updateOne(
        { _id: existing._id },
        {
          $set: {
            commonResponses: filteredResponses,
            updatedAt: new Date(),
          },
        }
      );
    }

    return { success: true };
  });

// Export router group
export const contextRouter = os.router({
  get: getContext,
  set: setContext,
  delete: deleteContext,
  addResponse: addCommonResponse,
  removeResponse: removeCommonResponse,
});
