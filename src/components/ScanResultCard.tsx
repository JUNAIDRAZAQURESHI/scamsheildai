import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, Copy, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { ScanResult } from "@/types/scan";
import { cn } from "@/lib/utils";

interface Props {
  result: ScanResult;
}

export function ScanResultCard({ result }: Props) {
  const riskMeta =
    result.risk_level === "High"
      ? { Icon: ShieldX, color: "text-destructive", glow: "shadow-[0_0_60px_hsl(var(--destructive)/0.4)]", grad: "from-destructive/20 to-destructive/5", bar: "bg-gradient-danger" }
      : result.risk_level === "Medium"
      ? { Icon: ShieldAlert, color: "text-warning", glow: "shadow-[0_0_60px_hsl(var(--warning)/0.35)]", grad: "from-warning/20 to-warning/5", bar: "bg-gradient-warn" }
      : { Icon: ShieldCheck, color: "text-success", glow: "shadow-[0_0_60px_hsl(var(--success)/0.35)]", grad: "from-success/20 to-success/5", bar: "bg-gradient-safe" };

  const handleCopy = () => {
    const text = `ScamShield AI Report\n────────────────────\nRisk: ${result.risk_level} (${result.scam_score}/100)\nType: ${result.scam_type}\nConfidence: ${result.confidence}%\n\nExplanation: ${result.explanation}\n\nSuspicious keywords: ${result.keywords.join(", ") || "none"}`;
    navigator.clipboard.writeText(text);
    toast.success("Report copied to clipboard");
  };

  const handlePdf = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(15, 18, 30);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(80, 230, 220);
    doc.setFontSize(22);
    doc.text("ScamShield AI", 14, 25);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 200);
    doc.text("Fraud & Phishing Analysis Report", 14, 33);

    doc.setTextColor(20, 20, 30);
    doc.setFontSize(14);
    doc.text(`Risk Level: ${result.risk_level}`, 14, 55);
    doc.setFontSize(12);
    doc.text(`Scam Score: ${result.scam_score}/100`, 14, 65);
    doc.text(`Type: ${result.scam_type}`, 14, 73);
    doc.text(`Confidence: ${result.confidence}%`, 14, 81);
    doc.text(`Date: ${new Date(result.created_at).toLocaleString()}`, 14, 89);

    doc.setFontSize(13);
    doc.text("Explanation", 14, 103);
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 80);
    const expl = doc.splitTextToSize(result.explanation, w - 28);
    doc.text(expl, 14, 111);

    let y = 111 + expl.length * 6 + 10;
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 30);
    doc.text("Suspicious Keywords", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 80);
    doc.text(result.keywords.join(", ") || "none", 14, y, { maxWidth: w - 28 });

    y += 20;
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 30);
    doc.text("Original Message", 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 100);
    const msg = doc.splitTextToSize(result.message, w - 28);
    doc.text(msg, 14, y);

    doc.save(`scamshield-report-${result.id.slice(0, 8)}.pdf`);
    toast.success("PDF report downloaded");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative rounded-2xl glass-strong overflow-hidden", riskMeta.glow)}
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
              <h3 className={cn("text-2xl md:text-3xl font-bold", riskMeta.color)}>{result.risk_level}</h3>
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
          <Stat label="Scam Score" value={`${result.scam_score}`} suffix="/100" />
          <Stat label="Confidence" value={`${result.confidence}`} suffix="%" />
          <Stat label="Type" value={result.scam_type} className="col-span-2 md:col-span-1" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">Score Distribution</p>
          <div className="h-3 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.scam_score}%` }}
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
