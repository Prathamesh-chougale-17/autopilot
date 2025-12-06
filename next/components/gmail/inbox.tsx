"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MailOpen,
  Send,
  Reply,
  Archive,
  RefreshCw,
  AlertCircle,
  Inbox,
  Bot,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: Date;
  isUnread: boolean;
  labels: string[];
}

export function GmailInbox() {
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
  });

  // Check Gmail connection status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["gmail", "status"],
    queryFn: () => client.gmail.status({}),
  });

  // Get user settings for category preference
  const { data: settings } = useQuery({
    queryKey: ["autopilot", "toggles"],
    queryFn: () => client.autopilot.getToggles({}),
  });

  // Get emails
  const {
    data: emailsData,
    isLoading: emailsLoading,
    refetch: refetchEmails,
  } = useQuery({
    queryKey: ["gmail", "list"],
    // Include processed emails here so deleted activity/tasks don't hide messages
    // (safe UI-only change — processing still respects labels unless overridden)
    queryFn: () =>
      client.gmail.list({ maxResults: 20, includeProcessed: true }),
    enabled: status?.connected === true,
  });

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ["gmail", "unread"],
    queryFn: () => client.gmail.unreadCount({}),
    enabled: status?.connected === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (messageId: string) => client.gmail.markRead({ messageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail"] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (messageId: string) => client.gmail.archive({ messageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail"] });
      setSelectedEmail(null);
      toast.success("Email archived");
    },
  });

  // AI Process emails mutation
  const aiProcessMutation = useMutation({
    mutationFn: (data: {
      maxEmails: number;
      autoProcess: boolean;
      category?: "all" | "primary" | "updates";
    }) => client.ai.processEmails(data),
    onSuccess: (result) => {
      toast.success(
        `Processed ${result.processed} emails. ${result.tasks.length} tasks created, ${result.autoReplied} auto-replied.`
      );
      queryClient.invalidateQueries({ queryKey: ["gmail"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot"] });
    },
    onError: (error) => {
      toast.error(`AI processing failed: ${error.message}`);
    },
  });

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: (data: { to: string; subject: string; body: string }) =>
      client.gmail.send({ ...data, isHtml: false }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Email sent successfully");
        setComposeOpen(false);
        setComposeData({ to: "", subject: "", body: "" });
        queryClient.invalidateQueries({ queryKey: ["gmail"] });
      } else {
        toast.error(result.error || "Failed to send email");
      }
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (data: {
      emailId: string;
      threadId: string;
      originalFrom: string;
      originalSubject: string;
      body: string;
    }) => client.gmail.reply({ ...data, isHtml: false }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Reply sent successfully");
        setReplyOpen(false);
        setReplyBody("");
        queryClient.invalidateQueries({ queryKey: ["gmail"] });
      } else {
        toast.error(result.error || "Failed to send reply");
      }
    },
  });

  // Handle email click
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (email.isUnread) {
      markReadMutation.mutate(email.id);
    }
  };

  // Handle reply
  const handleReply = () => {
    if (!selectedEmail || !replyBody.trim()) return;
    replyMutation.mutate({
      emailId: selectedEmail.id,
      threadId: selectedEmail.threadId,
      originalFrom: selectedEmail.from,
      originalSubject: selectedEmail.subject,
      body: replyBody,
    });
  };

  // Handle compose send
  const handleComposeSend = () => {
    if (!composeData.to || !composeData.subject || !composeData.body) return;
    sendMutation.mutate(composeData);
  };

  // Loading state
  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  if (!status?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail
          </CardTitle>
          <CardDescription>Connect your Gmail account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {status?.error || "Gmail is not connected"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in with Google to connect your Gmail account
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const emails = emailsData?.emails || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Gmail Inbox
                {unreadData && unreadData.count > 0 && (
                  <Badge variant="destructive">{unreadData.count}</Badge>
                )}
              </CardTitle>
              <CardDescription>Connected as {status.email}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  aiProcessMutation.mutate({
                    maxEmails: 10,
                    autoProcess: settings?.autoProcess ?? true,
                    category: settings?.gmailCategory ?? "primary",
                  })
                }
                disabled={aiProcessMutation.isPending}
              >
                {aiProcessMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-1" />
                    AI Process ({settings?.gmailCategory ?? "primary"})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchEmails()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setComposeOpen(true)}>
                <Send className="h-4 w-4 mr-1" />
                Compose
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {emailsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No emails found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {emails.map((email: Email) => (
                  <div
                    key={email.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      email.isUnread
                        ? "bg-primary/5 hover:bg-primary/10 font-medium"
                        : "hover:bg-muted/50"
                    } ${selectedEmail?.id === email.id ? "bg-muted" : ""}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {email.isUnread ? (
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate text-sm">
                          {email.from.replace(/<.*>/, "").trim()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(email.date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate mt-1">
                      {email.subject || "(No subject)"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {email.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog
        open={!!selectedEmail}
        onOpenChange={(open) => !open && setSelectedEmail(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedEmail?.subject || "(No subject)"}
            </DialogTitle>
            <DialogDescription>
              From: {selectedEmail?.from}
              <br />
              Date:{" "}
              {selectedEmail?.date &&
                new Date(selectedEmail.date).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {selectedEmail?.body || selectedEmail?.snippet}
              </pre>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedEmail) archiveMutation.mutate(selectedEmail.id);
              }}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
            <Button onClick={() => setReplyOpen(true)}>
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Email</DialogTitle>
            <DialogDescription>
              Replying to: {selectedEmail?.from}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={
                  selectedEmail?.subject.startsWith("Re:")
                    ? selectedEmail.subject
                    : `Re: ${selectedEmail?.subject || ""}`
                }
                disabled
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type your reply..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyBody.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>Send a new email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Input
                type="email"
                value={composeData.to}
                onChange={(e) =>
                  setComposeData({ ...composeData, to: e.target.value })
                }
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={composeData.subject}
                onChange={(e) =>
                  setComposeData({ ...composeData, subject: e.target.value })
                }
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={composeData.body}
                onChange={(e) =>
                  setComposeData({ ...composeData, body: e.target.value })
                }
                placeholder="Type your message..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleComposeSend}
              disabled={
                !composeData.to ||
                !composeData.subject ||
                !composeData.body ||
                sendMutation.isPending
              }
            >
              {sendMutation.isPending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
