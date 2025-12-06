import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutopilotToggles } from "@/components/autopilot/toggles";
import { ApprovalsPanel } from "@/components/autopilot/approvals";
import { ActivityLogPanel } from "@/components/autopilot/activity-log";
import { ReportsDashboard } from "@/components/autopilot/reports-dashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <AutopilotToggles />
          <ApprovalsPanel />
        </div>

        <ActivityLogPanel />

        {/* Reports & Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Reports & Analytics</CardTitle>
            <CardDescription>
              Track your autopilot performance and connector activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
