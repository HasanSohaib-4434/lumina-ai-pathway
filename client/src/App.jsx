import { useState } from 'react'
import GoalInput from './components/GoalInput.jsx'
import RoadmapView from './components/RoadmapView.jsx'

const App = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roadmap, setRoadmap] = useState(null)

  const generate = async ({ goal, duration }) => {
    setLoading(true)
    setError('')
    setRoadmap(null)
    try {
      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, duration }),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : null
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      setRoadmap(data)
    } catch (e) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">AI Roadmap Architect</h1>
          <p className="mt-2 text-sm text-zinc-400">Generate a structured learning path with levels, tasks, and resources.</p>
        </div>
        <GoalInput loading={loading} onSubmit={generate} />
        {error ? <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</div> : null}
        {roadmap ? <RoadmapView roadmap={roadmap} /> : null}
      </div>
    </div>
  )
}

export default App
