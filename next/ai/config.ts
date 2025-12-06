import { google } from "@ai-sdk/google";
export const aiModel = google("gemini-2.5-flash");
export const aiConfig = {
  model: aiModel,
  temperature: 0.7,
  maxTokens: 8192,
};
