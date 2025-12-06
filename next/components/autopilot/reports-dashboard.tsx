"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  DollarSign,
  Mail,
  MessageSquare,
  Send,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type ReportWindow = "daily" | "weekly" | "monthly";

export function ReportsDashboard() {
  const [window, setWindow] = useState<ReportWindow>("daily");

  const { data: report, isLoading } = useQuery({
    queryKey: ["autopilot", "report", window],
    queryFn: () => client.autopilot.getReport({ window }),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No report data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Window Selector */}
      <Tabs value={window} onValueChange={(v) => setWindow(v as ReportWindow)}>
        <TabsList>
          <TabsTrigger value="daily">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Tasks Completed"
          value={report.summary.tasksCompleted}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={report.summary.tasksCompleted > 0 ? "up" : "neutral"}
        />
        <SummaryCard
          title="Tasks Pending"
          value={report.summary.tasksPending}
          icon={<Clock className="h-4 w-4" />}
          variant={report.summary.tasksPending > 10 ? "warning" : "default"}
        />
        <SummaryCard
          title="New Leads"
          value={report.summary.leads}
          icon={<Users className="h-4 w-4" />}
          trend={report.summary.leads > 0 ? "up" : "neutral"}
        />
        <SummaryCard
          title="Invoices Sent"
          value={report.summary.invoicesSent}
          icon={<FileText className="h-4 w-4" />}
        />
        <SummaryCard
          title="Overdue Invoices"
          value={report.summary.invoicesOverdue}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={
            report.summary.invoicesOverdue > 0 ? "destructive" : "default"
          }
        />
        <SummaryCard
          title="Payments Received"
          value={report.summary.paymentsReceived}
          icon={<DollarSign className="h-4 w-4" />}
          trend={report.summary.paymentsReceived > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Connector Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connector Activity</CardTitle>
          <CardDescription>
            Automated processing from connected services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {report.connectorStats.emailsProcessed}
                </p>
                <p className="text-sm text-muted-foreground">
                  Emails Processed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {report.connectorStats.messagesProcessed}
                </p>
                <p className="text-sm text-muted-foreground">
                  WhatsApp Messages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {report.connectorStats.autoRepliesSent}
                </p>
                <p className="text-sm text-muted-foreground">
                  Auto-Replies Sent
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {report.tasksByAgent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {report.tasksByAgent.map(
                  (item: {
                    agent: string;
                    count: number;
                    completed: number;
                    pending: number;
                  }) => (
                    <div
                      key={item.agent}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.agent}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          {item.completed} ✓
                        </span>
                        <span className="text-yellow-600">
                          {item.pending} ⏳
                        </span>
                        <span className="font-medium">{item.count} total</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {report.tasksByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {report.tasksByStatus.map(
                  (item: { status: string; count: number }) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between"
                    >
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status}
                      </Badge>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            Last 20 actions in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.recentActivity.map(
                (item: {
                  id: string;
                  action: string;
                  createdAt: Date | string;
                }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm font-medium">{item.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon,
  variant = "default",
  trend,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "destructive";
  trend?: "up" | "down" | "neutral";
}) {
  const variantClasses = {
    default: "bg-card",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200",
    destructive: "bg-red-50 dark:bg-red-900/20 border-red-200",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm">{title}</span>
          </div>
          {trend && trend !== "neutral" && (
            <div>
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// Skeleton loader
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

// Helper functions
function getStatusVariant(status: string) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    completed: "default",
    approved: "default",
    pending: "secondary",
    processing: "secondary",
    needs_approval: "outline",
    rejected: "destructive",
    failed: "destructive",
  };
  return variants[status] || "secondary";
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
