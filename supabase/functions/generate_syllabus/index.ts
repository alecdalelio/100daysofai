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
  SUPABASE_SERVICE_ROLE_KEY: string
}

const SYSTEM = `You are an expert AI coach and curriculum designer for intensive learning sprints. 
Create comprehensive, practical, and engaging learning paths with real-world projects.
Focus on hands-on building, modern best practices, and career-ready skills.
Return ONLY valid JSON with detailed, actionable content.`

// Basic CORS headers so browsers can call this function directly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_SCHEMA_EXAMPLE = {
  title: "100 Days of AI — Personalized Plan",
  summary: "Comprehensive 100-day journey building production-ready AI applications with Python, FastAPI, and modern ML frameworks. Focus on shipping real tools, mastering data workflows, and developing practical automation systems.",
  duration_days: 100,
  weekly_hours: 7,
  tracks: [
    {
      name: "Python + FastAPI Production Systems",
      objective: "Build and deploy scalable API systems with authentication, databases, monitoring, and CI/CD pipelines",
      milestones: [
        { day: 14, title: "Local development environment with Docker, FastAPI, PostgreSQL" },
        { day: 30, title: "Production API deployed with authentication and rate limiting" },
        { day: 60, title: "Multi-service system with Redis caching and background jobs" },
        { day: 90, title: "Monitoring, logging, and auto-scaling production deployment" }
      ],
      weeks: [
        {
          week: 1,
          theme: "Python Setup & FastAPI Basics",
          tasks: ["Environment setup", "First API", "Basic validation"]
        },
        {
          week: 2,
          theme: "Database Integration",
          tasks: ["PostgreSQL setup", "Data models", "CRUD operations"]
        },
        {
          week: 3,
          theme: "Authentication & Security",
          tasks: ["JWT auth", "Protected endpoints", "Error handling"]
        },
        {
          week: 4,
          theme: "API Enhancement & Testing",
          tasks: ["API versioning", "Pagination", "Comprehensive tests"]
        }
      ]
    },
    {
      name: "AI/ML Integration & Automation",
      objective: "Integrate machine learning models, vector databases, and AI services into production applications",
      milestones: [
        { day: 45, title: "RAG system with vector embeddings and semantic search" },
        { day: 75, title: "Automated data pipeline with model training and deployment" },
        { day: 100, title: "Full-stack AI application with real-time inference" }
      ],
      weeks: [
        {
          week: 5,
          theme: "Machine Learning Basics",
          tasks: ["ML environment setup", "First predictive model", "Model evaluation"]
        },
        {
          week: 6,
          theme: "Data Processing & Pipelines",
          tasks: ["Data pipelines", "Data validation", "Automated workflows"]
        },
        {
          week: 7,
          theme: "Vector Databases & RAG",
          tasks: ["Vector database setup", "Semantic search", "RAG chat interface"]
        },
        {
          week: 8,
          theme: "AI Production Deployment",
          tasks: ["Model deployment", "Real-time inference", "Monitoring systems"]
        }
      ]
    }
  ],
  review_cadence: [
    { day: 14, focus: "Development environment and first API deployment" },
    { day: 30, focus: "Production deployment with authentication and monitoring" },
    { day: 60, focus: "AI integration and vector database implementation" },
    { day: 90, focus: "Full-stack application and performance optimization" }
  ],
  deliverables: [
    { name: "Task Management API", due_day: 14, description: "Fully functional CRUD API with Docker deployment" },
    { name: "Production FastAPI System", due_day: 30, description: "Scalable API with authentication, database, and monitoring" },
    { name: "AI-Powered Knowledge Base", due_day: 60, description: "RAG system with vector search and chat interface" },
    { name: "Portfolio Application", due_day: 90, description: "Full-stack AI application with real-time features" },
    { name: "Technical Blog Series", due_day: 100, description: "4-part blog series documenting your learning journey and technical insights" }
  ],
  final_portfolio: {
    github_repos: ["fastapi-production-template", "ai-knowledge-assistant", "automated-ml-pipeline"],
    live_demos: ["Personal productivity API", "AI chat interface", "Automated data dashboard"],
    skills_acquired: ["Production FastAPI", "Vector databases", "AI/ML integration", "DevOps basics", "Technical writing"]
  }
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
  
  // OPENAI-POWERED VERSION
  try {
    const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject() as unknown as Env
    const authHeader = req.headers.get('authorization') ?? ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Prefer service role for writes when available; otherwise fall back to the authed client (RLS)
    const supabaseWriter = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : supabase

    // Try to get user for authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    const { answers } = await req.json().catch(() => ({ answers: {} }))
    console.log('=== OPENAI SYLLABUS GENERATION START ===')
    console.log('User:', user?.id || 'anonymous')
    console.log('User answers:', JSON.stringify(answers, null, 2))
    console.log('OpenAI API Key present:', !!OPENAI_API_KEY)
    
    // Streamlined prompt for faster generation
    const totalWeeks = Math.ceil((answers.duration_days ?? 100) / 7)
    const userPromptText = `Create a ${answers.duration_days ?? 100}-day learning syllabus as JSON.

User preferences: ${JSON.stringify(answers, null, 2)}

CRITICAL REQUIREMENTS:
- MUST include ALL ${totalWeeks} weeks numbered consecutively: 1,2,3,4,5,6,7,8,9,10,11,12,13,14  
- Each week: simple theme + 2-3 brief tasks (keep it concise!)
- Focus on ${answers.goals?.join(', ') || 'AI development'} 
- Experience level: ${answers.experience_level || 'intermediate'}
- IMPORTANT: Generate COMPACT content to fit all weeks - no long descriptions

Return ONLY valid JSON matching this schema:
${JSON.stringify(JSON_SCHEMA_EXAMPLE, null, 2)}`

    // If there is no OpenAI key, immediately use a simple fallback plan path
    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY missing – using fallback syllabus path")
      const simplePlan = {
        title: "100 Days of AI - Fallback Plan",
        summary: "AI-generated plan (OpenAI unavailable)",
        duration_days: answers.duration_days || 100,
        weekly_hours: answers.weekly_hours || 7,
        tracks: [
          {
            name: "Python + FastAPI",
            objective: "Build practical AI applications",
            milestones: [
              { day: 30, title: "First API deployed" },
              { day: 60, title: "AI integration complete" },
              { day: 100, title: "Portfolio ready" }
            ],
            weeks: [
              {
                week: 1,
                theme: "Getting Started",
                tasks: [
                  { day: 1, task: "Install Python and FastAPI" },
                  { day: 3, task: "Build Hello World API" },
                  { day: 5, task: "Add database connection" }
                ]
              }
            ]
          }
        ]
      }
      if (user) {
        try {
          const { data: inserted } = await supabaseWriter
            .from('syllabi')
            .insert({ user_id: user.id, title: simplePlan.title, plan: simplePlan })
            .select('id,title,plan')
            .single()
          if (inserted) {
            return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
          }
        } catch (insertErr) {
          console.warn('Fallback insert failed, returning in-memory syllabus:', insertErr)
        }
      }
      return new Response(JSON.stringify({ syllabus: { id: 'fallback-' + Date.now(), title: simplePlan.title, plan: simplePlan } }), { headers: cors.headers })
    }
    
    // Call OpenAI Chat Completions API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('OpenAI API call timeout after 120 seconds')
      controller.abort()
    }, 120000) // 120 second timeout
    
    let resp: Response | null = null
    try {
      resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [ 
            { role: "system", content: SYSTEM }, 
            { role: "user", content: userPromptText }
          ],
          temperature: 0.4,
          max_tokens: 6000,
        }),
        signal: controller.signal
      })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      console.error('OpenAI fetch error (treating as timeout/abort):', fetchErr)
      // Fallback to simple plan on abort or network error
      const simplePlan = {
        title: "100 Days of AI - Fallback Plan",
        summary: "AI-generated plan (OpenAI unavailable)",
        duration_days: answers.duration_days || 100,
        weekly_hours: answers.weekly_hours || 7,
        tracks: [
          {
            name: "Python + FastAPI",
            objective: "Build practical AI applications",
            milestones: [
              { day: 30, title: "First API deployed" },
              { day: 60, title: "AI integration complete" },
              { day: 100, title: "Portfolio ready" }
            ],
            weeks: [
              { week: 1, theme: "Getting Started", tasks: [
                { day: 1, task: "Install Python and FastAPI" },
                { day: 3, task: "Build Hello World API" },
                { day: 5, task: "Add database connection" }
              ] }
            ]
          }
        ]
      }
      if (user) {
        try {
          const { data: inserted } = await supabaseWriter
            .from('syllabi')
            .insert({ user_id: user.id, title: simplePlan.title, plan: simplePlan })
            .select('id,title,plan')
            .single()
          if (inserted) {
            return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
          }
        } catch (e) {
          console.warn('Fallback insert after abort failed; returning in-memory plan')
        }
      }
      return new Response(JSON.stringify({ syllabus: { id: 'fallback-' + Date.now(), title: simplePlan.title, plan: simplePlan } }), { headers: cors.headers })
    }
    
    clearTimeout(timeoutId)

    if (!resp || !resp.ok) {
      const txt = await resp.text()
      console.error("OpenAI API error:", resp.status, txt)
      
      // Fallback to simple plan if OpenAI fails
      const simplePlan = {
        title: "100 Days of AI - Fallback Plan",
        summary: "AI-generated plan (OpenAI unavailable)",
        duration_days: answers.duration_days || 100,
        weekly_hours: answers.weekly_hours || 7,
        tracks: [
          {
            name: "Python + FastAPI",
            objective: "Build practical AI applications",
            milestones: [
              { day: 30, title: "First API deployed" },
              { day: 60, title: "AI integration complete" },
              { day: 100, title: "Portfolio ready" }
            ],
            weeks: [
              {
                week: 1,
                theme: "Getting Started",
                tasks: [
                  { day: 1, task: "Install Python and FastAPI" },
                  { day: 3, task: "Build Hello World API" },
                  { day: 5, task: "Add database connection" }
                ]
              }
            ]
          }
        ]
      }
      
      // Save fallback plan and return
      if (user) {
        try {
          const { data: inserted } = await supabaseWriter
            .from('syllabi')
            .insert({
              user_id: user.id,
              title: simplePlan.title,
              plan: simplePlan
            })
            .select('id,title,plan')
            .single()
          if (inserted) {
            return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
          }
        } catch (e) {
          console.warn('Fallback insert failed, returning in-memory syllabus')
        }
      }
      
      return new Response(JSON.stringify({ 
        syllabus: { id: 'fallback-' + Date.now(), title: simplePlan.title, plan: simplePlan }
      }), { headers: cors.headers })
    }

    const json = await resp.json()
    const raw = json.choices?.[0]?.message?.content ?? ""
    if (!raw) {
      throw new Error("OpenAI returned empty response")
    }
    
    // Parse JSON response from OpenAI
    let plan
    try { 
      plan = JSON.parse(raw) 
    } catch (_) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in OpenAI response")
      }
      try {
        plan = JSON.parse(jsonMatch[0])
      } catch (e2) {
        throw new Error(`Failed to parse JSON: ${e2.message}`)
      }
    }

    // Validate plan has required fields
    if (!plan.title || !plan.tracks || !Array.isArray(plan.tracks)) {
      console.error("Invalid plan structure:", JSON.stringify(plan, null, 2))
      throw new Error("Generated plan is missing required fields (title, tracks)")
    }

    // AGGRESSIVE week filling - ensure ALL tracks have complete weeks
    const totalWeeks = Math.ceil((answers.duration_days ?? 100) / 7)
    console.log(`=== WEEK FILLING LOGIC START - Target: ${totalWeeks} weeks ===`)
    
    for (const track of plan.tracks) {
      if (track.weeks && Array.isArray(track.weeks)) {
        const weekNumbers = track.weeks.map(w => w.week).sort((a, b) => a - b)
        const maxWeek = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0
        
        console.log(`Track "${track.name}" currently has ${weekNumbers.length} weeks: [${weekNumbers.join(', ')}]. Max week: ${maxWeek}. Target: ${totalWeeks} weeks.`)
        
        // Always fill if we have less than total weeks, regardless of max week number
        if (weekNumbers.length < totalWeeks) {
          console.log(`🔧 FILLING MISSING WEEKS for track "${track.name}" - current: ${weekNumbers.length}, target: ${totalWeeks}`)
          
          // Find the highest week number and continue from there
          let nextWeek = maxWeek + 1
          const weeksToAdd = totalWeeks - weekNumbers.length
          
          for (let i = 0; i < weeksToAdd; i++) {
            const weekNumber = nextWeek + i
            const weekTheme = `Week ${weekNumber}: Advanced ${track.name.split(' ')[0]}`
            const basicWeek = {
              week: weekNumber,
              theme: weekTheme,
              tasks: [
                `Advanced ${track.name.toLowerCase()} techniques`,
                `Apply learned concepts to real projects`, 
                `Portfolio development and refinement`,
                `Prepare for final milestones`
              ]
            }
            track.weeks.push(basicWeek)
            console.log(`✅ Added week ${weekNumber} to track "${track.name}": ${weekTheme}`)
          }
          
          // Sort weeks by number
          track.weeks.sort((a, b) => a.week - b.week)
          console.log(`✅ Track "${track.name}" now has ${track.weeks.length} weeks after filling`)
        } else {
          console.log(`✅ Track "${track.name}" already has sufficient weeks (${weekNumbers.length}/${totalWeeks})`)
        }
      } else {
        // Track has no weeks at all - create all weeks
        console.log(`🔧 Track "${track.name}" has NO weeks - creating all ${totalWeeks} weeks`)
        track.weeks = []
        
        for (let week = 1; week <= totalWeeks; week++) {
          const weekTheme = `Week ${week}: ${track.name} Fundamentals`
          const basicWeek = {
            week,
            theme: weekTheme,
            tasks: [
              `Learn ${track.name.toLowerCase()} concepts`,
              `Practice with hands-on exercises`,
              `Build portfolio components`,
              `Review and prepare for next week`
            ]
          }
          track.weeks.push(basicWeek)
        }
        console.log(`✅ Created all ${totalWeeks} weeks for track "${track.name}"`)
      }
    }
    
    console.log(`=== WEEK FILLING LOGIC END ===`)

    // Log final week counts for verification
    for (const track of plan.tracks) {
      if (track.weeks && Array.isArray(track.weeks)) {
        const weekCount = track.weeks.length
        const weekNumbers = track.weeks.map(w => w.week).sort((a, b) => a - b)
        console.log(`FINAL: Track "${track.name}" has ${weekCount} weeks: ${weekNumbers.join(', ')}`)
      }
    }
    
    console.log("Generated AI plan with auto-filled weeks:", JSON.stringify(plan, null, 2))

    if (user) {
      // Save to database using service role to bypass RLS
      const { data: inserted, error } = await supabaseWriter
        .from('syllabi')
        .insert({
          user_id: user.id,
          title: plan.title,
          plan: plan
        })
        .select('id,title,plan')
        .single()
        
      if (error) {
        console.error('Database insert error:', error)
        throw error
      }

      return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
    } else {
      // Return simple response for anonymous users
      const demoSyllabus = {
        id: 'demo-' + Date.now(),
        title: plan.title,
        plan: plan
      }
      return new Response(JSON.stringify({ syllabus: demoSyllabus }), { headers: cors.headers })
    }
    
  } catch (e) {
    console.error('Function error:', e)
    return new Response(JSON.stringify({ 
      error: "Generation failed", 
      detail: String(e?.message ?? e).slice(0, 200)
    }), {
      status: 500,
      headers: cors.headers
    })
  }
  
  // COMMENTED OUT THE OPENAI VERSION FOR NOW
  /*
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

    // Try to get user, but don't require authentication for now
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Auth attempt:', { hasAuthHeader: !!authHeader, userError: userError?.message, hasUser: !!user })
    
    if (!user) {
      console.log('No authenticated user, proceeding without auth')
      // For now, we'll create a demo response instead of requiring auth
      const demoSyllabus = {
        id: 'demo-' + Math.random().toString(36).substr(2, 9),
        title: "Demo 100 Days of AI Plan",
        plan: {
          title: "Demo 100 Days of AI Plan",
          summary: "A demo learning path - please sign up for personalized plans",
          duration_days: 100,
          weekly_hours: 7,
          tracks: [{
            name: "Python + FastAPI",
            objective: "Demo track",
            weeks: []
          }]
        }
      }
      return new Response(JSON.stringify({ syllabus: demoSyllabus }), { headers: cors.headers })
    }
    
    console.log('Authenticated user:', user.id)

    const { answers } = await req.json()
    // Save answers (optional)
    await supabase.from('onboarding_answers').insert({ user_id: user.id, answers })

    // Compose a strict prompt (we want JSON)
    const userPromptText = `Generate a syllabus as JSON following this exact schema.

User constraints and preferences:
${JSON.stringify(answers, null, 2)}

Hard requirements:
- duration must be exactly ${answers.duration_days ?? 100} days
- weekly_hours must be exactly ${answers.weekly_hours ?? 7}
- include 2-3 tracks from: ["Python + FastAPI","Pandas","LLM frameworks","Automation (n8n/Playwright)","Frontend (Next.js/Tailwind)"]
- ensure at least 4 milestone checkpoints spread across the sprint
- keep each week to 3-6 tasks, numbered by day

CRITICAL: Return ONLY valid JSON. No explanations, no markdown fences, no extra text.

Required JSON schema (adapt content but keep this structure):
${JSON.stringify(JSON_SCHEMA_EXAMPLE, null, 2)}`

    // Call OpenAI Chat Completions API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('OpenAI API call timeout after 120 seconds')
      controller.abort()
    }, 120000) // 120 second timeout
    
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [ 
          { role: "system", content: SYSTEM }, 
          { role: "user", content: userPromptText }
        ],
        temperature: 0.4,
        max_tokens: 6000,
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!resp.ok) {
      const txt = await resp.text()
      console.error("OpenAI API error:", resp.status, txt)
      return new Response(JSON.stringify({ 
        error: `OpenAI API error (${resp.status})`, 
        detail: txt.slice(0, 200) 
      }), { status: 500, headers: cors.headers })
    }

    const json = await resp.json()
    // Chat Completions API returns the content in choices[0].message.content
    const raw = json.choices?.[0]?.message?.content ?? ""
    if (!raw) {
      throw new Error("OpenAI returned empty response")
    }
    
    // Best-effort JSON parse
    let plan
    try { 
      plan = JSON.parse(raw) 
    } catch (_) {
      // fallback: extract JSON from markdown fences or mixed content
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in OpenAI response")
      }
      try {
        plan = JSON.parse(jsonMatch[0])
      } catch (e2) {
        throw new Error(`Failed to parse JSON: ${e2.message}`)
      }
    }

    // Validate plan has required fields
    if (!plan.title || !plan.tracks || !Array.isArray(plan.tracks)) {
      console.error("Invalid plan structure:", JSON.stringify(plan, null, 2))
      throw new Error("Generated plan is missing required fields (title, tracks)")
    }

    console.log("Generated plan:", JSON.stringify(plan, null, 2))

    // Insert syllabus
    const { data: inserted, error } = await supabase
      .from('syllabi')
      .insert({
        user_id: user.id,
        title: plan.title,
        description: plan.summary || 'AI Learning Syllabus',
        topics: plan.tracks.map(t => t.name),
        duration_weeks: Math.ceil((plan.duration_days || 100) / 7),
        difficulty_level: answers.experience_level || 'intermediate',
        plan
      })
      .select('id,title,plan')
      .single()
    if (error) {
      console.error("Database insert error:", error)
      throw error
    }

    return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
  } catch (e) {
    console.error("Edge function error:", e)
    
    // If it's a JSON parsing error or OpenAI issue, provide a fallback
    if (String(e?.message).includes("parse") || String(e?.message).includes("OpenAI")) {
      try {
        const { answers: fallbackAnswers } = await req.json().catch(() => ({ answers: {} }))
        
        // Create a basic fallback syllabus
        const fallbackPlan = {
          title: "100 Days of AI - Basic Plan",
          summary: "A foundational learning path for AI development",
          duration_days: fallbackAnswers.duration_days || 100,
          weekly_hours: fallbackAnswers.weekly_hours || 7,
          tracks: [
            {
              name: "Python + FastAPI",
              objective: "Build API development skills",
              milestones: [
                { day: 30, title: "First API deployed" },
                { day: 60, title: "Database integration" },
                { day: 90, title: "Production ready" }
              ],
              weeks: Array.from({ length: Math.ceil((fallbackAnswers.duration_days || 100) / 7) }, (_, i) => ({
                week: i + 1,
                theme: `Week ${i + 1} - Building foundations`,
                tasks: [
                  { day: i * 7 + 1, task: "Study core concepts" },
                  { day: i * 7 + 3, task: "Practice with examples" },
                  { day: i * 7 + 5, task: "Build small project" }
                ]
              }))
            }
          ]
        }
        
        // Re-create supabase client with proper auth for fallback
        const authHeader = req.headers.get('authorization') ?? ''
        const fallbackSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } }
        })
        
        const { data: { user: fallbackUser } } = await fallbackSupabase.auth.getUser()
        if (!fallbackUser) throw new Error('No user in fallback')
        
        const { data: inserted, error } = await fallbackSupabase
          .from('syllabi')
          .insert({
            user_id: fallbackUser.id,
            title: fallbackPlan.title,
            description: fallbackPlan.summary,
            topics: fallbackPlan.tracks.map(t => t.name),
            duration_weeks: Math.ceil((fallbackAnswers.duration_days || 100) / 7),
            difficulty_level: fallbackAnswers.experience_level || 'intermediate',
            plan: fallbackPlan
          })
          .select('id,title,plan')
          .single()
          
        if (!error) {
          console.log("Used fallback syllabus")
          return new Response(JSON.stringify({ syllabus: inserted }), { headers: cors.headers })
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
    }
    
    return new Response(JSON.stringify({ 
      error: "Generation failed", 
      detail: String(e?.message ?? e).slice(0, 200)
    }), {
      status: 500,
      headers: cors.headers
    })
  }
  */
})


