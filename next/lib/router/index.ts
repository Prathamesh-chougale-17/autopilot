/**
 * Router Index - Combines all route modules
 *
 * This file imports and combines all the modular router files:
 * - admin.ts: Admin user management endpoints
 * - autopilot.ts: Autopilot toggles, tasks, activity, summary, reports
 * - gmail.ts: Gmail API integration endpoints
 * - ai.ts: AI email processing endpoints
 */

import { os } from "./helpers";

// Import route modules
import { getUsers } from "./admin";
import {
  getToggles,
  setToggles,
  createTask,
  listTasks,
  setTaskStatus,
  listActivity,
  getSummary,
  getReport,
} from "./autopilot";
import {
  gmailStatus,
  gmailList,
  gmailUnreadCount,
  gmailSend,
  gmailReply,
  gmailMarkRead,
  gmailArchive,
} from "./gmail";
import {
  aiProcessEmails,
  aiApproveReply,
  aiRejectReply,
  aiEmailAnalytics,
} from "./ai";
import {
  getContext,
  setContext,
  deleteContext,
  addCommonResponse,
  removeCommonResponse,
} from "./context";

export const router = os.router({
  admin: os.router({
    getUsers,
  }),
  autopilot: os.router({
    getToggles,
    setToggles,
    createTask,
    listTasks,
    setTaskStatus,
    listActivity,
    getSummary,
    getReport,
  }),
  gmail: os.router({
    status: gmailStatus,
    list: gmailList,
    unreadCount: gmailUnreadCount,
    send: gmailSend,
    reply: gmailReply,
    markRead: gmailMarkRead,
    archive: gmailArchive,
  }),
  ai: os.router({
    processEmails: aiProcessEmails,
    approveReply: aiApproveReply,
    rejectReply: aiRejectReply,
    emailAnalytics: aiEmailAnalytics,
  }),
  context: os.router({
    get: getContext,
    set: setContext,
    delete: deleteContext,
    addResponse: addCommonResponse,
    removeResponse: removeCommonResponse,
  }),
});
export type Router = typeof router;
