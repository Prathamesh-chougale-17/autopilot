"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Mail } from "lucide-react";

interface TaskItem {
  id: string;
  agent: string;
  status: string;
  input: Record<string, unknown>;
  confidence?: number;
  suggestedAction?: string;
  classification?: {
    category?: string;
    priority?: string;
    sentiment?: string;
    keyPoints?: string[];
  };
  draftReply?: {
    subject?: string;
    body?: string;
    tone?: string;
    reason?: string;
  };
}

export function ApprovalsPanel() {
  const router = useRouter();

  const { data, isPending, isError, error } = useQuery<TaskItem[]>({
    queryKey: ["autopilot", "approvals"],
    queryFn: async () => {
      const res = await client.autopilot.listTasks({
        status: "needs_approval",
        limit: 50,
      });
      return res.items as TaskItem[];
    },
    refetchInterval: 5000,
  });

  const handleOpenApproval = (taskId: string) => {
    router.push(`/dashboard/approvals/${taskId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Pending Replies</CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Auto-processing enabled
            </div>
          </div>
          {data && data.length > 0 && (
            <Badge variant="destructive">{data.length} awaiting approval</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading pending replies...
          </div>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {(error as Error)?.message ?? "Failed to load approvals"}
            </AlertDescription>
          </Alert>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No replies awaiting approval.
          </p>
        )}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-4">
            {data &&
              data.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenApproval(task.id)}
                  className="group flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-accent/50 cursor-pointer transition-all"
                >
                  {/* Icon */}
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {String(task.input.from || "Unknown Sender")}
                      </p>
                      {task.classification?.priority === "high" && (
                        <Badge variant="destructive" className="text-xs">
                          High
                        </Badge>
                      )}
                      {task.draftReply?.body && (
                        <Badge variant="secondary" className="text-xs">
                          Draft Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {String(task.input.subject || "(No subject)")}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
