export type RiskLevel = "Low" | "Medium" | "High";

export interface ScanResult {
  id: string;
  user_id: string;
  message: string;
  scam_score: number;
  risk_level: RiskLevel;
  scam_type: string;
  explanation: string;
  keywords: string[];
  confidence: number;
  created_at: string;
}

export const riskColor = (r: RiskLevel) =>
  r === "High" ? "destructive" : r === "Medium" ? "warning" : "success";

export const riskGradient = (r: RiskLevel) =>
  r === "High" ? "bg-gradient-danger" : r === "Medium" ? "bg-gradient-warn" : "bg-gradient-safe";
