/**
 * POST /generate_syllabus
 * Body: { answers: {...} }
 * Requires Authorization: Bearer <supabase user access token>
 * Returns: { syllabus: { id, title, plan } }
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
type Env = {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const SYSTEM = `You are an expert AI coach for a 100-day learning sprint. 
Return a concise, *structured JSON* syllabus tailored to the user.
Keep it achievable and time-bounded. No prose outside JSON.`

// Basic CORS headers so browsers can call this function directly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_SCHEMA_EXAMPLE = {
  title: "100 Days of AI — Personalized Plan",
  summary: "One-paragraph overview of focus and outcomes.",
  duration_days: 100,
  weekly_hours: 7,
  tracks: [
    {
      name: "Python + FastAPI",
      objective: "Ship an API that…",
      milestones: [
        { day: 7,  title: "Scaffold FastAPI project" },
        { day: 30, title: "First deployed endpoint" }
      ],
      weeks: [
        {
          week: 1,
          theme: "Foundations",
          outcomes: ["Comfortable with venv, uv, FastAPI basics"],
          resources: [
            { type: "doc", title: "FastAPI Tutorial", url: "https://…" }
          ],
          tasks: [
            { day: 1, task: "Set up environment" },
            { day: 2, task: "Hello World route" }
          ]
        }
      ]
    }
  ],
  review_cadence: ["Day 7", "Day 30", "Day 60", "Day 90"],
  deliverables: [
    { name: "Project #1", due_day: 30 },
    { name: "Case study write-up", due_day: 100 }
  ]
}

Deno.serve(async (req) => {
  const cors = {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json",
    },
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors.headers });
  }
  try {
    const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = Deno.env.toObject() as unknown as Env
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return new Response(JSON.stringify({ error: "Server missing OPENAI_API_KEY" }), { status: 500, headers: cors.headers })
    }

    const authHeader = req.headers.get('authorization') ?? ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors.headers })

    const { answers } = await req.json()
    // Save answers (optional)
    await supabase.from('onboarding_answers').insert({ user_id: user.id, answers })

    // Compose a strict prompt (we want JSON)
    const userPrompt = {
      role: "user",
      content: [
        { type: "text", text: `Generate a syllabus as JSON following the schema of JSON_SCHEMA_EXAMPLE. 
User constraints and preferences:\n${JSON.stringify(answers, null, 2)}\n
Hard requirements:
- duration must be ${answers.duration_days ?? 100} days
- weekly_hours must be ${answers.weekly_hours ?? 7}
- include 2–3 tracks from this set when relevant: ["Python + FastAPI","Pandas","LLM frameworks","Automation (n8n/Playwright)","Frontend (Next.js/Tailwind)"]
- ensure at least 4 milestone checkpoints spread across the sprint
- keep each week to ~3–6 tasks, numbered by day
Return *only* JSON - no markdown fences.
Example schema for shape (not content):\n${JSON.stringify(JSON_SCHEMA_EXAMPLE)}`
        }
      ]
    }

    // Call OpenAI (Responses API recommended; here we use text-only response)
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [ { role: "system", content: SYSTEM }, userPrompt ],
        temperature: 0.3,
      })
    })

    if (!resp.ok) {
      const txt = await resp.text()
      console.error("OpenAI error:", txt)
      return new Response(JSON.stringify({ error: "LLM error", detail: txt }), { status: 500, headers: cors.headers })
    }

    const json = await resp.json()
    // The Responses API returns the content in json.output_text for text answers
    const raw = json.output_text ?? ""
    // Best-effort JSON parse
    let plan
    try { plan = JSON.parse(raw) } catch (_) {
      // fallback: wrap and salvage
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      plan = JSON.parse(raw.slice(start, end + 1))
    }

    // Insert syllabus
    const { data: inserted, error } = await supabase
      .from('syllabi')
      .insert({
        user_id: user.id,
        title: plan.title ?? 'Personalized Syllabus',
        plan
      })
      .select('id,title,plan')
      .single()
    if (error) throw error

    return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: "Internal error", detail: String(e?.message ?? e) }), {
      status: 500,
      headers: cors.headers
    })
  }
})


