import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Flag, Lock, Ban, ShieldCheck, ShieldAlert, ShieldX, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { normalizeRisk } from "@/types/scan";
import type { ScanResult } from "@/types/scan";

interface Props {
  result: ScanResult;
}

const SECURE_CHECKLIST = [
  "Change passwords on all critical accounts (email, banking, social)",
  "Enable Two-Factor Authentication (2FA) everywhere supported",
  "Log out of all active sessions on every device",
  "Review recent login activity for unknown locations",
  "Update recovery email and phone number",
];

const BLOCK_STEPS = [
  "Open the message app or email client",
  "Tap the sender's name/number at the top",
  "Select 'Block', 'Report Spam', or 'Block Contact'",
  "Delete the conversation after blocking",
  "Report the number to your carrier or local cyber-crime cell",
];

export function ProtectionActions({ result }: Props) {
  const risk = normalizeRisk(result.risk_level);
  const score = result.risk_score ?? result.scam_score;

  const [secureOpen, setSecureOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (!risk) return null;

  const handleReport = async () => {
    const text = `SCAM REPORT — CyberShield AI
─────────────────────────────
Risk Level: ${risk} (${score}/100)
Type: ${result.scam_type}
Date: ${new Date(result.created_at).toLocaleString()}

Suspicious Message:
"${result.message}"

Reason flagged:
${result.explanation}

I would like to formally report the above message as a suspected scam attempt. Please investigate and take appropriate action.`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Complaint text copied — paste into your report form");
    } catch {
      toast.error("Could not copy. Please try again.");
    }
  };

  // ────────── HIGH RISK ──────────
  if (risk === "High") {
    return (
      <>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl glass-strong border border-destructive/40 bg-destructive/5 p-5 md:p-6 space-y-4 shadow-[0_0_50px_hsl(var(--destructive)/0.25)]"
        >
          <div className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-destructive" />
            <h3 className="text-base font-semibold text-destructive">
              Immediate Protection Actions
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            High-risk threat detected. Take these steps right now to protect yourself.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <ActionButton
              icon={Phone}
              label="Call Bank Now"
              tone="danger"
              onClick={() => {
                window.location.href = "tel:+18005551234";
              }}
            />
            <ActionButton
              icon={Flag}
              label="Report Scam"
              tone="danger"
              onClick={handleReport}
            />
            <ActionButton
              icon={Lock}
              label="Secure My Accounts"
              tone="danger"
              onClick={() => setSecureOpen(true)}
            />
            <ActionButton
              icon={Ban}
              label="Block Sender Guide"
              tone="danger"
              onClick={() => setBlockOpen(true)}
            />
          </div>
        </motion.section>

        {/* Secure Accounts Modal */}
        <Dialog open={secureOpen} onOpenChange={setSecureOpen}>
          <DialogContent className="glass-strong border-destructive/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-destructive" />
                Secure My Accounts
              </DialogTitle>
              <DialogDescription>
                Complete each step to lock down your digital identity.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-3 mt-2">
              {SECURE_CHECKLIST.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg p-3 bg-secondary/40 border border-border"
                >
                  <Checkbox
                    id={`sec-${i}`}
                    checked={!!checked[i]}
                    onCheckedChange={(v) =>
                      setChecked((c) => ({ ...c, [i]: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`sec-${i}`}
                    className={cn(
                      "text-sm leading-relaxed cursor-pointer",
                      checked[i] && "line-through text-muted-foreground"
                    )}
                  >
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>

        {/* Block Sender Guide Modal */}
        <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
          <DialogContent className="glass-strong border-destructive/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                Block Sender Guide
              </DialogTitle>
              <DialogDescription>
                Quick steps to stop further contact from this sender.
              </DialogDescription>
            </DialogHeader>
            <ol className="space-y-2 mt-2">
              {BLOCK_STEPS.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg p-3 bg-secondary/40 border border-border"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ────────── MEDIUM RISK ──────────
  if (risk === "Medium") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl glass-strong border border-warning/40 bg-warning/5 p-5 md:p-6 space-y-4 shadow-[0_0_40px_hsl(var(--warning)/0.18)]"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-warning" />
          <h3 className="text-base font-semibold text-warning">
            Immediate Protection Actions
          </h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Verify Before Action</p>
        <ul className="space-y-2">
          {[
            "Do not click unknown links inside this message",
            "Confirm the sender's identity through an official channel",
            "Never share OTPs, passwords, or card details over chat",
            "Hover over links to inspect the real destination URL",
          ].map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg p-3 bg-secondary/40 border border-border"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
              <p className="text-sm leading-relaxed text-foreground/90">{line}</p>
            </li>
          ))}
        </ul>
      </motion.section>
    );
  }

  // ────────── SAFE ──────────
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass-strong border border-success/40 bg-success/5 p-5 md:p-6 space-y-4 shadow-[0_0_40px_hsl(var(--success)/0.18)]"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-success" />
        <h3 className="text-base font-semibold text-success">
          Immediate Protection Actions
        </h3>
      </div>
      <ul className="space-y-2">
        {[
          "No immediate threat detected in this message",
          "Stay cautious with unknown senders and unexpected requests",
          "Keep your devices updated and enable 2FA on key accounts",
        ].map((line, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg p-3 bg-secondary/40 border border-border"
          >
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-foreground/90">{line}</p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  tone: "danger";
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "h-auto py-3 justify-start gap-3 text-left font-semibold transition-all hover:scale-[1.02]",
        tone === "danger" &&
          "bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/40 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)]"
      )}
      variant="outline"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}
