import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, Wand2, FileText, ShieldCheck, Link2, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppHeader } from "@/components/AppHeader";
import { ScanResultCard } from "@/components/ScanResultCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ScanResult } from "@/types/scan";

const SAMPLES = [
  "URGENT: Your account has been suspended. Click bit.ly/verify-now to restore access within 24h or lose all funds.",
  "Congratulations! You've won a $1000 Amazon gift card. Claim now: prizemax.win/claim",
  "Hi, this is Sarah from HR. Are you free for a quick call about the team offsite next week?",
  "Your OTP is 458291. Do not share with anyone. — YourBank",
];

export default function Analyzer() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const analyze = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast.error("Please enter a message to analyze");
      return;
    }
    if (trimmed.length > 5000) {
      toast.error("Message is too long (max 5000 chars)");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-message", {
        body: { message: trimmed },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ScanResult);
      toast.success("Analysis complete");
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Analysis failed";
      if (msg.includes("Rate limit")) toast.error("Rate limit reached. Try again shortly.");
      else if (msg.includes("credits")) toast.error("AI credits exhausted. Add funds in Workspace settings.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-10 md:py-14 max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Smart Analyzer</p>
          <h1 className="text-3xl md:text-4xl font-bold">Scan a suspicious message</h1>
          <p className="text-muted-foreground mt-2">Paste any SMS, email, or chat message. We'll return a full hybrid AI risk report in seconds.</p>
        </div>

        <div className="relative glass-strong rounded-2xl p-6 mb-6 shadow-card">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste the suspicious message here…"
            className="min-h-[180px] bg-secondary/40 border-border resize-y font-mono text-sm leading-relaxed"
            maxLength={5000}
          />

          {/* Scanning overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-6 rounded-lg overflow-hidden pointer-events-none"
              >
                <div className="absolute inset-0 bg-primary/5" />
                <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent animate-scan" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <span className="text-xs text-muted-foreground font-mono">{message.length}/5000</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMessage("")} disabled={loading || !message}>
                Clear
              </Button>
              <Button
                onClick={analyze}
                disabled={loading || message.trim().length < 3}
                className="bg-gradient-primary text-primary-foreground glow-button min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing threat…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {!result && !loading && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Try a sample</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SAMPLES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(s)}
                  className="text-left p-3 rounded-lg bg-secondary/40 hover:bg-secondary border border-border hover:border-primary/40 transition-all text-xs text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5 mb-1.5 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-fade-up">
            <ScanResultCard result={result} />
            {result.risk_level === "High" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
              >
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive mb-1">High Risk Alert</p>
                  <p className="text-muted-foreground">Do not click any links, share OTPs, or reply. If you already did — change your passwords and contact your bank immediately.</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Security Tips — display only */}
        <div className="mt-8 glass-strong hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Security Tips</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: KeyRound, title: "Never share OTPs", desc: "No legitimate company will ever ask for your one-time password." },
              { icon: Link2, title: "Avoid suspicious links", desc: "Hover before you click. Shortened URLs are a common scam vector." },
              { icon: UserCheck, title: "Verify the sender", desc: "Confirm identity through an official channel before trusting messages." },
            ].map((t) => (
              <div key={t.title} className="rounded-xl glass p-4 hover-lift">
                <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 mb-3">
                  <t.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold mb-1">{t.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
