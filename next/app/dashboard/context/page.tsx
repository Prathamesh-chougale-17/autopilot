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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div>
        <h1 className="text-2xl font-bold">Business Context</h1>
        <p className="text-muted-foreground">
          Configure your business context to help AI write better, more relevant
          emails.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Acme Corp"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Software Development"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="We build innovative software solutions for enterprises..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Communication Style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
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
                <SelectTrigger>
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
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Keywords & Topics
            </CardTitle>
            <CardDescription>
              Important terms the AI should understand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <Button onClick={addKeyword} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {keywords.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No keywords added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Additional Context
            </CardTitle>
            <CardDescription>Any extra information for the AI</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any specific instructions, common scenarios, or important details the AI should know about your business..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={6}
            />
          </CardContent>
        </Card>
      </div>

      {/* Common Response Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5" />
            Common Response Templates
          </CardTitle>
          <CardDescription>
            Pre-defined responses for common email scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing responses */}
          {(context as BusinessContext | null)?.commonResponses &&
            (context as BusinessContext).commonResponses.length > 0 && (
              <div className="space-y-3">
                {(context as BusinessContext).commonResponses.map(
                  (response: CommonResponse) => (
                    <div
                      key={response.label}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{response.label}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {response.template}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeResponseMutation.mutate(response.label)
                        }
                        disabled={removeResponseMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}

          <Separator />

          {/* Add new response */}
          <div className="space-y-3">
            <h4 className="font-medium">Add New Template</h4>
            <div className="space-y-2">
              <Input
                placeholder="Label (e.g., 'Meeting Request Response')"
                value={newResponseLabel}
                onChange={(e) => setNewResponseLabel(e.target.value)}
              />
              <Textarea
                placeholder="Template text..."
                value={newResponseTemplate}
                onChange={(e) => setNewResponseTemplate(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleAddResponse}
                disabled={
                  addResponseMutation.isPending ||
                  !newResponseLabel.trim() ||
                  !newResponseTemplate.trim()
                }
              >
                {addResponseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending || !context}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete All Context
        </Button>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Context
        </Button>
      </div>
    </div>
  );
}
