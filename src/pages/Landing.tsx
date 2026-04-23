import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Lock, Sparkles, ChevronRight, ShieldCheck, Eye, Brain, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";

const features = [
  { icon: Brain, title: "Hybrid AI Engine", desc: "Combines large language models with rule-based detection for unmatched accuracy across phishing, OTP fraud, and prize scams." },
  { icon: Zap, title: "Real-Time Analysis", desc: "Get a complete fraud risk report in under 2 seconds. Paste any message and know instantly." },
  { icon: BarChart3, title: "Personal Analytics", desc: "Track your exposure over time with rich charts, trend analysis, and a personalized vulnerability score." },
  { icon: Lock, title: "Private & Secure", desc: "Your scans are encrypted and isolated per user with row-level security. No one else sees your data." },
  { icon: Eye, title: "Explainable Results", desc: "Every verdict includes the suspicious keywords, scam type, and a plain-English explanation." },
  { icon: ShieldCheck, title: "PDF Reports", desc: "Export shareable, professional reports for legal, IT, or compliance review with one click." },
];

const channels = [
  { icon: MessageSquare, label: "WhatsApp" },
  { icon: Mail, label: "Email" },
  { icon: Smartphone, label: "SMS" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-hero" />

        <div className="container relative pt-20 pb-32 md:pt-32 md:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium font-mono uppercase tracking-wider">AI-Powered Cybersecurity</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Stop Scams Before
              <br />
              <span className="text-gradient">They Cost You Everything</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Detect fraud, understand threats, and see future attack simulations instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground glow-button text-base h-12 px-7">
                <Link to="/auth?mode=signup">
                  Analyze Now
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-7 text-base glass hover-lift">
                <a href="#features">Learn More</a>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              {channels.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <c.icon className="h-4 w-4 text-primary" />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-3xl mx-auto mt-20"
          >
            <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-20 rounded-full" />
            <div className="relative glass-strong rounded-2xl p-6 md:p-8 shadow-elevated animate-float">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">scamshield.ai/analyzer</span>
              </div>
              <div className="rounded-lg bg-secondary/40 p-4 font-mono text-sm mb-5 border border-border/50">
                "URGENT: Your bank account has been suspended. Verify identity now: bit.ly/sec-verify"
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-danger/10 border border-destructive/30">
                <div>
                  <div className="text-xs font-mono uppercase text-destructive/80 tracking-widest">Verdict</div>
                  <div className="text-xl font-bold text-destructive">High Risk · Phishing</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-destructive">94<span className="text-base text-muted-foreground">/100</span></div>
                  <div className="text-xs text-muted-foreground">scam score</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Capabilities</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Built like a security operations center.</h2>
          <p className="text-muted-foreground text-lg">Everything you need to detect, understand, and report fraud — in one beautiful interface.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl glass hover-lift p-6"
            >
              <div className="mb-4 inline-flex p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="container py-16">
        <div className="glass-strong rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-50" />
          <div className="relative">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to outsmart the scammers?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Join thousands using AI to protect themselves and their families from fraud — for free.</p>
            <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground glow-button h-12 px-7 text-base">
              <Link to="/auth?mode=signup">
                Create Free Account
                <ChevronRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
