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
    <div className="flex flex-col h-full bg-background/50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur-md px-6 sticky top-0 z-10 transition-all">
        <SidebarTrigger className="-ml-1 hover:bg-accent/50" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Autopilot Settings</h1>
      </header>
      <div className="flex-1 p-6 md:p-8 pt-6 space-y-6">
        <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <AutopilotToggles />

          <Card className="glass-card border-white/10 shadow-lg bg-background/40 backdrop-blur-xl">
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
      </div>
    </div>
  );
}
