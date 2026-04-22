import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";
import { Shield, ShieldAlert, Activity, TrendingUp, Sparkles, ChevronRight, Lightbulb } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ScanResult } from "@/types/scan";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["hsl(174 90% 55%)", "hsl(280 90% 65%)", "hsl(38 95% 60%)", "hsl(0 90% 60%)", "hsl(200 90% 60%)", "hsl(142 75% 50%)", "hsl(320 90% 65%)", "hsl(60 90% 60%)", "hsl(15 90% 60%)"];

export default function Dashboard() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setScans(data as ScanResult[]);
        setLoading(false);
      });
  }, [user]);

  const stats = useMemo(() => {
    const total = scans.length;
    const high = scans.filter((s) => s.risk_level === "High").length;
    const med = scans.filter((s) => s.risk_level === "Medium").length;
    const low = scans.filter((s) => s.risk_level === "Low").length;
    const avgScore = total ? Math.round(scans.reduce((a, s) => a + s.scam_score, 0) / total) : 0;
    // user safety score: inverse of average exposure, weighted by high-risk encounters
    const exposureRate = total ? high / total : 0;
    const safety = Math.max(0, Math.min(100, Math.round(100 - avgScore * 0.5 - exposureRate * 30)));
    const week = scans.filter((s) => new Date(s.created_at) > subDays(new Date(), 7)).length;
    return { total, high, med, low, avgScore, safety, week };
  }, [scans]);

  const dailyData = useMemo(() => {
    const days = 7;
    const buckets: { date: string; scans: number; high: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      const next = startOfDay(subDays(new Date(), i - 1));
      const inDay = scans.filter((s) => {
        const ts = new Date(s.created_at);
        return ts >= d && ts < next;
      });
      buckets.push({
        date: format(d, "MMM d"),
        scans: inDay.length,
        high: inDay.filter((s) => s.risk_level === "High").length,
      });
    }
    return buckets;
  }, [scans]);

  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    scans.forEach((s) => map.set(s.scam_type, (map.get(s.scam_type) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [scans]);

  const riskData = [
    { name: "High", value: stats.high, color: "hsl(0 90% 60%)" },
    { name: "Medium", value: stats.med, color: "hsl(38 95% 60%)" },
    { name: "Low", value: stats.low, color: "hsl(142 75% 50%)" },
  ].filter((d) => d.value > 0);

  const topType = typeData.sort((a, b) => b.value - a.value)[0]?.name;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-10 max-w-7xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Your fraud exposure at a glance.</p>
          </div>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/analyzer">
              <Sparkles className="h-4 w-4 mr-2" />
              New Scan
            </Link>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Activity} label="Total Scans" value={stats.total} accent="primary" delay={0} />
          <StatCard icon={ShieldAlert} label="High Risk" value={stats.high} accent="destructive" delay={0.05} />
          <StatCard icon={TrendingUp} label="This Week" value={stats.week} accent="accent" delay={0.1} />
          <StatCard icon={Shield} label="Safety Score" value={`${stats.safety}/100`} accent="success" delay={0.15} />
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">Loading analytics…</div>
        ) : scans.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Daily bar chart */}
            <ChartCard title="Scans · Last 7 Days" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyData}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(174 90% 55%)" />
                      <stop offset="100%" stopColor="hsl(174 90% 55% / 0.3)" />
                    </linearGradient>
                    <linearGradient id="barGradH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0 90% 60%)" />
                      <stop offset="100%" stopColor="hsl(0 90% 60% / 0.3)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "hsl(var(--primary)/0.05)" }} />
                  <Bar dataKey="scans" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="high" fill="url(#barGradH)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Risk distribution */}
            <ChartCard title="Risk Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {riskData.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 -mt-4 flex-wrap">
                {riskData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Scam types */}
            <ChartCard title="Scam Types" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false} fontSize={11}>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Insights */}
            <div className="rounded-2xl glass-strong p-5 space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Security Insights</h3>
              </div>
              <Insight label="Most common threat" value={topType || "—"} />
              <Insight label="Vulnerability score" value={`${100 - stats.safety}/100`} accent={stats.safety < 50 ? "destructive" : "success"} />
              <Insight label="Avg scam score" value={`${stats.avgScore}/100`} />
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stats.high > 0
                    ? "⚠️ You've encountered high-risk messages recently. Be extra cautious with links and OTPs."
                    : "✅ No high-risk messages detected recently. Keep scanning anything suspicious."}
                </p>
              </div>
            </div>

            {/* Recent scans */}
            <ChartCard title="Recent Activity" className="lg:col-span-3">
              <div className="space-y-2">
                {scans.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    to="/history"
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          s.risk_level === "High" && "bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]",
                          s.risk_level === "Medium" && "bg-warning shadow-[0_0_10px_hsl(var(--warning))]",
                          s.risk_level === "Low" && "bg-success shadow-[0_0_10px_hsl(var(--success))]"
                        )}
                      />
                      <p className="text-sm truncate text-muted-foreground group-hover:text-foreground transition-colors">{s.message.slice(0, 100)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-muted-foreground hidden md:inline">{s.scam_type}</span>
                      <span className="text-sm font-bold tabular-nums">{s.scam_score}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </ChartCard>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, delay }: { icon: any; label: string; value: any; accent: string; delay: number }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    success: "text-success bg-success/10 border-success/20",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass rounded-2xl p-5 group hover:shadow-glow transition-all duration-500"
    >
      <div className={cn("inline-flex p-2 rounded-lg border mb-3", colorMap[accent])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("glass-strong rounded-2xl p-5", className)}>
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Insight({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent === "destructive" && "text-destructive", accent === "success" && "text-success")}>{value}</span>
    </div>
  );
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-elevated">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.payload.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-strong rounded-2xl p-12 text-center">
      <Shield className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
      <h3 className="text-xl font-bold mb-2">No scans yet</h3>
      <p className="text-muted-foreground mb-6">Run your first analysis to see analytics here.</p>
      <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
        <Link to="/analyzer"><Sparkles className="h-4 w-4 mr-2" />Start First Scan</Link>
      </Button>
    </div>
  );
}
