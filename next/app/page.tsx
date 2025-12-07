import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Mail,
  FileText,
  Users,
  BrainCircuit,
  Workflow,
  Sparkles,
  Globe,
  Cpu
} from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 lg:pt-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

          {/* Animated Blobs */}
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none mix-blend-screen animate-pulse duration-[5000ms]"></div>
          <div className="absolute top-20 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full opacity-30 pointer-events-none mix-blend-screen animate-pulse duration-[7000ms]"></div>

          <div className="container mx-auto px-4 sm:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]"></span>
              The AI COO for your business
            </div>

            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl md:text-9xl mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 leading-[1.1]">
              Your Business, <br />
              <span className="text-primary bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary text-transparent animate-gradient-x">Running on Autopilot.</span>
            </h1>

            <p className="mx-auto max-w-3xl text-xl md:text-2xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-relaxed font-light">
              Singularity watches how you work, learns your patterns, and quietly takes over the busywork.
              From email replies to invoicing, let our agent mesh handle the operations while you focus on growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link
                href="/dashboard"
                className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-2xl shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-primary/40 ring-offset-2 focus-visible:ring-2"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative flex items-center gap-2">
                  Deploy Your AI Workforce
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              <Link
                href="#demo"
                className="inline-flex h-14 items-center justify-center rounded-full border border-input bg-background/50 backdrop-blur-md px-8 text-base font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/20"
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </section>

        {/* How it Works - Premium Redesign */}
        <section id="how-it-works" className="py-32 relative bg-accent/5 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-8">
            <div className="text-center mb-24">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
                From Observation to Automation
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-xl font-light">
                Unlike rigid bots, Singularity learns by watching you. It's a seamless transition from manual work to full autonomy.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 relative items-stretch">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0"></div>

              {[
                {
                  step: "01",
                  title: "Observe",
                  description: "Singularity plugs into your tools (Gmail, WhatsApp, CRM) and quietly observes how you handle tasks.",
                  icon: Users,
                  color: "bg-blue-500/10 text-blue-500"
                },
                {
                  step: "02",
                  title: "Learn",
                  description: "It identifies patterns in your workflow—how you reply to leads, when you send invoices, and how you approve requests.",
                  icon: BrainCircuit,
                  color: "bg-purple-500/10 text-purple-500"
                },
                {
                  step: "03",
                  title: "Automate",
                  description: "Once confident, it starts performing tasks. You stay in the loop with a simple approval system until you trust it completely.",
                  icon: Workflow,
                  color: "bg-green-500/10 text-green-500"
                },
              ].map((item, i) => (
                <div key={i} className="group relative z-10 flex flex-col items-center text-center p-6 rounded-3xl transition-all hover:bg-background/50 hover:shadow-xl hover:-translate-y-2 border border-transparent hover:border-white/10">
                  <div className={`mb-8 flex h-28 w-28 items-center justify-center rounded-3xl ${item.color} backdrop-blur-xl border border-white/10 shadow-lg ring-8 ring-background group-hover:scale-110 transition-transform duration-500`}>
                    <item.icon className="h-12 w-12" />
                  </div>
                  <div className="text-sm font-bold text-muted-foreground/50 mb-3 tracking-[0.2em] uppercase">Step {item.step}</div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agents Grid - Glassmorphism */}
        <section id="agents" className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-purple-500/5 -z-10"></div>

          {/* Background Mesh */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent blur-3xl -z-10"></div>

          <div className="container mx-auto px-4 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                  Meet Your New <br />
                  <span className="text-primary bg-clip-text bg-gradient-to-r from-primary to-purple-600 text-transparent">Agent Workforce</span>
                </h2>
                <p className="text-xl text-muted-foreground font-light">
                  Specialized agents working together in a mesh network to handle every aspect of your operations.
                </p>
              </div>
              <Link href="/dashboard" className="text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-2 group">
                View all agents <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: "Communication Agent",
                  desc: "Drafts replies to emails and WhatsApp messages based on your tone and historical context.",
                  tags: ["Gmail", "WhatsApp", "Slack"],
                  gradient: "from-blue-500/20 to-cyan-500/20"
                },
                {
                  icon: FileText,
                  title: "Finance Agent",
                  desc: "Generates invoices, chases payments, and categorizes expenses automatically.",
                  tags: ["QuickBooks", "Xero", "Banks"],
                  gradient: "from-green-500/20 to-emerald-500/20"
                },
                {
                  icon: Users,
                  title: "CRM Agent",
                  desc: "Updates customer records, logs interactions, and schedules follow-ups without data entry.",
                  tags: ["Salesforce", "HubSpot", "Zoho"],
                  gradient: "from-orange-500/20 to-red-500/20"
                },
                {
                  icon: BarChart3,
                  title: "Reporting Agent",
                  desc: "Compiles weekly sales, stock, and performance reports from multiple data sources.",
                  tags: ["Excel", "Sheets", "Analytics"],
                  gradient: "from-purple-500/20 to-pink-500/20"
                },
                {
                  icon: Shield,
                  title: "Policy Agent",
                  desc: "Ensures all automated actions comply with company rules and flags anomalies for review.",
                  tags: ["Compliance", "Security"],
                  gradient: "from-slate-500/20 to-gray-500/20"
                },
                {
                  icon: Zap,
                  title: "Orchestrator",
                  desc: "The brain that coordinates other agents, manages context, and handles complex multi-step tasks.",
                  tags: ["Core", "Planning"],
                  gradient: "from-yellow-500/20 to-amber-500/20"
                }
              ].map((agent, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:bg-white/10 hover:border-primary/20"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="h-6 w-6 text-foreground -rotate-45" />
                  </div>

                  <div className="relative z-10">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-primary group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <agent.icon className="h-8 w-8" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold tracking-tight">{agent.title}</h3>
                    <p className="text-muted-foreground mb-8 leading-relaxed h-20">
                      {agent.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold transition-colors text-foreground/70 group-hover:text-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations Marquee - Cleaner */}
        <section id="integrations" className="py-24 border-y border-white/5 bg-black/20 overflow-hidden relative">
          <div className="container mx-auto px-4 sm:px-8 text-center mb-12">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">
              Seamlessly integrates with your stack
            </p>
          </div>

          <div className="relative flex overflow-x-hidden group">
            <div className="animate-marquee whitespace-nowrap flex gap-16 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
              {/* Looped Content */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-16 items-center">
                  <span className="text-3xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" /> Gmail</span>
                  <span className="text-3xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> WhatsApp</span>
                  <span className="text-3xl font-bold flex items-center gap-2"><Globe className="h-6 w-6" /> Slack</span>
                  <span className="text-3xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Excel</span>
                  <span className="text-3xl font-bold flex items-center gap-2"><Cpu className="h-6 w-6" /> Notion</span>
                  <span className="text-3xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> HubSpot</span>
                  <span className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Zoho</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Premium Dark */}
        <section className="py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-primary/5 -z-10"></div>
          {/* Glowing Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full"></div>

          <div className="container mx-auto px-4 sm:px-8 text-center relative z-10">
            <div className="inline-flex items-center justify-center p-3 mb-8 rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 mr-2" />
              <span className="font-semibold">Join the Waitlist</span>
            </div>

            <h2 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl mb-8 leading-tight">
              Ready to hire your <span className="text-primary">AI COO?</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground mb-12 font-light">
              Join the future of work. Stop doing the grunt work and start leading your business.
              Limited spots available for the beta program.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/dashboard"
                className="inline-flex h-16 items-center justify-center rounded-full bg-primary px-10 text-lg font-bold text-primary-foreground shadow-2xl shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-primary/50"
              >
                Get Started for Free
              </Link>
              <Link
                href="#contact"
                className="inline-flex h-16 items-center justify-center rounded-full border border-input bg-background/50 px-10 text-lg font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground backdrop-blur-sm"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Minimalist */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-xl py-20">
        <div className="container mx-auto px-4 sm:px-8 grid gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2 pr-8">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Bot className="h-6 w-6" />
              </div>
              <span>Singularity</span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed text-lg font-light">
              The intelligent agent mesh that observes, learns, and automates your business operations.
              Built for the future of autonomous enterprise.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-8 text-lg">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Agents</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Integrations</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Security</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 text-lg">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-200">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-8 mt-20 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Singularity Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
