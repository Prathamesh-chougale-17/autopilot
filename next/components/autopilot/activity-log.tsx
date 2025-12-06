"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

interface ActivityItem {
  id: string;
  action: string;
  createdAt: string;
  context?: Record<string, unknown>;
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
    refetchInterval: 10000, // auto-refresh every 10s for real-time feel
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        {data &&
          data.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between rounded-md border p-3 text-sm"
            >
              <div className="space-y-1">
                <div className="font-medium text-foreground">{item.action}</div>
                {item.context && Object.keys(item.context).length > 0 && (
                  <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">
                    {JSON.stringify(item.context, null, 2)}
                  </pre>
                )}
              </div>
              <Badge variant="outline">
                {new Date(item.createdAt).toLocaleString()}
              </Badge>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
