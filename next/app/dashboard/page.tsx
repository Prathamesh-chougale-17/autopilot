import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import Link from "next/link";
import { Shield, Users, GamepadIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "admin" || session.user.role === "super-admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, {session.user.name}</p>
          </div>
          <SignOutButton />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.user.name}</div>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  {session.user.role || "user"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games</CardTitle>
              <GamepadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Available games</p>
              <div className="mt-4">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Play Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-amber-500/50 bg-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Panel</CardTitle>
                <Shield className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">Access Granted</div>
                <p className="text-xs text-muted-foreground">Manage users and roles</p>
                <div className="mt-4">
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="border-amber-500/50 hover:bg-amber-950/40">
                      Open Admin
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Your current session details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                <dd className="mt-1 text-sm text-foreground">{session.user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Session ID</dt>
                <dd className="mt-1 text-sm text-foreground truncate">{session.session.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(session.session.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Expires At</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(session.session.expiresAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
