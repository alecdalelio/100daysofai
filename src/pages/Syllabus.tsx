import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { queryDirectly } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export default function Syllabus() {
  const { id } = useParams()
  const { session } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        console.log('[Syllabus] Loading syllabus with ID:', id)
        console.log('[Syllabus] Using direct query to bypass hanging Supabase client')
        
        const data = await queryDirectly('syllabi', {
          select: '*',
          eq: { column: 'id', value: id || '' },
          limit: 1,
          timeoutMs: 10000,
          token: session?.access_token
        })
        
        console.log('[Syllabus] Direct query result:', data)
        
        if (!data || data.length === 0) {
          console.log('[Syllabus] No data found in database, showing fallback')
          // Show fallback if no data found
          setData({
            id,
            title: "100 Days of AI - Fallback Plan",
            plan: fallbackPlan
          })
        } else {
          console.log('[Syllabus] Setting syllabus data:', data[0])
          setData(data[0])
        }
      } catch (err) {
        console.error('[Syllabus] Load error:', err)
        console.log('[Syllabus] Using fallback plan due to error')
        // Use fallback on error
        setData({
          id,
          title: "100 Days of AI - Fallback Plan", 
          plan: fallbackPlan
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      load()
    }
  }, [id])

  // Fallback plan definition
  const fallbackPlan = {
    title: "100 Days of AI - Quick Start",
    summary: "A streamlined learning path for AI development", 
    duration_days: 100,
    weekly_hours: 7,
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
          },
          {
            week: 2,
            theme: "Building Your First API",
            tasks: [
              { day: 8, task: "Create user authentication endpoints" },
              { day: 10, task: "Add data validation with Pydantic" },
              { day: 12, task: "Implement basic CRUD operations" }
            ]
          }
        ]
      }
    ]
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-center">
          <p>Loading syllabus...</p>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-center text-red-600">
          <p>Error loading syllabus</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-center">
          <p>Syllabus not found</p>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
      </div>
    )
  }

  const plan = data.plan || {}

  const downloadPDF = async () => {
    // TODO: Implement PDF generation
    console.log('PDF download requested for:', data.id)
    alert('PDF download coming soon! For now, you can copy the syllabus content.')
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{plan.title}</h1>
          {plan.summary && <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">{plan.summary}</p>}
          <div className="text-sm text-gray-500 mt-2">
            {plan.duration_days ?? '—'} days · ~{plan.weekly_hours ?? '—'} hrs/week
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={downloadPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            📄 Download Full Syllabus PDF
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            🖨️ Print Overview
          </button>
        </div>
      </header>

      {/* Key Deliverables */}
      {Array.isArray(plan.deliverables) && plan.deliverables.length > 0 && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Key Deliverables</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {plan.deliverables.map((d, i) => (
              <div key={i} className="border-l-4 border-indigo-500 pl-4">
                <div className="font-medium">{d.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Due: Day {d.due_day}</div>
                {d.description && <div className="text-sm mt-1">{d.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Learning Tracks Overview */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">📚 Learning Tracks</h2>
        <div className="space-y-4">
          {Array.isArray(plan.tracks) && plan.tracks.map((track, i) => (
            <div key={i} className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg">{track.name}</h3>
              {track.objective && <p className="text-gray-600 dark:text-gray-300 mb-2">{track.objective}</p>}
              
              {/* Milestones */}
              {Array.isArray(track.milestones) && (
                <div className="text-sm mb-2">
                  <span className="font-medium">Key Milestones: </span>
                  {track.milestones.map((m, j) => (
                    <span key={j} className="inline-block mr-3 mb-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      Day {m.day}: {m.title}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Week Count */}
              {Array.isArray(track.weeks) && (
                <div className="text-sm text-gray-500">
                  {track.weeks.length} weeks of structured learning
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Review Schedule */}
      {Array.isArray(plan.review_cadence) && plan.review_cadence.length > 0 && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">📅 Review Schedule</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {plan.review_cadence.map((review, i) => (
              <div key={i} className="border-l-4 border-blue-500 pl-4">
                <div className="font-medium">Day {review.day}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{review.focus}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="text-center text-gray-500 text-sm">
        <p>This is a preview. Download the PDF for complete daily tasks and resources.</p>
      </div>
    </div>
  )
}


