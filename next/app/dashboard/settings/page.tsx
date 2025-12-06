import { AutopilotToggles } from "@/components/autopilot/toggles";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Autopilot Settings</h1>
      </header>
      <div className="flex-1 p-6 space-y-6">
        <AutopilotToggles />

        <Card>
          <CardHeader>
            <CardTitle>About Autopilot</CardTitle>
            <CardDescription>
              Configure which tasks the AI can handle automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Auto Reply:</strong> When
              enabled, the AI will automatically draft and send replies to
              incoming emails based on context and your previous communication
              patterns.
            </p>
            <p>
              <strong className="text-foreground">Auto Invoice:</strong>{" "}
              Automatically generates and sends invoices when triggered by
              specific events or schedules.
            </p>
            <p>
              <strong className="text-foreground">Auto Follow-Up:</strong> Sends
              follow-up messages to contacts who haven&apos;t responded within a
              configured time period.
            </p>
            <p>
              <strong className="text-foreground">Auto Reporting:</strong>{" "}
              Generates and distributes periodic reports about business metrics
              and AI activity.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
