import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { callFn } from '../lib/supabase'

type Answers = {
  experience_level: 'beginner'|'intermediate'|'advanced'
  goals: string[]
  weekly_hours: number
  duration_days: number
  focus_areas: string[]
  output_preferences: string[]
  note?: string
}

const GOAL_OPTIONS = [
  'Ship 2–5 publishable AI‑native tools',
  'Improve Python + FastAPI',
  'Master Pandas + data workflows',
  'Learn LLM frameworks (LangChain/LlamaIndex)',
  'Automation (n8n, Playwright, agents)',
  'Frontend polish (Next.js/Tailwind/MDX)',
]

const FOCUS_OPTIONS = [
  'Python + FastAPI','Pandas','LLM frameworks',
  'Automation (n8n/Playwright)','Frontend (Next.js/Tailwind)','Vector DBs',
]

export default function Onboarding() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Answers>({
    experience_level: 'intermediate',
    goals: [],
    weekly_hours: 7,
    duration_days: 100,
    focus_areas: [],
    output_preferences: ['docs','code-first'],
    note: ''
  })

  // Let ProtectedRoute gate auth; if still loading, show a lightweight placeholder
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="card p-6 animate-pulse">Preparing onboarding…</div>
      </div>
    )
  }
  // Do not block on session; ProtectedRoute already ensures auth

  async function submit() {
    setSubmitting(true)
    try {
      const start = Date.now()
      const { syllabus } = await callFn<{ syllabus: { id: string } }>('generate_syllabus', {
        body: { answers },
        token: session.access_token,
        timeoutMs: 90000,
      })
      if (!syllabus?.id) throw new Error('Function returned no syllabus ID')
      console.debug('Syllabus generated in', Date.now() - start, 'ms')
      navigate(`/syllabus/${syllabus.id}`)
    } catch (e) {
      const msg = (e as any)?.message ?? 'Something went wrong'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create your personalized syllabus</h1>

      {step === 1 && (
        <section className="card p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1">Your current level</label>
            <select
              className="w-full border rounded p-2"
              value={answers.experience_level}
              onChange={(e)=>setAnswers(a=>({...a, experience_level: e.target.value as any}))}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Your goals</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(g=>(
                <button
                  key={g}
                  type="button"
                  onClick={()=>setAnswers(a=>({...a, goals: a.goals.includes(g) ? a.goals.filter(x=>x!==g) : [...a.goals,g]}))}
                  className={`px-3 py-1.5 rounded-full border text-sm ${answers.goals.includes(g) ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'btn-secondary'}`}
                >{g}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Weekly hours</label>
              <input type="number" min={2} max={30} className="w-full border rounded p-2"
                value={answers.weekly_hours}
                onChange={(e)=>setAnswers(a=>({...a, weekly_hours: Number(e.target.value)}))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Duration (days)</label>
              <select className="w-full border rounded p-2"
                value={answers.duration_days}
                onChange={(e)=>setAnswers(a=>({...a, duration_days: Number(e.target.value)}))}
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn btn-primary focus-ring" onClick={()=>setStep(2)}>Next</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card p-4 space-y-4">
          <div>
            <label className="block text-sm mb-2">Focus areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(f=>(
                <button key={f} type="button"
                  onClick={()=>setAnswers(a=>({...a, focus_areas: a.focus_areas.includes(f)? a.focus_areas.filter(x=>x!==f) : [...a.focus_areas,f]}))}
                  className={`px-3 py-1.5 rounded-full border text-sm ${answers.focus_areas.includes(f) ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'btn-secondary'}`}
                >{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Learning style notes (optional)</label>
            <textarea className="w-full border rounded p-2" rows={4}
              placeholder="Prefer code-first tasks, short docs, minimal videos…"
              value={answers.note ?? ''}
              onChange={(e)=>setAnswers(a=>({...a, note: e.target.value}))}
            />
          </div>
          <div className="flex justify-between">
            <button className="btn btn-secondary focus-ring" onClick={()=>setStep(1)}>Back</button>
            <button className="btn btn-primary focus-ring" onClick={()=>setStep(3)}>Next</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card p-4 space-y-4">
          <h2 className="text-lg font-medium">Review</h2>
          <pre className="text-xs overflow-auto p-3 rounded bg-gray-50 dark:bg-gray-900">{JSON.stringify(answers, null, 2)}</pre>
          <div className="flex justify-between">
            <button className="btn btn-secondary focus-ring" onClick={()=>setStep(2)}>Back</button>
            <button className="btn btn-primary focus-ring" onClick={submit} disabled={submitting}>
              {submitting ? 'Generating…' : 'Generate syllabus'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}


