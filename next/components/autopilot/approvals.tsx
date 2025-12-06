"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    body?: string;
    tone?: string;
    reason?: string;
  };
}

export function ApprovalsPanel() {
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useQuery<TaskItem[]>({
    queryKey: ["autopilot", "approvals"],
    queryFn: async () => {
      const res = await client.autopilot.listTasks({
        status: "needs_approval",
        limit: 50,
      });
      return res.items.map((t) => {
        // Handle extended task data from raw response
        const raw = t as unknown as Record<string, unknown>;
        return {
          id: t.id,
          agent: t.agent,
          status: t.status,
          input: t.input ?? {},
          confidence: t.confidence,
          suggestedAction: raw.suggestedAction as string | undefined,
          classification: raw.classification as TaskItem["classification"],
          draftReply: raw.draftReply as TaskItem["draftReply"],
        };
      });
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const mutation = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: "approved" | "rejected";
    }) => client.autopilot.setTaskStatus({ taskId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot", "activity"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Approvals</CardTitle>
          {data && data.length > 0 && (
            <Badge variant="destructive">{data.length} pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading approvals...
          </div>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {(error as Error)?.message ?? "Failed to load approvals"}
            </AlertDescription>
          </Alert>
        )}
        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to update task</AlertDescription>
          </Alert>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">No approvals pending.</p>
        )}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {data &&
              data.map((task) => (
                <div key={task.id} className="rounded-md border p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {task.agent}
                      </Badge>
                      {task.classification?.priority && (
                        <Badge
                          variant={
                            task.classification.priority === "high"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {task.classification.priority}
                        </Badge>
                      )}
                      {task.classification?.sentiment && (
                        <Badge
                          variant={
                            task.classification.sentiment === "positive"
                              ? "default"
                              : task.classification.sentiment === "negative"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {task.classification.sentiment}
                        </Badge>
                      )}
                    </div>
                    {task.confidence !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {(task.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>

                  {/* Email Info (for email agent) */}
                  {task.agent === "email" && task.input && (
                    <div className="space-y-2 bg-muted/50 rounded-md p-3">
                      <div className="text-sm">
                        <span className="font-medium">From:</span>{" "}
                        <span className="text-muted-foreground">
                          {String(task.input.from || "Unknown")}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Subject:</span>{" "}
                        <span className="text-muted-foreground">
                          {String(task.input.subject || "(No subject)")}
                        </span>
                      </div>
                      {task.classification?.keyPoints &&
                        task.classification.keyPoints.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Key Points:</span>
                            <ul className="list-disc list-inside text-muted-foreground mt-1">
                              {task.classification.keyPoints.map((point, i) => (
                                <li key={i} className="text-xs">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Suggested Action */}
                  {task.suggestedAction && (
                    <div className="text-sm">
                      <span className="font-medium">Suggested:</span>{" "}
                      <span className="text-muted-foreground">
                        {task.suggestedAction}
                      </span>
                    </div>
                  )}

                  {/* Draft Reply (if available) */}
                  {task.draftReply?.body && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          AI Draft Reply:
                        </span>
                        {task.draftReply.tone && (
                          <Badge variant="outline" className="text-xs">
                            {task.draftReply.tone}
                          </Badge>
                        )}
                      </div>
                      <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                        {task.draftReply.body}
                      </div>
                    </div>
                  )}

                  {/* Non-email task input */}
                  {task.agent !== "email" && (
                    <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                      {JSON.stringify(task.input, null, 2)}
                    </pre>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ taskId: task.id, status: "approved" })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ taskId: task.id, status: "rejected" })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
