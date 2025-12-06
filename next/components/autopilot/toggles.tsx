"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toggleFields: {
  key:
    | "autoReply"
    | "autoInvoice"
    | "autoFollowUp"
    | "autoReporting"
    | "autoProcess";
  label: string;
  description: string;
}[] = [
  {
    key: "autoReply",
    label: "Auto reply",
    description:
      "Draft and send replies automatically when confidence is high.",
  },
  {
    key: "autoInvoice",
    label: "Auto invoice",
    description:
      "Generate invoices, send reminders, and track due dates automatically.",
  },
  {
    key: "autoFollowUp",
    label: "Auto follow-up",
    description: "Nudge leads and customers on schedule without manual effort.",
  },
  {
    key: "autoReporting",
    label: "Auto reporting",
    description: "Send daily/weekly summaries of tasks, leads, and payments.",
  },
  {
    key: "autoProcess",
    label: "Auto process emails",
    description: "Automatically process incoming emails when fetched.",
  },
];

type ToggleState = {
  autoReply: boolean;
  autoInvoice: boolean;
  autoFollowUp: boolean;
  autoReporting: boolean;
  autoProcess: boolean;
  gmailCategory: "all" | "primary" | "updates";
};

export function AutopilotToggles() {
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useQuery<ToggleState>({
    queryKey: ["autopilot", "toggles"],
    queryFn: () => client.autopilot.getToggles({}),
  });

  const mutation = useMutation({
    mutationFn: (next: ToggleState) => client.autopilot.setToggles(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["autopilot", "toggles"] });
      const previous = queryClient.getQueryData<ToggleState>([
        "autopilot",
        "toggles",
      ]);
      queryClient.setQueryData(["autopilot", "toggles"], next);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["autopilot", "toggles"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "toggles"] });
    },
  });

  const updateToggle = (key: keyof ToggleState, value: boolean) => {
    if (!data) return;
    mutation.mutate({ ...data, [key]: value });
  };

  const updateCategory = (value: "all" | "primary" | "updates") => {
    if (!data) return;
    mutation.mutate({ ...data, gmailCategory: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autopilot Toggles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading toggles...
          </div>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {(error as Error)?.message ?? "Failed to load toggles"}
            </AlertDescription>
          </Alert>
        )}
        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to update toggles</AlertDescription>
          </Alert>
        )}

        {/* Gmail Category Filter */}
        {data && (
          <div className="rounded-md border p-3">
            <Label className="text-base font-medium">Gmail Category</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Filter emails by Gmail category (Primary: client emails, Updates:
              notifications, All: everything)
            </p>
            <Select
              value={data.gmailCategory}
              onValueChange={updateCategory}
              disabled={mutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary (Client Emails)</SelectItem>
                <SelectItem value="updates">Updates (Notifications)</SelectItem>
                <SelectItem value="all">All Categories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {data &&
          toggleFields.map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 rounded-md border p-3"
            >
              <div>
                <Label className="text-base font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={data[item.key]}
                onCheckedChange={(val) => updateToggle(item.key, val)}
                aria-label={item.label}
                disabled={mutation.isPending}
              />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
