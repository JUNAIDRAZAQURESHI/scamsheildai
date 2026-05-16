import { Shield } from "lucide-react";

const ROW1 = ["Junaid Raza Qureshi", "Ume Aiman Gul", "Hareem Fatima", "Abdul Basit"];
const ROW2 = ["Kadija Farooq", "Rahat Afzal", "Tayyab Ramdan", "Inshra"];

function NameChip({ name }: { name: string }) {
  return (
    <div className="group relative px-4 py-3 rounded-xl text-center text-sm text-muted-foreground hover:text-foreground border border-transparent hover:border-primary/40 transition-all cursor-default">
      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 shadow-[0_0_24px_hsl(var(--primary)/0.35)]" />
      <span className="relative font-medium tracking-wide">{name}</span>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/40 mt-12">
      <div className="absolute inset-0 bg-gradient-hero opacity-30 pointer-events-none" />
      <div className="container relative py-14">
        <div className="glass-strong rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center text-center gap-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/20">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary">The Team</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Built By <span className="text-gradient">CyberShield AI Team</span>
            </h3>
            <p className="text-sm text-muted-foreground">Hybrid AI · Built for safety</p>
          </div>

          <div className="space-y-3 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROW1.map((n) => <NameChip key={n} name={n} />)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROW2.map((n) => <NameChip key={n} name={n} />)}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 font-mono tracking-wider">
          CyberShield AI © 2026 — All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
