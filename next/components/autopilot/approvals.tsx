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
      return res.items as TaskItem[];
    },
    refetchInterval: 5000,
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
          <CardTitle>Pending Replies</CardTitle>
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
        {(approveMutation.isError || rejectMutation.isError) && (
          <Alert variant="destructive">
            <AlertDescription>Failed to update task</AlertDescription>
          </Alert>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">No replies awaiting approval.</p>
        )}
        <ScrollArea className="h-[500px]">
          <div className="space-y-4 pr-4">
            {data &&
              data.map((task) => (
                <div key={task.id} className="rounded-lg border p-4 space-y-4">
                  {/* Original Email Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">📧 Incoming Email</h3>
                      <div className="flex items-center gap-2">
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
                        {task.classification?.category && (
                          <Badge variant="secondary">{task.classification.category}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">FROM:</span>
                        <div className="font-medium text-sm mt-1">
                          {String(task.input.from || "Unknown")}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">SUBJECT:</span>
                        <div className="font-medium text-sm mt-1">
                          {String(task.input.subject || "(No subject)")}
                        </div>
                      </div>
                      {task.classification?.keyPoints &&
                        task.classification.keyPoints.length > 0 && (
                          <div className="pt-2 border-t">
                            <span className="text-xs font-medium text-muted-foreground">
                              KEY POINTS:
                            </span>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                              {task.classification.keyPoints.map((point, i) => (
                                <li key={i} className="text-sm text-muted-foreground">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Draft Reply Section */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        ✉️ {task.draftReply?.body ? "AI Draft Reply" : "Compose Reply"}
                      </h3>
                      {task.draftReply?.tone && (
                        <Badge variant="outline" className="text-xs">
                          {task.draftReply.tone} tone
                        </Badge>
                      )}
                    </div>

                    {editingTaskId === task.id ? (
                      <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">
                            SUBJECT:
                          </label>
                          <Input
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="mt-1.5"
                            placeholder="Reply subject"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">
                            MESSAGE:
                          </label>
                          <Textarea
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            rows={12}
                            className="mt-1.5 text-sm font-normal"
                            placeholder="Type your reply..."
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            disabled={approveMutation.isPending || !editedBody.trim()}
                            onClick={() => {
                              approveMutation.mutate({
                                taskId: task.id,
                                modifiedSubject: editedSubject || undefined,
                                modifiedBody: editedBody || undefined,
                              });
                            }}
                          >
                            {approveMutation.isPending ? "Sending..." : "✓ Send Reply"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTaskId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : task.draftReply?.body ? (
                      <div className="space-y-3">
                        <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-4 space-y-3">
                          {task.draftReply.subject && (
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground">
                                SUBJECT:
                              </span>
                              <div className="font-medium text-sm mt-1">
                                {task.draftReply.subject}
                              </div>
                            </div>
                          )}
                          <div className="border-t pt-3">
                            <span className="text-xs font-semibold text-muted-foreground">
                              MESSAGE:
                            </span>
                            <div className="text-sm whitespace-pre-wrap mt-2">
                              {task.draftReply.body}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={approveMutation.isPending}
                            onClick={() => {
                              approveMutation.mutate({ taskId: task.id });
                            }}
                          >
                            {approveMutation.isPending ? "Sending..." : "✓ Send as Draft"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setEditedSubject(
                                task.draftReply?.subject ||
                                  `Re: ${task.input.subject || ""}`
                              );
                              setEditedBody(task.draftReply?.body || "");
                            }}
                          >
                            ✏️ Edit & Customize
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate({ taskId: task.id })}
                          >
                            {rejectMutation.isPending ? "..." : "✕ Discard"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground text-center italic">
                          No AI draft generated. Click below to compose a reply manually.
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditedSubject(`Re: ${task.input.subject || ""}`);
                            setEditedBody("");
                          }}
                        >
                          ✏️ Compose Reply
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
