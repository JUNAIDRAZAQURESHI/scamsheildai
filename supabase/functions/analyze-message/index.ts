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

function ruleBasedAnalysis(message: string) {
  const lower = message.toLowerCase();
  const found: string[] = [];
  let score = 0;

  for (const kw of SCAM_KEYWORDS) {
    if (lower.includes(kw)) {
      found.push(kw);
      score += 5;
    }
  }
  for (const w of URGENCY_WORDS) if (lower.includes(w)) score += 4;
  for (const w of THREAT_WORDS) if (lower.includes(w)) score += 8;

  const urls = message.match(URL_REGEX) || [];
  score += urls.length * 10;
  if (urls.some((u) => /bit\.ly|tinyurl|t\.co/i.test(u))) score += 15;

  if (/\b\d{4,6}\b/.test(message) && /otp|code|verify/i.test(message)) score += 20;
  if (message.length < 30 && urls.length > 0) score += 10;

  return { ruleScore: Math.min(score, 100), foundKeywords: [...new Set(found)] };
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

    const { ruleScore, foundKeywords } = ruleBasedAnalysis(message);

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
              "You are a cybersecurity expert specializing in scam, phishing and fraud detection. Analyze the user's message and return STRICT structured output via the provided tool. Be precise and concise.",
          },
          { role: "user", content: `Analyze this message:\n"""${message}"""` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_scam_analysis",
              description: "Return a structured fraud analysis report.",
              parameters: {
                type: "object",
                properties: {
                  scam_score: { type: "integer", minimum: 0, maximum: 100 },
                  risk_level: { type: "string", enum: ["Low", "Medium", "High"] },
                  scam_type: {
                    type: "string",
                    enum: ["Phishing", "OTP Fraud", "Job Scam", "Prize Scam", "Investment Scam", "Romance Scam", "Tech Support Scam", "Unknown", "Legitimate"],
                  },
                  explanation: { type: "string", description: "1-2 sentence human explanation" },
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

    // Hybrid score: 70% AI, 30% rules — but always escalate
    const hybridScore = Math.round(
      Math.max(ai.scam_score * 0.7 + ruleScore * 0.3, Math.max(ai.scam_score, ruleScore) * 0.85)
    );
    const finalScore = Math.min(100, Math.max(0, hybridScore));

    const finalRisk =
      finalScore >= 70 ? "High" : finalScore >= 40 ? "Medium" : "Low";

    const mergedKeywords = [...new Set([...(ai.suspicious_keywords || []), ...foundKeywords])].slice(0, 15);

    const result = {
      scam_score: finalScore,
      risk_level: finalRisk,
      scam_type: ai.scam_type,
      explanation: ai.explanation,
      suspicious_keywords: mergedKeywords,
      confidence: ai.confidence,
    };

    const { data: inserted, error: insErr } = await supabase
      .from("scans")
      .insert({
        user_id: userData.user.id,
        message,
        scam_score: result.scam_score,
        risk_level: result.risk_level,
        scam_type: result.scam_type,
        explanation: result.explanation,
        keywords: result.suspicious_keywords,
        confidence: result.confidence,
      })
      .select()
      .single();

    if (insErr) {
      console.error("Insert error", insErr);
      throw new Error("Failed to save scan");
    }

    return new Response(JSON.stringify({ ...result, id: inserted.id, created_at: inserted.created_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-message error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
