import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserManagement } from "@/components/admin/user-management";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <AdminHeader session={session} />
      <div className="container mx-auto p-6 space-y-6">
        <UserManagement />
      </div>
    </div>
  );
}
