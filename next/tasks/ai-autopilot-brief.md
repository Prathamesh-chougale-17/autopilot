# AI AutoPilot – Brief Task List

Keep this short to unblock delivery. Scope is to document the current state and identify missing AutoPilot pieces.

## Status Checklist

- [x] Create `tasks/` folder and brief doc
- [x] Update `init.md` with current state and gap list
- [ ] Define schemas/collections (`agent_tasks`, `activity_log`, `settings/toggles`, `crm/leads`, `invoices`)
- [ ] Add RPC endpoints for agents and approvals
- [ ] Add UI for toggles, approval queue, and activity log (dashboard/admin)
- [ ] Plan and stub connectors (Gmail/WhatsApp/Sheets/CRM) + webhooks
- [ ] Implement reporting (daily/weekly) and summaries
- [ ] Ship activity log and audit trail

## Immediate

- Update `init.md` to reflect the current codebase (auth, dashboard/admin, email templates, oRPC/OpenAPI, MongoDB, shadcn UI) and remove any game references.
- Add a clear “Not yet implemented” list: agents (email/WhatsApp/billing/CRM/data-entry/reporting/learning/policy), connectors, activity log, approvals/autopilot toggles, CRM/invoice data models.
- Decide whether to include a small “Next priorities” checklist inside `init.md`.

## Next (after doc update)

- Define minimal agent schemas (input/output, confidence, autopilot flag, approval policy) and storage collections (`agent_tasks`, `activity_log`, `settings/toggles`).
- Sketch RPC procedures for each agent and an approval queue API.
- Draft UI sections for: toggles (auto-reply/invoice/follow-up/reporting), approval queue, activity log, and daily/weekly report surfacing.

## Notes

- Current gaps: no connectors (Gmail/WhatsApp/CRM), no billing/CRM logic, no activity log, no approval flow, only user collection in Mongo.
- Existing foundations: Better Auth + OTP + Google OAuth, admin/user roles, dashboard/admin pages, oRPC router with hello + admin/users, email templates + mailer, shadcn UI kit, Tailwind 4, Mongo client.
