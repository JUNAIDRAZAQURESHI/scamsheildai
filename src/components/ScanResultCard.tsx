import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, Copy, Download, Sparkles, Clock, ListChecks, LifeBuoy, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { ScanResult } from "@/types/scan";
import { normalizeRisk } from "@/types/scan";
import { cn } from "@/lib/utils";

interface Props {
  result: ScanResult;
}

export function ScanResultCard({ result }: Props) {
  const risk = normalizeRisk(result.risk_level);
  const score = result.risk_score ?? result.scam_score;

  const riskMeta =
    risk === "High"
      ? { Icon: ShieldX, color: "text-destructive", glow: "shadow-[0_0_60px_hsl(var(--destructive)/0.4)]", grad: "from-destructive/20 to-destructive/5", bar: "bg-gradient-danger", chip: "bg-destructive/15 text-destructive border-destructive/40" }
      : risk === "Medium"
      ? { Icon: ShieldAlert, color: "text-warning", glow: "shadow-[0_0_60px_hsl(var(--warning)/0.35)]", grad: "from-warning/20 to-warning/5", bar: "bg-gradient-warn", chip: "bg-warning/15 text-warning border-warning/40" }
      : { Icon: ShieldCheck, color: "text-success", glow: "shadow-[0_0_60px_hsl(var(--success)/0.35)]", grad: "from-success/20 to-success/5", bar: "bg-gradient-safe", chip: "bg-success/15 text-success border-success/40" };

  const handleCopy = () => {
    const text = `CyberShield AI Report
────────────────────
Risk: ${risk} (${score}/100)
Type: ${result.scam_type}
Confidence: ${result.confidence}%

Explanation: ${result.explanation}

Suspicious keywords: ${(result.keywords ?? []).join(", ") || "none"}

Predicted Attack Timeline:
${(result.timeline ?? []).map(t => `  • ${t.time} — ${t.event}`).join("\n") || "  • No attack predicted"}

Action Plan:
${(result.action_plan ?? []).map(a => `  • ${a}`).join("\n") || "  • —"}

${(result.recovery_plan?.length ?? 0) > 0 ? `Recovery Plan:\n${result.recovery_plan!.map(r => `  • ${r}`).join("\n")}` : ""}`;
    navigator.clipboard.writeText(text);
    toast.success("Report copied to clipboard");
  };

  const handlePdf = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(79, 157, 255);
    doc.setFontSize(22);
    doc.text("CyberShield AI", 14, 25);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 200);
    doc.text("Threat Intelligence Report", 14, 33);

    doc.setTextColor(20, 20, 30);
    doc.setFontSize(14);
    doc.text(`Risk Level: ${risk}`, 14, 55);
    doc.setFontSize(12);
    doc.text(`Risk Score: ${score}/100`, 14, 65);
    doc.text(`Type: ${result.scam_type}`, 14, 73);
    doc.text(`Confidence: ${result.confidence}%`, 14, 81);
    doc.text(`Date: ${new Date(result.created_at).toLocaleString()}`, 14, 89);

    let y = 103;
    const section = (title: string) => {
      if (y > h - 30) { doc.addPage(); y = 20; }
      doc.setFontSize(13); doc.setTextColor(20, 20, 30); doc.text(title, 14, y); y += 7;
      doc.setFontSize(10); doc.setTextColor(60, 60, 80);
    };
    const para = (text: string) => {
      const lines = doc.splitTextToSize(text, w - 28);
      lines.forEach((ln: string) => {
        if (y > h - 15) { doc.addPage(); y = 20; }
        doc.text(ln, 14, y); y += 5;
      });
      y += 4;
    };

    section("Explanation"); para(result.explanation);
    section("Suspicious Keywords"); para((result.keywords ?? []).join(", ") || "none");
    section("Predicted Attack Timeline");
    (result.timeline ?? [{ time: "—", event: "No attack predicted" }]).forEach(t => para(`• ${t.time} — ${t.event}`));
    section("Action Plan");
    (result.action_plan ?? []).forEach(a => para(`• ${a}`));
    if ((result.recovery_plan?.length ?? 0) > 0) {
      section("Recovery Plan");
      result.recovery_plan!.forEach(r => para(`• ${r}`));
    }
    section("Original Message"); para(result.message);

    doc.save(`cybershield-report-${result.id.slice(0, 8)}.pdf`);
    toast.success("PDF report downloaded");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative rounded-2xl glass-strong overflow-hidden transition-shadow", riskMeta.glow)}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", riskMeta.grad)} />
      <div className={cn("h-1 w-full", riskMeta.bar)} />

      <div className="relative p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className={cn("p-3 rounded-xl glass", riskMeta.color)}
            >
              <riskMeta.Icon className="h-7 w-7" strokeWidth={2.2} />
            </motion.div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Risk Level</p>
              <h3 className={cn("text-2xl md:text-3xl font-bold", riskMeta.color)}>{risk}</h3>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handlePdf}>
              <Download className="h-4 w-4 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Risk Score" value={`${score}`} suffix="/100" />
          <Stat label="Confidence" value={`${result.confidence}`} suffix="%" />
          <Stat label="Type" value={result.scam_type} className="col-span-2 md:col-span-1" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">Threat Score</p>
          <div className="h-3 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className={cn("h-full rounded-full", riskMeta.bar)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">AI Analysis</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.explanation}</p>
        </div>

        {/* Psychological Analysis */}
        <div className="space-y-3 rounded-xl glass p-4 border border-primary/20">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Psychological Analysis</p>
          </div>
          {(result.psychology_analysis?.tactics?.length ?? 0) > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {result.psychology_analysis!.tactics.map((t, i) => (
                  <motion.div
                    key={t + i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                  >
                    <Badge variant="outline" className="text-xs border-primary/40 bg-primary/10 text-primary">
                      {t}
                    </Badge>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {result.psychology_analysis!.explanation}
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {result.psychology_analysis?.explanation || "No strong manipulation detected"}
            </p>
          )}
        </div>

        {(result.keywords?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Suspicious Signals</p>
            <div className="flex flex-wrap gap-2">
              {(result.keywords ?? []).map((k, i) => (
                <motion.div
                  key={k + i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                >
                  <Badge variant="outline" className="font-mono text-xs border-primary/30 bg-primary/5">
                    {k}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Predicted Attack Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Predicted Attack Timeline</p>
          </div>
          <div className="relative pl-6 space-y-3 border-l border-border/60">
            {(result.timeline ?? [{ time: "—", event: "No attack predicted" }]).map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="relative"
              >
                <span className={cn("absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-background", risk === "High" ? "bg-destructive" : risk === "Medium" ? "bg-warning" : "bg-success")} />
                <div className="flex items-baseline gap-3 flex-wrap">
                  <Badge variant="outline" className={cn("font-mono text-[10px]", riskMeta.chip)}>{step.time}</Badge>
                  <p className="text-sm text-muted-foreground">{step.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Plan */}
        {(result.action_plan?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Action Plan — Do This Now</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {result.action_plan!.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.04 }}
                  className="flex items-start gap-2 rounded-lg glass p-3"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p className="text-xs leading-relaxed text-foreground/90">{a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Plan — only for High risk */}
        {(result.recovery_plan?.length ?? 0) > 0 && (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-destructive" />
              <p className="text-sm font-semibold text-destructive">Recovery Plan — If You Already Engaged</p>
            </div>
            <ul className="space-y-1.5">
              {result.recovery_plan!.map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.04 }}
                  className="flex items-start gap-2 text-xs text-foreground/90"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  <span className="leading-relaxed">{r}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ label, value, suffix, className }: { label: string; value: string; suffix?: string; className?: string }) {
  return (
    <div className={cn("rounded-xl glass p-3", className)}>
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold truncate">
        {value}
        {suffix && <span className="text-sm text-muted-foreground font-normal">{suffix}</span>}
      </p>
    </div>
  );
}
