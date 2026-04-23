export type RiskLevel = "Safe" | "Medium" | "High" | "Low";
export type RiskColor = "green" | "yellow" | "red";

export interface TimelineStep {
  time: string;
  event: string;
}

export interface ScanResult {
  id: string;
  user_id?: string;
  message: string;
  scam_score: number;
  risk_score?: number;
  risk_level: RiskLevel;
  color?: RiskColor;
  scam_type: string;
  explanation: string;
  keywords: string[];
  confidence: number;
  created_at: string;
  timeline?: TimelineStep[];
  action_plan?: string[];
  recovery_plan?: string[];
}

// Normalize legacy "Low" → "Safe" for UI consistency
export const normalizeRisk = (r: RiskLevel): "Safe" | "Medium" | "High" =>
  r === "Low" ? "Safe" : (r as "Safe" | "Medium" | "High");

export const riskColorToken = (r: RiskLevel): RiskColor => {
  const n = normalizeRisk(r);
  return n === "High" ? "red" : n === "Medium" ? "yellow" : "green";
};

export const riskGradient = (r: RiskLevel) => {
  const n = normalizeRisk(r);
  return n === "High" ? "bg-gradient-danger" : n === "Medium" ? "bg-gradient-warn" : "bg-gradient-safe";
};
