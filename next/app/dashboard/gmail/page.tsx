import { GmailInbox } from "@/components/gmail/inbox";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function GmailPage() {
  return (
    <div className="flex flex-col h-full bg-background/50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur-md px-6 sticky top-0 z-10 transition-all">
        <SidebarTrigger className="-ml-1 hover:bg-accent/50" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Gmail</h1>
      </header>
      <div className="flex-1 p-6 md:p-8 pt-6 overflow-hidden">
        <div className="mx-auto max-w-7xl h-full animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <GmailInbox />
        </div>
      </div>
    </div>
  );
}
