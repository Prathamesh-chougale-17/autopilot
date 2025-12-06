import { ReportsDashboard } from "@/components/autopilot/reports-dashboard";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Reports & Analytics</h1>
      </header>
      <div className="flex-1 p-6">
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
    </>
  );
}
