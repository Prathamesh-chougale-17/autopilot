import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Mail, CheckSquare, Activity, BarChart3, Bot } from "lucide-react";
import Link from "next/link";

const quickLinks = [
  {
    title: "Gmail",
    description: "View and manage your emails",
    icon: Mail,
    href: "/dashboard/gmail",
    color: "text-blue-500",
  },
  {
    title: "Approvals",
    description: "Review pending AI actions",
    icon: CheckSquare,
    href: "/dashboard/approvals",
    color: "text-green-500",
  },
  {
    title: "Activity",
    description: "View recent activity logs",
    icon: Activity,
    href: "/dashboard/activity",
    color: "text-yellow-500",
  },
  {
    title: "Reports",
    description: "Analytics and insights",
    icon: BarChart3,
    href: "/dashboard/reports",
    color: "text-purple-500",
  },
  {
    title: "Settings",
    description: "Configure autopilot toggles",
    icon: Bot,
    href: "/dashboard/settings",
    color: "text-orange-500",
  },
];

export default async function DashboardPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to AI AutoPilot
          </h2>
          <p className="text-muted-foreground">
            Your intelligent business automation assistant
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-2 rounded-lg bg-muted ${link.color}`}>
                    <link.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
