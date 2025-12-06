"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Bot, CheckCircle, XCircle, Clock, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  createdAt: string;
  context?: Record<string, unknown>;
}

// Get icon based on action type
function getActionIcon(action: string) {
  if (action.includes("email") || action.includes("gmail")) {
    return <Mail className="h-4 w-4 text-blue-500" />;
  }
  if (action.includes("approved")) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (action.includes("rejected")) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  if (action.includes("task")) {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  }
  if (action.includes("ai") || action.includes("process")) {
    return <Bot className="h-4 w-4 text-purple-500" />;
  }
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

// Format action for display
function formatAction(action: string): string {
  return action.replace(/[_:]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Generate friendly title based on action and context
function generateActivityTitle(
  action: string,
  context?: Record<string, unknown>
): string {
  // Email-related actions
  if (action.includes("email:auto_replied") && context?.subject) {
    return `Auto-replied: ${context.subject}`;
  }
  if (action.includes("email:draft_created") && context?.subject) {
    return `Draft created: ${context.subject}`;
  }
  if (action.includes("email:reply_approved")) {
    return context?.subject
      ? `Reply approved: ${context.subject}`
      : "Reply approved and sent";
  }
  if (action.includes("email:reply_rejected")) {
    return context?.subject
      ? `Draft rejected: ${context.subject}`
      : "Draft reply rejected";
  }
  if (action.includes("email:skipped") && context?.reason === "spam") {
    return context?.subject
      ? `Spam filtered: ${context.subject}`
      : "Spam email filtered";
  }
  if (action.includes("email:skipped") && context?.reason === "newsletter") {
    return context?.subject
      ? `Newsletter filtered: ${context.subject}`
      : "Newsletter email filtered";
  }
  if (action.includes("email:skipped_already_processed")) {
    return context?.subject
      ? `Already processed: ${context.subject}`
      : "Skipped: Already processed";
  }
  if (action.includes("email:skipped") && context?.reason === "existing_task") {
    return context?.subject
      ? `Already has task: ${context.subject}`
      : "Skipped: Already has task";
  }
  if (action.includes("email:skipped")) {
    return context?.subject
      ? `Skipped: ${context.subject}`
      : `Email skipped: ${context?.reason || "unknown"}`;
  }
  if (action.includes("email:process_failed")) {
    return context?.subject
      ? `Failed to process: ${context.subject}`
      : "Failed to process email";
  }

  // Gmail actions
  if (action.includes("gmail_send") && context?.to) {
    const subject = context?.subject ? `: ${context.subject}` : "";
    return `Sent to ${context.to}${subject}`;
  }
  if (action.includes("gmail_reply") && context?.subject) {
    return `Replied: ${context.subject}`;
  }

  // Task actions
  if (action.includes("task_created") && context?.taskId) {
    return `New task created`;
  }
  if (action.includes("task_approved")) {
    return "Task approved";
  }
  if (action.includes("task_rejected")) {
    return "Task rejected";
  }

  // AI processing
  if (action.includes("ai:process_emails")) {
    return "AI processed emails";
  }

  // Fallback to formatted action
  return formatAction(action);
}

// Format context value for display - show subject for emails, truncate long text
function formatContextValue(key: string, value: unknown): string {
  const strValue = typeof value === "string" ? value : JSON.stringify(value);

  // For email-related keys, show more context
  if (key === "subject" || key === "to" || key === "from") {
    return strValue.length > 60 ? strValue.slice(0, 60) + "..." : strValue;
  }

  // Skip showing raw IDs, prefer showing meaningful data
  if (key === "emailId" || key === "messageId" || key === "taskId") {
    return strValue.slice(0, 8) + "...";
  }

  // Truncate long values
  return strValue.length > 50 ? strValue.slice(0, 50) + "..." : strValue;
}

// Get display-friendly context entries, prioritizing meaningful data
function getDisplayContext(
  action: string,
  context: Record<string, unknown>
): [string, unknown][] {
  const priorityKeys = ["subject", "to", "from", "category", "action"];
  const skipKeys = ["emailId", "messageId", "threadId", "reason"]; // Skip reason since it's in title

  const entries = Object.entries(context);

  // Sort by priority
  entries.sort(([a], [b]) => {
    const aIdx = priorityKeys.indexOf(a);
    const bIdx = priorityKeys.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });

  // Filter and limit
  const filtered = entries
    .filter(([key]) => !skipKeys.includes(key))
    .slice(0, 3);

  // If we filtered everything out for skip actions, return empty
  if (filtered.length === 0 && action.includes("skipped")) {
    return [];
  }

  return filtered;
}

export function ActivityLogPanel() {
  const { data, isPending, isError, error } = useQuery<ActivityItem[]>({
    queryKey: ["autopilot", "activity"],
    queryFn: async () => {
      const res = await client.autopilot.listActivity({ limit: 50 });
      return res.items.map((item) => ({
        id: item.id,
        action: item.action,
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date(item.createdAt).toISOString(),
        context: item.context ?? {},
      }));
    },
    refetchInterval: 5000, // auto-refresh every 5s for real-time feel
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          {data && data.length > 0 && (
            <Badge variant="secondary">{data.length} events</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading activity...
          </div>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {(error as Error)?.message ?? "Failed to load activity"}
            </AlertDescription>
          </Alert>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-4">
            {data &&
              data.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getActionIcon(item.action)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-medium text-foreground">
                      {generateActivityTitle(item.action, item.context)}
                    </div>
                    {item.context && Object.keys(item.context).length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {getDisplayContext(item.action, item.context).map(
                          ([key, value]) => (
                            <div key={key} className="truncate">
                              <span className="font-medium capitalize">
                                {key}:
                              </span>{" "}
                              {formatContextValue(key, value)}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
