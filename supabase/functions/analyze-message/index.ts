import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCAM_KEYWORDS = [
  "urgent", "verify", "suspended", "click here", "act now", "winner",
  "congratulations", "prize", "lottery", "otp", "password", "ssn",
  "bank account", "wire transfer", "bitcoin", "crypto", "gift card",
  "irs", "tax refund", "arrest", "warrant", "limited time",
  "confirm identity", "unusual activity", "locked", "deactivated",
  "claim your", "free", "guaranteed", "risk-free",
];

const URGENCY_WORDS = ["immediately", "now", "today", "expires", "last chance", "hurry"];
const THREAT_WORDS = ["arrest", "legal action", "police", "lawsuit", "fine", "penalty"];
const URL_REGEX = /https?:\/\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+/gi;

// Strong threat-first signal patterns
const OTP_PATTERNS = /\b(otp|one[\s-]?time[\s-]?password|verification code|security code|2fa code)\b/i;
const BANK_PATTERNS = /\b(bank|account|debit|credit card|cvv|pin|ifsc|routing|swift|wire)\b/i;
const PHISH_PATTERNS = /\b(verify|confirm|update|reactivate|unlock|suspend(ed)?|restore|secure)\b.{0,30}\b(account|identity|profile|login)\b/i;
const PRIZE_PATTERNS = /\b(won|winner|prize|lottery|jackpot|reward|gift card|claim)\b/i;
const JOB_SCAM_PATTERNS = /\b(work from home|earn \$|easy money|hiring immediately|no experience|registration fee)\b/i;
const SHORTENER = /\b(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly)\b/i;

function ruleBasedAnalysis(message: string) {
  const lower = message.toLowerCase();
  const found: string[] = [];
  let score = 0;
  let category = "Unknown";

  for (const kw of SCAM_KEYWORDS) {
    if (lower.includes(kw)) {
      found.push(kw);
      score += 5;
    }
  }
  for (const w of URGENCY_WORDS) if (lower.includes(w)) score += 4;
  for (const w of THREAT_WORDS) if (lower.includes(w)) score += 8;

  const urls = message.match(URL_REGEX) || [];
  score += urls.length * 12;
  if (urls.some((u) => SHORTENER.test(u))) score += 20;

  // Threat-first heavy boosts
  if (OTP_PATTERNS.test(message) && /share|send|provide|tell|give/i.test(message)) {
    score += 50; category = "OTP Fraud";
  } else if (OTP_PATTERNS.test(message) && /\b\d{4,8}\b/.test(message)) {
    score += 25; category = "OTP Fraud";
  }
  if (PHISH_PATTERNS.test(message)) { score += 35; category = "Phishing"; }
  if (BANK_PATTERNS.test(message) && (urls.length > 0 || /verify|confirm|update/i.test(message))) {
    score += 30; if (category === "Unknown") category = "Phishing";
  }
  if (PRIZE_PATTERNS.test(message)) { score += 30; if (category === "Unknown") category = "Prize Scam"; }
  if (JOB_SCAM_PATTERNS.test(message)) { score += 25; if (category === "Unknown") category = "Job Scam"; }
  if (urls.length > 0 && category === "Unknown") category = "Malicious Link";

  if (message.length < 30 && urls.length > 0) score += 10;

  return { ruleScore: Math.min(score, 100), foundKeywords: [...new Set(found)], ruleCategory: category, urlCount: urls.length };
}

function buildTimeline(score: number, scamType: string) {
  if (score <= 30) return [{ time: "—", event: "No attack predicted" }];
  const t: Record<string, Array<{ time: string; event: string }>> = {
    "Phishing": [
      { time: "0 min", event: "User clicks the embedded link" },
      { time: "2 min", event: "Credentials entered into spoofed login page" },
      { time: "10 min", event: "Attacker logs into real account, changes recovery info" },
      { time: "30 min", event: "Funds drained or identity used for further fraud" },
    ],
    "OTP Fraud": [
      { time: "0 min", event: "User shares OTP with attacker" },
      { time: "2 min", event: "Attacker authorizes a transaction or login" },
      { time: "10 min", event: "Account compromised, additional OTPs intercepted" },
      { time: "30 min", event: "Multiple withdrawals or account takeover completed" },
    ],
    "Prize Scam": [
      { time: "0 min", event: "Victim clicks 'claim prize' link" },
      { time: "2 min", event: "Personal info / payment details captured" },
      { time: "10 min", event: "Small 'processing fee' charged to test card" },
      { time: "30 min", event: "Larger unauthorized charges follow" },
    ],
    "Job Scam": [
      { time: "0 min", event: "Victim contacts the scammer" },
      { time: "2 min", event: "Asked to pay registration / training fee" },
      { time: "10 min", event: "Personal & banking info collected" },
      { time: "30 min", event: "Identity theft or recurring withdrawals" },
    ],
  };
  if (t[scamType]) return t[scamType];
  return [
    { time: "0 min", event: "User interacts with the malicious content" },
    { time: "2 min", event: "Sensitive data captured by attacker" },
    { time: "10 min", event: "Account access attempted" },
    { time: "30 min", event: "Financial or identity exploitation begins" },
  ];
}

function buildActionPlan(score: number, scamType: string) {
  if (score <= 30) return ["No action required — message appears safe", "Stay vigilant for unsolicited requests"];
  const base = [
    "Do NOT click any links or download attachments",
    "Do NOT reply or share any personal information",
    "Take a screenshot for evidence, then delete the message",
  ];
  const map: Record<string, string[]> = {
    "OTP Fraud": ["Never share OTPs — no legitimate company will ask for them", "Block the sender immediately", "Report to your bank's anti-fraud helpline"],
    "Phishing": ["Verify the sender via the official website or app — not the link", "Report the message as phishing to your provider", "Check if the domain matches the real brand exactly"],
    "Prize Scam": ["Real lotteries don't require fees to claim", "Reverse-search the offer online for known scams", "Report the sender to the platform"],
    "Job Scam": ["Legitimate employers never ask for upfront fees", "Verify the company on LinkedIn / official site", "Report the listing to the platform"],
    "Malicious Link": ["Do not preview or open the URL", "Use a URL scanner (VirusTotal) before any action", "Report the sender as spam"],
  };
  return [...base, ...(map[scamType] ?? ["Verify the sender through an official channel before any action"])];
}

type PsychTactic = "Fear" | "Urgency" | "Authority" | "Reward";
function buildPsychologyAnalysis(message: string): { tactics: PsychTactic[]; explanation: string } {
  const m = message.toLowerCase();
  const tactics: PsychTactic[] = [];

  const fear = /\b(arrest|warrant|legal action|police|lawsuit|fine|penalty|blocked|suspended|locked|deactivated|terminated|closed|frozen|unauthorized|breach|hacked|virus|infected)\b/i;
  const urgency = /\b(urgent|immediately|now|today|asap|hurry|quickly|expires?|expiring|last chance|limited time|act now|within \d+\s*(min|hour|hr|day)s?|final notice|deadline)\b/i;
  const authority = /\b(bank|irs|tax|government|police|court|fbi|cbi|customs|federal|official|hr department|microsoft|apple|google|amazon|paypal|netflix|support team|security team|admin|ceo|manager)\b/i;
  const reward = /\b(won|winner|prize|lottery|jackpot|reward|cashback|gift card|free|congratulations|claim|bonus|refund|inheritance|grant|selected)\b/i;

  if (fear.test(m)) tactics.push("Fear");
  if (urgency.test(m)) tactics.push("Urgency");
  if (authority.test(m)) tactics.push("Authority");
  if (reward.test(m)) tactics.push("Reward");

  if (tactics.length === 0) {
    return { tactics: [], explanation: "No strong manipulation detected in this message." };
  }

  const phrases: Record<PsychTactic, string> = {
    Fear: "fear of loss or punishment",
    Urgency: "time pressure to bypass careful thinking",
    Authority: "impersonation of a trusted institution",
    Reward: "promise of an unexpected reward",
  };
  const desc = tactics.map((t) => phrases[t]).join(" and ");
  const explanation = `This message uses ${desc} to pressure the user into reacting quickly without verification.`;
  return { tactics, explanation };
}

function buildRecoveryPlan(score: number) {
  if (score < 70) return [];
  return [
    "Change passwords for all related accounts immediately",
    "Enable two-factor authentication (2FA) on email & banking",
    "Contact your bank to freeze cards / reverse transactions",
    "Revoke active sessions and connected apps in account settings",
    "Report the incident to local cybercrime authorities",
    "Monitor your credit report for unauthorized activity",
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const message = String(body?.message ?? "").trim();
    if (!message || message.length < 3 || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Message must be 3-5000 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ruleScore, foundKeywords, ruleCategory, urlCount } = ruleBasedAnalysis(message);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `You are CyberShield AI — a cybersecurity threat-detection engine. CRITICAL RULES:
1. THREAT-FIRST BIAS: Default to detection, NOT safety. Only mark Safe (0–30) if the message is CLEARLY a normal human conversation with NO links, NO money/account references, NO urgency, NO codes.
2. Phishing / OTP requests / banking fraud / credential harvesting → score 80–100 (HIGH).
3. Prize / lottery / fake reward scams → score 70–95 (HIGH).
4. Suspicious links, shortened URLs, unverified senders → score 60–90 (MEDIUM/HIGH).
5. Normal conversation (greetings, personal chat, work updates) → 0–30 (SAFE).
6. NEVER guess "safe" for ambiguous messages — escalate to Medium when uncertain.
Be precise. Always return structured output via the provided tool.`,
          },
          { role: "user", content: `Analyze this message for scam/fraud:\n"""${message}"""` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_scam_analysis",
              description: "Return a structured fraud analysis report with threat-first scoring.",
              parameters: {
                type: "object",
                properties: {
                  scam_score: { type: "integer", minimum: 0, maximum: 100, description: "0-30 safe, 31-70 medium, 71-100 high. Bias toward detection." },
                  risk_level: { type: "string", enum: ["Safe", "Medium", "High"] },
                  scam_type: {
                    type: "string",
                    enum: ["Phishing", "OTP Fraud", "Prize Scam", "Malicious Link", "Job Scam", "Investment Scam", "Romance Scam", "Tech Support Scam", "Normal Message", "Unknown"],
                  },
                  explanation: { type: "string", description: "2-3 sentences explaining the threat assessment." },
                  suspicious_keywords: { type: "array", items: { type: "string" } },
                  confidence: { type: "integer", minimum: 0, maximum: 100 },
                },
                required: ["scam_score", "risk_level", "scam_type", "explanation", "suspicious_keywords", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_scam_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway failed");
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");
    const ai = JSON.parse(toolCall.function.arguments);

    // THREAT-FIRST hybrid: take MAX of AI and rules (never average down a threat)
    let finalScore = Math.max(ai.scam_score ?? 0, ruleScore);

    // Hard floors based on rule category — never let AI under-score a clear threat
    if (ruleCategory === "OTP Fraud") finalScore = Math.max(finalScore, 85);
    else if (ruleCategory === "Phishing") finalScore = Math.max(finalScore, 80);
    else if (ruleCategory === "Prize Scam") finalScore = Math.max(finalScore, 75);
    else if (ruleCategory === "Job Scam") finalScore = Math.max(finalScore, 65);
    else if (ruleCategory === "Malicious Link" && urlCount > 0) finalScore = Math.max(finalScore, 60);

    finalScore = Math.min(100, Math.max(0, Math.round(finalScore)));

    // Threshold mapping per spec: 0–30 Safe, 31–70 Medium, 71–100 High
    const finalRisk: "Safe" | "Medium" | "High" =
      finalScore >= 71 ? "High" : finalScore >= 31 ? "Medium" : "Safe";
    const color: "green" | "yellow" | "red" =
      finalRisk === "High" ? "red" : finalRisk === "Medium" ? "yellow" : "green";

    // Pick best scam_type
    let scamType: string = ai.scam_type || "Unknown";
    if (ruleCategory !== "Unknown" && (scamType === "Unknown" || scamType === "Normal Message") && finalScore > 30) {
      scamType = ruleCategory;
    }
    if (finalRisk === "Safe") scamType = "Normal Message";

    const mergedKeywords = [...new Set([...(ai.suspicious_keywords || []), ...foundKeywords])].slice(0, 15);

    const timeline = buildTimeline(finalScore, scamType);
    const action_plan = buildActionPlan(finalScore, scamType);
    const recovery_plan = buildRecoveryPlan(finalScore);
    const psychology_analysis = buildPsychologyAnalysis(message);

    // Persist — DB check constraint allows only Low/Medium/High, so map Safe -> Low for storage
    const dbRiskLevel = finalRisk === "Safe" ? "Low" : finalRisk;
    const { data: inserted, error: insErr } = await supabase
      .from("scans")
      .insert({
        user_id: userData.user.id,
        message,
        scam_score: finalScore,
        risk_level: dbRiskLevel,
        scam_type: scamType,
        explanation: ai.explanation,
        keywords: mergedKeywords,
        confidence: ai.confidence ?? 75,
      })
      .select()
      .single();

    if (insErr) {
      console.error("Insert error", insErr);
      throw new Error("Failed to save scan");
    }

    // Extended API response (schema NOT modified)
    const response = {
      id: inserted.id,
      created_at: inserted.created_at,
      message,
      risk_score: finalScore,
      scam_score: finalScore, // legacy alias for existing UI
      risk_level: finalRisk,
      color,
      scam_type: scamType,
      explanation: ai.explanation,
      keywords: mergedKeywords,
      confidence: ai.confidence ?? 75,
      timeline,
      action_plan,
      recovery_plan,
      psychology_analysis,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-message error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
