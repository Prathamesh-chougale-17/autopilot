# AI AutoPilot – Brief Task List

Keep this short to unblock delivery. Scope is to document the current state and identify missing AutoPilot pieces.

## Status Checklist

- [x] Create `tasks/` folder and brief doc
- [x] Update `init.md` with current state and gap list
- [x] Define schemas/collections (`agent_tasks`, `activity_log`, `settings/toggles`, `crm/leads`, `invoices`)
- [x] Add RPC endpoints for toggles, tasks, activity, summary, approvals/status updates
- [x] Add UI for toggles, approval queue, and activity log (dashboard)
- [x] Plan and stub connectors (Gmail/WhatsApp/Sheets/CRM) + webhooks
- [x] Implement reporting (daily/weekly/monthly) and summaries
- [x] Ship activity log and audit trail

## Completed Implementation

### Connectors (lib/connectors/ + app/api/connectors/)

1. **Types** (`lib/connectors/types.ts`)

   - Gmail push notification schema
   - WhatsApp Cloud API webhook schema
   - Generic connector event schema
   - Task classification schema

2. **Utilities** (`lib/connectors/utils.ts`)

   - `logConnectorActivity()` - audit logging
   - `createTaskFromConnector()` - task creation with activity tracking
   - `findUserByEmail()` - user lookup for connector matching
   - `getUserToggles()` - check autopilot settings
   - `classifyTaskBasic()` - rule-based task classification (AI enhancement pending)
   - `verifyGmailWebhook()` - signature validation
   - `verifyWhatsAppWebhook()` - HMAC signature validation

3. **Gmail Webhook** (`app/api/connectors/gmail/route.ts`)

   - POST: Handle Pub/Sub push notifications
   - GET: Verification challenge response
   - Auto-creates tasks when autoReply enabled

4. **WhatsApp Webhook** (`app/api/connectors/whatsapp/route.ts`)
   - POST: Handle incoming messages and status updates
   - GET: Meta webhook verification
   - Auto-creates CRM contacts from conversations

### Reporting (lib/router.ts + components/autopilot/)

1. **RPC Endpoints**

   - `getSummary` - Quick stats (daily/weekly window)
   - `getReport` - Detailed analytics with breakdowns

2. **Report Data**

   - Summary counts (tasks, leads, invoices, payments)
   - Tasks by agent breakdown
   - Tasks by status breakdown
   - Connector stats (emails, messages, auto-replies)
   - Recent activity feed

3. **UI Component** (`components/autopilot/reports-dashboard.tsx`)
   - Tab-based window selector (daily/weekly/monthly)
   - Summary cards with trend indicators
   - Connector activity stats
   - Task breakdown charts
   - Recent activity list

### Environment Variables Added

```env
GMAIL_WEBHOOK_SECRET=     # Optional: For production Gmail verification
WHATSAPP_VERIFY_TOKEN=    # Required for WhatsApp webhook verification
WHATSAPP_ACCESS_TOKEN=    # For sending WhatsApp messages
WHATSAPP_PHONE_NUMBER_ID= # Your WhatsApp Business phone ID
```

## Next Steps (Future)

- [ ] Wire AI (Gemini) for intelligent task classification instead of rule-based
- [ ] Implement actual email sending via Gmail API
- [ ] Implement WhatsApp message sending via Cloud API
- [ ] Add Google Sheets connector for data sync
- [ ] Add CRM connector (HubSpot/Pipedrive/custom)
- [ ] Scheduled report generation (cron/edge functions)
- [ ] Email report delivery to users
- [ ] Learning agent to improve classification over time

## Notes

- ✅ Connectors: Gmail and WhatsApp webhook handlers implemented
- ✅ Activity log: Full audit trail with connector events
- ✅ Approval flow: Task status management with approve/reject
- ✅ Reporting: Daily/weekly/monthly reports with UI
- Pending: AI classification, outbound message sending, scheduled reports
