import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Trash2, Download, Search, ShieldX, ShieldAlert, ShieldCheck, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScanResultCard } from "@/components/ScanResultCard";
import type { RiskLevel, ScanResult } from "@/types/scan";
import { normalizeRisk } from "@/types/scan";
import { cn } from "@/lib/utils";

const filters: (RiskLevel | "All")[] = ["All", "High", "Medium", "Safe"];

export default function History() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setScans(data as ScanResult[]);
        setLoading(false);
      });
  }, [user]);

  const filtered = useMemo(() => {
    return scans.filter((s) => {
      if (filter !== "All" && normalizeRisk(s.risk_level) !== normalizeRisk(filter as RiskLevel)) return false;
      if (search && !s.message.toLowerCase().includes(search.toLowerCase()) && !s.scam_type.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [scans, filter, search]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      setScans((s) => s.filter((x) => x.id !== id));
      toast.success("Scan deleted");
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Risk", "Score", "Type", "Confidence", "Message", "Keywords"];
    const rows = filtered.map((s) => [
      new Date(s.created_at).toISOString(),
      s.risk_level,
      s.scam_score,
      s.scam_type,
      s.confidence,
      `"${s.message.replace(/"/g, '""')}"`,
      `"${s.keywords.join("; ")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scamshield-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("History exported");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-10 max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">History</p>
            <h1 className="text-3xl md:text-4xl font-bold">All Scans</h1>
            <p className="text-muted-foreground mt-1">{scans.length} total · {filtered.length} shown</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground glow-button">
              <Link to="/analyzer"><Sparkles className="h-4 w-4 mr-2" />New Scan</Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages or scam types…"
              className="pl-9 bg-secondary/40 border-border h-10"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">No scans match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s, i) => (
              <ScanRow key={s.id} scan={s} delay={i * 0.02} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ScanRow({ scan, delay, onDelete }: { scan: ScanResult; delay: number; onDelete: (id: string) => void }) {
  const Icon = scan.risk_level === "High" ? ShieldX : scan.risk_level === "Medium" ? ShieldAlert : ShieldCheck;
  const colorClass =
    scan.risk_level === "High" ? "text-destructive" : scan.risk_level === "Medium" ? "text-warning" : "text-success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="group glass hover-lift rounded-xl p-4"
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("h-5 w-5 shrink-0", colorClass)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate font-medium">{scan.message}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-mono">{scan.scam_type}</Badge>
            <span className="text-xs text-muted-foreground">{format(new Date(scan.created_at), "MMM d, yyyy · HH:mm")}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={cn("text-xl font-bold tabular-nums", colorClass)}>{scan.scam_score}</div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{scan.risk_level}</div>
        </div>
        <div className="flex gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">View</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-strong border-border">
              <DialogHeader>
                <DialogTitle className="sr-only">Scan details</DialogTitle>
              </DialogHeader>
              <ScanResultCard result={scan} />
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(scan.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}
