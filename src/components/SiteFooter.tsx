import { Shield } from "lucide-react";

const TEAM = [
  "Junaid Raza Qureshi",
  "Ume Aiman Gul",
  "Hareem Fatima",
  "Abdul Basit",
  "Kadija Farooq",
  "Rahat Afzal",
  "Tayyab Ramdan",
  "Inshra",
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/40 mt-12">
      <div className="absolute inset-0 bg-gradient-hero opacity-30 pointer-events-none" />
      <div className="container relative py-12">
        <div className="glass-strong rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Developed By</p>
              <h3 className="text-xl font-bold">The CyberShield AI Team</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-mono">Hybrid AI · Built for safety</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TEAM.map((name) => (
              <div
                key={name}
                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all cursor-default"
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          CyberShield AI © 2026
        </p>
      </div>
    </footer>
  );
}
