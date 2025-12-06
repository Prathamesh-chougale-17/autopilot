"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface TaskItem {
  id: string;
  agent: string;
  status: string;
  input: Record<string, unknown>;
  confidence?: number;
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
      return res.items.map((t) => ({
        id: t.id,
        agent: t.agent,
        status: t.status,
        input: t.input ?? {},
        confidence: t.confidence,
      }));
    },
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
        <CardTitle>Approvals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        {data &&
          data.map((task) => (
            <div key={task.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground capitalize">
                    {task.agent} agent
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Task ID: {task.id}
                  </p>
                  {task.confidence !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Confidence: {(task.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <Badge variant="outline">{task.status}</Badge>
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-muted-foreground">
                {JSON.stringify(task.input, null, 2)}
              </pre>
              <div className="mt-3 flex gap-2">
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
      </CardContent>
    </Card>
  );
}
