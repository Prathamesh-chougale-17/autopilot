"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { client } from "@/lib/orpc";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, User } from "lucide-react";

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

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState<string>("");
  const [editedBody, setEditedBody] = useState<string>("");

  const {
    data: task,
    isPending,
    isError,
  } = useQuery<TaskItem>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await client.autopilot.listTasks({
        status: "needs_approval",
        limit: 50,
      });
      const found = res.items.find((t) => t.id === taskId);
      if (!found) throw new Error("Task not found");
      return found as TaskItem;
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({
      modifiedSubject,
      modifiedBody,
    }: {
      modifiedSubject?: string;
      modifiedBody?: string;
    }) => client.ai.approveReply({ taskId, modifiedSubject, modifiedBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot", "activity"] });
      router.push("/dashboard/approvals");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => client.ai.rejectReply({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot", "activity"] });
      router.push("/dashboard/approvals");
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedSubject(
      task?.draftReply?.subject || `Re: ${task?.input.subject || ""}`
    );
    setEditedBody(task?.draftReply?.body || "");
  };

  const handleSend = () => {
    if (isEditing) {
      approveMutation.mutate({
        modifiedSubject: editedSubject || undefined,
        modifiedBody: editedBody || undefined,
      });
    } else {
      approveMutation.mutate({});
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Task not found or has been processed.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push("/dashboard/approvals")}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Approvals
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/approvals")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Email Approval</h1>
      </div>

      {(approveMutation.isError || rejectMutation.isError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to process the request. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Original Email Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Incoming Email
              </CardTitle>
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
                  <Badge variant="secondary">
                    {task.classification.category}
                  </Badge>
                )}
                {task.classification?.sentiment && (
                  <Badge variant="outline">
                    {task.classification.sentiment}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    FROM
                  </p>
                  <p className="font-medium">
                    {String(task.input.from || "Unknown")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    SUBJECT
                  </p>
                  <p className="font-medium">
                    {String(task.input.subject || "(No subject)")}
                  </p>
                </div>
              </div>
            </div>

            {task.classification?.keyPoints &&
              task.classification.keyPoints.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    KEY POINTS
                  </p>
                  <ul className="space-y-2">
                    {task.classification.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {task.suggestedAction && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  SUGGESTED ACTION
                </p>
                <p className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md">
                  {task.suggestedAction}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Draft Reply Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                ✉️{" "}
                {task.draftReply?.body ? "AI Generated Reply" : "Compose Reply"}
              </CardTitle>
              {task.draftReply?.tone && (
                <Badge variant="outline">{task.draftReply.tone} tone</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    SUBJECT
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
                    MESSAGE
                  </label>
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={16}
                    className="mt-1.5 text-sm"
                    placeholder="Type your reply..."
                  />
                </div>
              </div>
            ) : task.draftReply?.body ? (
              <div className="space-y-4">
                {task.draftReply.subject && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      SUBJECT
                    </p>
                    <p className="font-medium">{task.draftReply.subject}</p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    MESSAGE
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {task.draftReply.body}
                  </div>
                </div>
                {task.draftReply.reason && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      WHY THIS NEEDS APPROVAL
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      {task.draftReply.reason}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No AI draft was generated for this email.
                </p>
                <Button onClick={handleEdit}>Compose Manual Reply</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                disabled={approveMutation.isPending || !editedBody.trim()}
                onClick={handleSend}
              >
                {approveMutation.isPending ? "Sending..." : "✓ Send Reply"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                {rejectMutation.isPending ? "..." : "✕ Discard"}
              </Button>
              {task.draftReply?.body && (
                <>
                  <Button variant="outline" onClick={handleEdit}>
                    ✏️ Edit & Customize
                  </Button>
                  <Button
                    disabled={approveMutation.isPending}
                    onClick={handleSend}
                  >
                    {approveMutation.isPending
                      ? "Sending..."
                      : "✓ Send as Draft"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
