import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  CheckSquare,
  Activity,
  BarChart3,
  Bot,
  Zap,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Mission Control</h1>
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </span>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Good Morning, Prathamesh</h2>
            <p className="text-muted-foreground">
              Your AI agents have been busy. Here's what's happening.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              Configure Agents
            </Link>
            <Link href="/dashboard/approvals" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              Review Approvals
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5 hrs</div>
              <p className="text-xs text-muted-foreground">
                +2.5 hrs from last week
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Automated</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-orange-500/20 bg-orange-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-500">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">3</div>
              <p className="text-xs text-muted-foreground">
                Requires your attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Live Activity Feed */}
          <Card className="col-span-4 glass-card">
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>
                Real-time actions taken by your agent mesh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  {
                    agent: "Email Agent",
                    action: "Drafted reply to 'Partnership Inquiry'",
                    time: "2 mins ago",
                    icon: Mail,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10"
                  },
                  {
                    agent: "Finance Agent",
                    action: "Generated invoice #INV-2024-001 for Acme Corp",
                    time: "15 mins ago",
                    icon: FileTextIcon,
                    color: "text-green-500",
                    bg: "bg-green-500/10"
                  },
                  {
                    agent: "CRM Agent",
                    action: "Updated contact info for Sarah Connor",
                    time: "1 hour ago",
                    icon: UsersIcon,
                    color: "text-purple-500",
                    bg: "bg-purple-500/10"
                  },
                  {
                    agent: "Reporting Agent",
                    action: "Compiled Weekly Sales Report",
                    time: "3 hours ago",
                    icon: BarChart3,
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10"
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${item.bg} ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.agent}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.action}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="col-span-3 glass-card">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Review and authorize high-confidence actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Send Bulk Invoice",
                    desc: "Send 5 invoices totaling $12,500",
                    confidence: "98%",
                  },
                  {
                    title: "Refund Request",
                    desc: "Approve refund for Order #9921",
                    confidence: "85%",
                  },
                  {
                    title: "Publish Blog Post",
                    desc: "Schedule 'AI Trends 2025' for tomorrow",
                    confidence: "92%",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                        {item.confidence}
                      </div>
                      <button className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-accent">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/approvals" className="block w-full text-center text-xs text-muted-foreground hover:text-primary mt-4">
                  View all pending approvals
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
