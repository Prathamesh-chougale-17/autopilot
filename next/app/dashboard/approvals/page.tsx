import { ApprovalsPanel } from "@/components/autopilot/approvals";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function ApprovalsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Approvals</h1>
      </header>
      <div className="flex-1 p-6">
        <ApprovalsPanel />
      </div>
    </>
  );
}
