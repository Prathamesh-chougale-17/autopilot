import { os, z } from "./helpers";
import { requireAdmin } from "./helpers";
import client from "@/lib/mongodb";
import { env } from "@/env";

// Admin: Get all users
export const getUsers = os
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
    await requireAdmin();

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
