import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AutoEmailProcessor } from "@/components/autopilot/auto-processor";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={session.user} />
      <SidebarInset>
        <AutoEmailProcessor />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
