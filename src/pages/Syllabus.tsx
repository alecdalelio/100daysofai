import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Syllabus() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('syllabi').select('*').eq('id', id).maybeSingle()
      setData(data)
    }
    load()
  }, [id])

  if (!data) return null
  const plan = data.plan || {}

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{plan.title || data.title}</h1>
        {plan.summary && <p className="muted">{plan.summary}</p>}
        <div className="text-sm muted">
          {plan.duration_days ?? '—'} days · ~{plan.weekly_hours ?? '—'} hrs/week
        </div>
      </header>

      {Array.isArray(plan.tracks) && plan.tracks.map((t:any) => (
        <section key={t.name} className="card p-4">
          <h2 className="text-lg font-semibold">{t.name}</h2>
          {t.objective && <p className="muted mb-2">{t.objective}</p>}
          {Array.isArray(t.milestones) && (
            <div className="text-sm mb-3">
              <span className="font-medium">Milestones: </span>
              {t.milestones.map((m:any,i:number)=>(
                <span key={i} className="mr-2">{m.title} (Day {m.day})</span>
              ))}
            </div>
          )}
          {Array.isArray(t.weeks) && t.weeks.map((w:any)=>(
            <div key={w.week} className="mb-4">
              <div className="font-medium mb-1">Week {w.week}: {w.theme}</div>
              {Array.isArray(w.tasks) && (
                <ul className="list-disc pl-6 text-sm space-y-1">
                  {w.tasks.map((task:any,i:number)=>(
                    <li key={i}>Day {task.day}: {task.task}</li>
                  ))}
                </ul>
              )}
              {Array.isArray(w.resources) && w.resources.length>0 && (
                <div className="mt-2 text-sm">
                  <div className="font-medium">Resources</div>
                  <ul className="list-disc pl-6">
                    {w.resources.map((r:any,i:number)=>(
                      <li key={i}><a className="underline" href={r.url} target="_blank">{r.title}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}


