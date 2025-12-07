"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Building2,
  Briefcase,
  MessageSquare,
  Tags,
  Signature,
  Plus,
  X,
  Save,
  Trash2,
  Loader2,
  Sparkles
} from "lucide-react";

type Tone = "formal" | "friendly" | "professional" | "casual";

interface CommonResponse {
  label: string;
  template: string;
}

interface BusinessContext {
  id: string;
  userId: string;
  businessName?: string;
  industry?: string;
  description?: string;
  tone: Tone;
  signatureTemplate?: string;
  commonResponses: CommonResponse[];
  keywords: string[];
  additionalContext?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ContextPage() {
  const queryClient = useQueryClient();

  // Track if form has been initialized from server data
  const [isInitialized, setIsInitialized] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [signatureTemplate, setSignatureTemplate] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Common responses state
  const [newResponseLabel, setNewResponseLabel] = useState("");
  const [newResponseTemplate, setNewResponseTemplate] = useState("");

  // Fetch existing context
  const { data: context, isLoading } = useQuery({
    queryKey: ["context"],
    queryFn: async () => {
      const data = await client.context.get({});
      // Initialize form state when data is fetched
      if (data && !isInitialized) {
        setBusinessName(data.businessName || "");
        setIndustry(data.industry || "");
        setDescription(data.description || "");
        setTone(data.tone || "professional");
        setSignatureTemplate(data.signatureTemplate || "");
        setKeywords(data.keywords || []);
        setAdditionalContext(data.additionalContext || "");
        setIsInitialized(true);
      }
      return data;
    },
  });

  // Save context mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      client.context.set({
        businessName: businessName || undefined,
        industry: industry || undefined,
        description: description || undefined,
        tone,
        signatureTemplate: signatureTemplate || undefined,
        keywords,
        additionalContext: additionalContext || undefined,
        commonResponses:
          (context as BusinessContext | null)?.commonResponses || [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context"] });
      toast.success("Business context saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Add common response mutation
  const addResponseMutation = useMutation({
    mutationFn: (data: { label: string; template: string }) =>
      client.context.addResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context"] });
      setNewResponseLabel("");
      setNewResponseTemplate("");
      toast.success("Response template added!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add: ${error.message}`);
    },
  });

  // Remove common response mutation
  const removeResponseMutation = useMutation({
    mutationFn: (label: string) => client.context.removeResponse({ label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context"] });
      toast.success("Response template removed!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove: ${error.message}`);
    },
  });

  // Delete all context
  const deleteMutation = useMutation({
    mutationFn: () => client.context.delete({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context"] });
      setBusinessName("");
      setIndustry("");
      setDescription("");
      setTone("professional");
      setSignatureTemplate("");
      setKeywords([]);
      setAdditionalContext("");
      toast.success("Business context deleted!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleAddResponse = () => {
    if (newResponseLabel.trim() && newResponseTemplate.trim()) {
      addResponseMutation.mutate({
        label: newResponseLabel.trim(),
        template: newResponseTemplate.trim(),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/50 backdrop-blur-md px-6 sticky top-0 z-10 transition-all">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 hover:bg-accent/50" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Business Context</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending || !context}
            className="shadow-sm"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Reset
          </Button>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="shadow-md hover:shadow-lg transition-shadow bg-primary text-primary-foreground"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 pt-6 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 pb-20">

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Configure Your AI Identity</h2>
            <p className="text-muted-foreground text-lg">
              The more context you provide, the better Autopilot can act on your behalf.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="glass-card border-white/10 shadow-lg transition-all hover:shadow-xl hover:border-primary/20 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Building2 className="h-5 w-5" />
                  </div>
                  Basic Information
                </CardTitle>
                <CardDescription>Tell us about your business entity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Acme Corp"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="Software Development"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    placeholder="We build innovative software solutions for enterprises..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Communication Style */}
            <Card className="glass-card border-white/10 shadow-lg transition-all hover:shadow-xl hover:border-primary/20 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  Communication Style
                </CardTitle>
                <CardDescription>
                  How should AI communicate on your behalf?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Email Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                    <SelectTrigger className="bg-background/50 border-white/10 focus:border-primary/50">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">Email Signature Template</Label>
                  <Textarea
                    id="signature"
                    placeholder="Best regards,&#10;John Doe&#10;CEO, Acme Corp&#10;john@acme.com"
                    value={signatureTemplate}
                    onChange={(e) => setSignatureTemplate(e.target.value)}
                    rows={5}
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors resize-none font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card className="glass-card border-white/10 shadow-lg transition-all hover:shadow-xl hover:border-primary/20 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <Tags className="h-5 w-5" />
                  </div>
                  Keywords & Topics
                </CardTitle>
                <CardDescription>
                  Important terms the AI should understand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                    className="bg-background/50 border-white/10 focus:border-primary/50"
                  />
                  <Button onClick={addKeyword} size="icon" variant="outline" className="border-white/10 hover:bg-white/5">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[100px] content-start p-4 rounded-lg border border-white/5 bg-black/5">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="flex items-center gap-1 pl-3 pr-2 py-1.5 text-sm bg-background/50 hover:bg-background/80 transition-colors border border-white/10"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 p-0.5 hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {keywords.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm italic">
                      No keywords added yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Context */}
            <Card className="glass-card border-white/10 shadow-lg transition-all hover:shadow-xl hover:border-primary/20 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  Additional Context
                </CardTitle>
                <CardDescription>Any extra information for the AI.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any specific instructions, common scenarios, or important details the AI should know about your business..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={8}
                  className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Common Response Templates */}
          <Card className="glass-card border-white/10 shadow-lg transition-all hover:shadow-xl hover:border-primary/20 bg-card/40 backdrop-blur-sm col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                  <Signature className="h-5 w-5" />
                </div>
                Common Response Templates
              </CardTitle>
              <CardDescription>
                Pre-defined responses for common email scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing responses */}
              {(context as BusinessContext | null)?.commonResponses &&
                (context as BusinessContext).commonResponses.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {(context as BusinessContext).commonResponses.map(
                      (response: CommonResponse) => (
                        <div
                          key={response.label}
                          className="group flex flex-col justify-between p-4 border border-white/10 rounded-xl bg-background/30 hover:bg-background/50 transition-colors relative"
                        >
                          <div className="space-y-2 mb-4">
                            <h4 className="font-semibold text-lg text-primary">{response.label}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3 italic p-3 bg-black/5 rounded-md border border-white/5">
                              "{response.template}"
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeResponseMutation.mutate(response.label)
                              }
                              disabled={removeResponseMutation.isPending}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

              <Separator className="bg-white/10" />

              {/* Add new response */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Add New Template</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Template Label</Label>
                    <Input
                      placeholder="e.g., 'Meeting Request Response'"
                      value={newResponseLabel}
                      onChange={(e) => setNewResponseLabel(e.target.value)}
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Response Body</Label>
                    <Textarea
                      placeholder="Template text..."
                      value={newResponseTemplate}
                      onChange={(e) => setNewResponseTemplate(e.target.value)}
                      rows={4}
                      className="bg-background/50 border-white/10 font-mono text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddResponse}
                  disabled={
                    addResponseMutation.isPending ||
                    !newResponseLabel.trim() ||
                    !newResponseTemplate.trim()
                  }
                  className="w-full md:w-auto"
                >
                  {addResponseMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
