import { os } from "@orpc/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { env } from "@/env";

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
    const client = await clientPromise;
    const db = client.db(env.MONGODB_DB_NAME);
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

export const router = os.router({
  hello,
  admin: os.router({
    getUsers,
  }),
});
export type Router = typeof router;
