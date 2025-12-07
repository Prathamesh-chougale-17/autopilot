import Link from "next/link";
import Image from "next/image";
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
  Cpu,
  Layers,
  Network
} from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-purple-500/30 selection:text-purple-200">
      <Navbar />

      <main className="flex-1">
        {/* Dynamic Background with Hero Image Overlay */}
        <div className="fixed inset-0 z-[-1]">
          <Image
            src="/autopilot-hero.png"
            alt="Autopilot Background"
            fill
            className="object-cover opacity-20 mix-blend-screen"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-purple-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:bg-white/10 transition-colors cursor-default">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              <span className="tracking-wide">AI-Powered Business Autonomy</span>
            </div>

            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl md:text-9xl mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 drop-shadow-2xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60">
                Your Business,
              </span>
              <br />
              <div className="relative inline-block mt-2">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-gradient-x font-black">
                  On Autopilot.
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 blur-2xl opacity-30 -z-10 animate-gradient-x"></div>
              </div>
            </h1>

            <p className="mx-auto max-w-3xl text-xl md:text-2xl text-gray-400 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-relaxed font-light">
              Autopilot isn't just a tool; it's an intelligent <span className="text-white font-medium">agent mesh</span> that observes your workflow, learns your patterns, and quietly takes over operations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link
                href="/dashboard"
                className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-white px-10 text-lg font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-white to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x"></div>
                <span className="relative flex items-center gap-2">
                  Deploy Intelligence
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              <Link
                href="#demo"
                className="group inline-flex h-16 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-10 text-lg font-medium text-white shadow-sm transition-all hover:bg-white/10 hover:border-white/40"
              >
                <span className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover:scale-110 transition-transform">
                    <div className="h-0 w-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5"></div>
                  </div>
                  Watch Demo
                </span>
              </Link>
            </div>
          </div>

          {/* Futuristic Grid Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-[linear-gradient(to_bottom,transparent,black)] z-10"></div>
          <div className="absolute bottom-0 left-[-50%] right-[-50%] h-[500px] border-t border-purple-500/20 [mask-image:linear-gradient(to_bottom,black,transparent)] [transform:perspective(500px)_rotateX(60deg)] bg-[linear-gradient(to_right,rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        </section>

        {/* Feature Showcase - The "Brain" */}
        <section id="how-it-works" className="py-32 relative">
          <div className="container mx-auto px-4 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 text-purple-400 font-mono text-sm tracking-widest uppercase mb-2">
                  <Workflow className="h-4 w-4" />
                  <span>Neural Architecture</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  From Passive Observation <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">To Active Execution</span>
                </h2>
                <p className="text-xl text-gray-400 font-light leading-relaxed">
                  Autopilot doesn't need rigid rules. It connects to your Gmail, Slack, and CRM, silently building a model of your business logic.
                </p>

                <div className="space-y-6 mt-8">
                  {[
                    { title: "Observe", desc: "Ingests thousands of interactions to understand context.", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { title: "Learn", desc: "Identifies patterns, tone, and decision-making criteria.", icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10" },
                    { title: "Automate", desc: "Executes complex workflows with human-level nuance.", icon: Zap, color: "text-pink-400", bg: "bg-pink-500/10" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
                      <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color} ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">{item.title}</h3>
                        <p className="text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group perspective-1000">
                {/* Abstract Representation of the "Brain" - using Generated Image */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl rounded-full"></div>
                <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:rotate-y-2 group-hover:scale-[1.02]">
                  <Image
                    src="/autopilot-mesh.png"
                    alt="Autopilot Agent Mesh"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover opacity-80 mix-blend-lighten"
                  />

                  {/* Overlay UI */}
                  <div className="absolute top-0 right-0 p-6 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-green-400 tracking-wider">SYSTEM ACTIVE</span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                      <span>Latency: 45ms</span>
                      <span>Active Agents: 12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agents Grid - Glassmorphism Reimagined */}
        <section id="agents" className="py-32 relative bg-black/40">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

          <div className="container mx-auto px-4 sm:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                Your Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">C-Suite</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                Specialized autonomous agents that work in concert to handle every vertical of your operations.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: "Communication",
                  desc: "Handles email & chat with your unique voice.",
                  tags: ["Gmail", "Slack"],
                  gradient: "from-blue-500/20 to-cyan-500/20",
                  text: "text-blue-400"
                },
                {
                  icon: FileText,
                  title: "Finance",
                  desc: "Manages invoices, expenses, and payroll.",
                  tags: ["Xero", "Stripe"],
                  gradient: "from-green-500/20 to-emerald-500/20",
                  text: "text-green-400"
                },
                {
                  icon: Users,
                  title: "CRM Manager",
                  desc: "Updates deal flows and customer records.",
                  tags: ["Salesforce", "HubSpot"],
                  gradient: "from-orange-500/20 to-red-500/20",
                  text: "text-orange-400"
                },
                {
                  icon: BarChart3,
                  title: "Analyst",
                  desc: "Aggregates data into actionable insights.",
                  tags: ["Tableau", "Excel"],
                  gradient: "from-purple-500/20 to-pink-500/20",
                  text: "text-purple-400"
                },
                {
                  icon: Shield,
                  title: "Compliance",
                  desc: "Real-time auditing and policy enforcement.",
                  tags: ["GDPR", "SOC2"],
                  gradient: "from-slate-500/20 to-gray-500/20",
                  text: "text-slate-400"
                },
                {
                  icon: Network,
                  title: "Orchestrator",
                  desc: "Coordinates multi-agent workflows.",
                  tags: ["Core", "Brain"],
                  gradient: "from-yellow-500/20 to-amber-500/20",
                  text: "text-yellow-400"
                }
              ].map((agent, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-2"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${agent.text} group-hover:scale-110 transition-transform duration-300`}>
                        <agent.icon className="h-8 w-8" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                    </div>

                    <h3 className="mb-2 text-2xl font-bold tracking-tight text-white">{agent.title}</h3>
                    <p className="text-gray-400 mb-8 leading-relaxed flex-grow">
                      {agent.desc}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {agent.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-gray-300">
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

        {/* Integrations Marquee - High Tech Style */}
        <section id="integrations" className="py-24 border-y border-white/10 bg-black/60 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

          <div className="container mx-auto px-4 sm:px-8 text-center mb-12">
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-[0.3em] shadow-lg">
              Universal Compatibility
            </span>
          </div>

          <div className="relative flex overflow-x-hidden group py-4">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>

            <div className="animate-marquee whitespace-nowrap flex gap-20">
              {/* Looped Content */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-20 items-center opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 cursor-default">
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><Mail className="h-6 w-6 text-red-500" /> Gmail</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><MessageSquare className="h-6 w-6 text-green-500" /> WhatsApp</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><Globe className="h-6 w-6 text-purple-500" /> Slack</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><FileText className="h-6 w-6 text-blue-500" /> Excel</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><Cpu className="h-6 w-6 text-gray-200" /> Notion</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><Users className="h-6 w-6 text-orange-500" /> HubSpot</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><BarChart3 className="h-6 w-6 text-yellow-500" /> Zoho</span>
                  <span className="text-2xl font-bold flex items-center gap-3 text-white"><Layers className="h-6 w-6 text-cyan-500" /> Jira</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Final Impact */}
        <section className="py-40 relative overflow-hidden">
          {/* Glowing Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[150px] rounded-full animate-pulse"></div>

          <div className="container mx-auto px-4 sm:px-8 text-center relative z-10">
            <h2 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl mb-8 leading-tight drop-shadow-2xl">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Scale Infinity?</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-400 mb-12 font-light leading-relaxed">
              Join the revolution today. Reclaim your time and let intelligent agents handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/dashboard"
                className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-white px-12 text-lg font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-white to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x"></div>
                <span className="relative">Start Autopilot - Free</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Minimalist Future */}
      <footer className="border-t border-white/10 bg-black py-20 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-8 grid gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2 pr-8">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-6 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40">
                <Bot className="h-6 w-6" />
              </div>
              <span className="tracking-widest">AUTOPILOT</span>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed text-lg font-light">
              The operating system for autonomous business.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-8 text-lg text-white">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-purple-400 transition-colors">Agents Mesh</Link></li>
              <li><Link href="#" className="hover:text-purple-400 transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-purple-400 transition-colors">Security Audit</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 text-lg text-white">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-purple-400 transition-colors">Manifesto</Link></li>
              <li><Link href="#" className="hover:text-purple-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-purple-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Autopilot Inc.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
