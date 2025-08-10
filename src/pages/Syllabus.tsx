import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { queryDirectly } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import jsPDF from 'jspdf'

export default function Syllabus() {
  const { id } = useParams()
  const { session } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

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
    setDownloadingPDF(true)
    try {
      const doc = new jsPDF()
    const plan = data.plan || {}
    
    // Set up basic styling
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    
    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(plan.title || 'Learning Syllabus', margin, yPosition)
    yPosition += 15
    
    // Summary
    if (plan.summary) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const summaryLines = doc.splitTextToSize(plan.summary, maxWidth)
      doc.text(summaryLines, margin, yPosition)
      yPosition += summaryLines.length * 5 + 10
    }
    
    // Duration info
    doc.setFontSize(10)
    doc.text(`${plan.duration_days || '—'} days · ~${plan.weekly_hours || '—'} hrs/week`, margin, yPosition)
    yPosition += 15
    
    // Deliverables
    if (Array.isArray(plan.deliverables) && plan.deliverables.length > 0) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Key Deliverables', margin, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      plan.deliverables.forEach((d) => {
        const text = `• ${d.name} (Day ${d.due_day})`
        doc.text(text, margin + 5, yPosition)
        yPosition += 6
        if (d.description) {
          const descLines = doc.splitTextToSize(d.description, maxWidth - 10)
          doc.text(descLines, margin + 10, yPosition)
          yPosition += descLines.length * 4 + 3
        }
      })
      yPosition += 10
    }
    
    // Learning Tracks
    if (Array.isArray(plan.tracks)) {
      plan.tracks.forEach((track, trackIndex) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(track.name, margin, yPosition)
        yPosition += 8
        
        if (track.objective) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          const objLines = doc.splitTextToSize(track.objective, maxWidth)
          doc.text(objLines, margin, yPosition)
          yPosition += objLines.length * 4 + 8
        }
        
        // Milestones
        if (Array.isArray(track.milestones)) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('Milestones:', margin, yPosition)
          yPosition += 6
          
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          track.milestones.forEach((m) => {
            doc.text(`• Day ${m.day}: ${m.title}`, margin + 5, yPosition)
            yPosition += 5
          })
          yPosition += 5
        }
        
        // Weeks
        if (Array.isArray(track.weeks)) {
          track.weeks.forEach((week) => {
            // Check if we need a new page
            if (yPosition > 240) {
              doc.addPage()
              yPosition = 20
            }
            
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(`Week ${week.week}: ${week.theme}`, margin, yPosition)
            yPosition += 8
            
            // Tasks
            if (Array.isArray(week.tasks)) {
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              week.tasks.forEach((task) => {
                const taskText = typeof task === 'string' ? task : (task.task || `Day ${task.day}: ${task.task}`)
                const taskLines = doc.splitTextToSize(`• ${taskText}`, maxWidth - 10)
                doc.text(taskLines, margin + 5, yPosition)
                yPosition += taskLines.length * 4 + 1
              })
              yPosition += 3
            }
            
            // Resources
            if (Array.isArray(week.resources) && week.resources.length > 0) {
              doc.setFontSize(8)
              doc.setFont('helvetica', 'italic')
              doc.text('Resources:', margin + 5, yPosition)
              yPosition += 4
              
              week.resources.forEach((resource) => {
                doc.text(`• ${resource.title}`, margin + 10, yPosition)
                yPosition += 4
              })
              yPosition += 3
            }
          })
        }
        
        yPosition += 10
      })
    }
    
    // Save the PDF
    const filename = `${plan.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'syllabus'}.pdf`
    doc.save(filename)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setDownloadingPDF(false)
    }
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
            disabled={downloadingPDF}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium"
          >
            {downloadingPDF ? '📄 Generating PDF...' : '📄 Download Full Syllabus PDF'}
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


