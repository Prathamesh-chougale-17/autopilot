"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const queryClient = useQueryClient();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedSubject, setEditedSubject] = useState<string>("");
  const [editedBody, setEditedBody] = useState<string>("");

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

  const approveMutation = useMutation({
    mutationFn: ({
      taskId,
      modifiedSubject,
      modifiedBody,
    }: {
      taskId: string;
      modifiedSubject?: string;
      modifiedBody?: string;
    }) => client.ai.approveReply({ taskId, modifiedSubject, modifiedBody }),
    onSuccess: () => {
      setEditingTaskId(null);
      queryClient.invalidateQueries({ queryKey: ["autopilot", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot", "activity"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      client.ai.rejectReply({ taskId, reason }),
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
        {(approveMutation.isError || rejectMutation.isError) && (
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          AI Draft Reply:
                        </span>
                        {task.draftReply.tone && (
                          <Badge variant="outline" className="text-xs">
                            {task.draftReply.tone}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (editingTaskId === task.id) {
                              setEditingTaskId(null);
                            } else {
                              setEditingTaskId(task.id);
                              setEditedSubject(task.draftReply?.subject || "");
                              setEditedBody(task.draftReply?.body || "");
                            }
                          }}
                        >
                          {editingTaskId === task.id ? "Cancel Edit" : "Edit"}
                        </Button>
                      </div>
                      {editingTaskId === task.id ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Subject:
                            </label>
                            <Input
                              value={editedSubject}
                              onChange={(e) => setEditedSubject(e.target.value)}
                              className="mt-1"
                              placeholder="Reply subject"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Message:
                            </label>
                            <Textarea
                              value={editedBody}
                              onChange={(e) => setEditedBody(e.target.value)}
                              rows={8}
                              className="mt-1 font-mono text-sm"
                              placeholder="Reply body"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {task.draftReply.subject && (
                            <div className="text-sm">
                              <span className="font-medium">Subject:</span>{" "}
                              <span className="text-muted-foreground">
                                {task.draftReply.subject}
                              </span>
                            </div>
                          )}
                          <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                            {task.draftReply.body}
                          </div>
                        </>
                      )}
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
                      disabled={approveMutation.isPending}
                      onClick={() => {
                        if (editingTaskId === task.id) {
                          approveMutation.mutate({
                            taskId: task.id,
                            modifiedSubject:
                              editedSubject !== (task.draftReply?.subject || "")
                                ? editedSubject
                                : undefined,
                            modifiedBody:
                              editedBody !== (task.draftReply?.body || "")
                                ? editedBody
                                : undefined,
                          });
                        } else {
                          approveMutation.mutate({ taskId: task.id });
                        }
                      }}
                    >
                      {editingTaskId === task.id ? "Save & Send" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ taskId: task.id })}
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
