# Autopilot - AI COO for Business Automation

> **Your AI Chief Operating Officer that learns, adapts, and automates all repetitive digital work**

Autopilot is a multi-agent system that observes how your business operates, then seamlessly takes over repetitive digital tasks—email replies, invoicing, follow-ups, WhatsApp messages, reports, basic HR, simple approvals, and more. Think of it as an AI COO that integrates with the tools you already use (WhatsApp, Gmail, Excel/Sheets, Tally/Zoho, CRM) and quietly handles the grunt work.

---

## 🎯 What It Does

Autopilot watches your business workflows and learns patterns, then autonomously executes:

- **📧 Email Management**: Auto-replies, follow-ups, and intelligent email routing
- **💬 WhatsApp Automation**: Message handling, customer responses, and notifications
- **💰 Invoicing & Billing**: Automated invoice generation, payment tracking, and reminders
- **📊 Reporting**: Daily/weekly summaries, performance metrics, and data compilation
- **👥 Basic HR**: Leave approvals, attendance tracking, and routine HR tasks
- **✅ Simple Approvals**: Policy-based decision making with escalation paths
- **🔄 Data Sync**: CRM updates, spreadsheet management, and cross-platform synchronization
- **📈 Lead Management**: Automated follow-ups, lead scoring, and pipeline updates

---

## 🏗️ Architecture

### Multi-Agent System

Autopilot uses specialized AI agents that work together:

- **Email Agent**: Monitors Gmail/IMAP, drafts responses, schedules follow-ups
- **WhatsApp Agent**: Handles customer queries via WhatsApp Business API
- **Billing Agent**: Generates invoices, tracks payments, sends reminders
- **CRM Agent**: Updates leads, logs activities, manages pipelines
- **Reporting Agent**: Compiles daily/weekly reports, generates insights
- **Approval Agent**: Reviews requests against policies, escalates when needed
- **Learning Agent**: Observes patterns, adapts to your business style

### Integration Layer

Plugs into your existing tools:

- **Communication**: Gmail, WhatsApp Business API, IMAP/SMTP
- **Finance**: Tally, Zoho Books, Excel/Google Sheets
- **CRM**: Custom CRMs, Google Sheets, Zoho CRM
- **Calendar**: Google Calendar, Outlook
- **Payments**: Payment gateway webhooks, bank feeds

---

## 🚀 Key Features

### 🤖 Observational Learning
- Watches how you handle tasks
- Learns your communication style
- Adapts to business-specific workflows
- Improves accuracy over time

### 🎛️ Granular Control
- Per-channel automation toggles
- Confidence threshold settings
- Manual review queues
- Emergency pause switches

### 🔍 Full Transparency
- Complete activity log of all actions
- Audit trail with timestamps
- Filter by agent, task type, or date
- Export capabilities for compliance

### ✅ Smart Approvals
- Policy-based auto-approvals
- Escalation paths for edge cases
- Reviewer dashboard
- Approval history and analytics

### 📊 Intelligent Reporting
- Automated daily/weekly summaries
- Task completion metrics
- Pending work notifications
- Custom report scheduling

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (30+ components)
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React, React Icons

### Backend
- **API**: oRPC (type-safe RPC framework)
- **Authentication**: Better Auth (email/password + Google OAuth)
- **Database**: MongoDB Atlas
- **Email**: Nodemailer with custom templates
- **AI**: Google AI SDK (Gemini)

### Infrastructure
- **Type Safety**: TypeScript 5 (strict mode)
- **API Documentation**: OpenAPI + Scalar
- **Environment**: T3 Env (validated env variables)
- **Session Management**: HTTP-only cookies

---

## 📦 Installation

### Prerequisites
- Node.js 18+ or Bun
- MongoDB Atlas account
- Google Cloud project (for OAuth + Gmail API)
- WhatsApp Business API access (optional)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd next
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Auth
   BETTER_AUTH_SECRET=your-secret-key-here
   BETTER_AUTH_URL=http://localhost:3000
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
   MONGODB_DB_NAME=autopilot
   
   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Environment
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage

### Getting Started

1. **Sign Up / Sign In**
   - Create an account with email/password or Google OAuth
   - Verify your email (OTP sent automatically)

2. **Access Dashboard**
   - Navigate to `/dashboard` after authentication
   - View your personalized control center

3. **Configure Integrations**
   - Go to Settings → Integrations
   - Connect Gmail, WhatsApp, CRM, etc.
   - Set up API keys and webhooks

4. **Enable Agents**
   - Toggle automation channels (email, WhatsApp, invoicing)
   - Set confidence thresholds for auto-actions
   - Configure approval policies

5. **Monitor Activity**
   - Check the Activity Log for all agent actions
   - Review pending approvals in the Approval Queue
   - View daily/weekly reports

### Admin Features

Admins have access to:
- **User Management**: View, ban, unban, delete users
- **Role Assignment**: Promote users to admin
- **System Settings**: Global automation toggles
- **Audit Logs**: Complete system activity history

Access admin panel at `/admin` (admin role required)

---

## 🗂️ Project Structure

```
next/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages
│   │   ├── sign-in/              # Sign-in page
│   │   ├── sign-up/              # Sign-up page
│   │   └── sign-in-otp/          # OTP verification
│   ├── dashboard/                # User dashboard
│   │   ├── activity/             # Activity log
│   │   ├── approvals/            # Approval queue
│   │   ├── context/              # Business context
│   │   ├── gmail/                # Gmail integration
│   │   ├── reports/              # Reports & analytics
│   │   └── settings/             # User settings
│   ├── admin/                    # Admin panel
│   ├── api/                      # API routes
│   │   ├── auth/                 # Better Auth endpoints
│   │   └── openapi/              # API documentation
│   └── rpc/                      # oRPC handlers
├── components/                   # React components
│   ├── admin/                    # Admin components
│   ├── auth/                     # Auth components
│   ├── dashboard/                # Dashboard components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities & configs
│   ├── auth.ts                   # Better Auth config
│   ├── auth-client.ts            # Client auth utilities
│   ├── mongodb.ts                # MongoDB connection
│   ├── router.ts                 # oRPC router
│   ├── orpc.ts                   # oRPC client
│   └── email/                    # Email templates & mailer
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
├── .env                          # Environment variables
├── env.ts                        # Env validation (T3)
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

---

## 🔐 Security

- **Authentication**: Secure email/password + OAuth 2.0
- **Session Management**: HTTP-only cookies, secure flags
- **Role-Based Access**: User/Admin roles with middleware protection
- **Input Validation**: Zod schemas for all inputs
- **Environment Variables**: Type-safe, validated at runtime
- **Rate Limiting**: Built-in protection against abuse
- **Audit Logging**: Complete trail of all system actions

---

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, premium aesthetic with dark mode support
- **Responsive**: Mobile-first design, works on all devices
- **Accessible**: WCAG compliant, keyboard navigation
- **Fast**: Optimized performance, instant page transitions
- **Intuitive**: Clear navigation, contextual help
- **Customizable**: Theme toggle, personalized dashboards

---

## 🧩 API Documentation

Interactive API documentation available at:
- **Scalar UI**: [http://localhost:3000/api](http://localhost:3000/api)
- **OpenAPI Spec**: Auto-generated from oRPC router

### Key Endpoints

```typescript
// Get all users (admin only)
GET /rpc/admin.users

// Hello world test
GET /rpc/hello

// Better Auth endpoints
POST /api/auth/sign-in
POST /api/auth/sign-up
POST /api/auth/sign-out
GET  /api/auth/session
```

---

## 🗺️ Roadmap

### ✅ Implemented
- Core authentication system (email/password + Google OAuth)
- User dashboard with session management
- Admin panel with user management
- Email templates and mailer service
- MongoDB integration
- oRPC API infrastructure
- OpenAPI documentation
- Protected routes and middleware
- Complete UI component library

### 🚧 In Progress
- Gmail integration and email automation
- Activity log with filtering
- Approval queue and workflow
- Business context learning
- Settings and toggles UI

### 📋 Planned
- WhatsApp Business API integration
- Automated invoicing and billing
- CRM connectors (Zoho, Sheets)
- Reporting engine (daily/weekly summaries)
- Learning agent with pattern recognition
- Policy-based approval automation
- Calendar integration
- Payment gateway webhooks
- Advanced analytics dashboard
- Mobile app (React Native)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use existing UI components from shadcn/ui
- Write type-safe API endpoints with oRPC
- Add proper error handling
- Update documentation for new features

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For questions, issues, or feature requests:
- **Email**: support@autopilot.ai (placeholder)
- **Issues**: GitHub Issues tab
- **Documentation**: See `/docs` folder (coming soon)

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Better Auth](https://better-auth.com/) - Authentication
- [oRPC](https://orpc.dev/) - Type-safe RPC
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [MongoDB](https://www.mongodb.com/) - Database
- [Google AI](https://ai.google.dev/) - AI capabilities

---

**Autopilot** - Let AI handle the repetitive work, so you can focus on growing your business. 🚀
