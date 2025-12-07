"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";

/**
 * Background service that automatically processes new emails
 * Runs every 2 minutes when user is active
 */
export function AutoEmailProcessor() {
  const queryClient = useQueryClient();
  const isProcessingRef = useRef(false);
  const lastProcessedRef = useRef<Date>(new Date());

  useEffect(() => {
    const processEmails = async () => {
      if (isProcessingRef.current) return;

      try {
        isProcessingRef.current = true;

        // Process new emails silently
        const result = await client.ai.processEmails({
          maxEmails: 20,
          autoProcess: false,
          category: "primary",
          includeProcessed: false,
        });

        // If new emails were processed, refresh the approvals list
        if (result.processed > 0) {
          console.log(`Auto-processed ${result.processed} new emails`);
          queryClient.invalidateQueries({
            queryKey: ["autopilot", "approvals"],
          });
          queryClient.invalidateQueries({
            queryKey: ["autopilot", "activity"],
          });
        }

        lastProcessedRef.current = new Date();
      } catch (error) {
        console.error("Auto-process error:", error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Run immediately on mount
    processEmails();

    // Then run every 2 minutes
    const interval = setInterval(processEmails, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return null; // This component doesn't render anything
}
