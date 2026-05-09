import { useState } from 'react'
import GoalInput from './components/GoalInput.jsx'
import RoadmapView from './components/RoadmapView.jsx'

const App = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [pdfReady, setPdfReady] = useState(false)
  const [pdfFilename, setPdfFilename] = useState('')
  const [pdfChunkCount, setPdfChunkCount] = useState(0)
  const [askMessages, setAskMessages] = useState([])
  const [askInput, setAskInput] = useState('')
  const [askSending, setAskSending] = useState(false)

  const resetPdfState = () => {
    setPdfUploading(false)
    setPdfError('')
    setPdfReady(false)
    setPdfFilename('')
    setPdfChunkCount(0)
    setAskMessages([])
    setAskInput('')
  }

  const generate = async ({ goal, duration }) => {
    setLoading(true)
    setError('')
    setRoadmap(null)
    resetPdfState()
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

  const roadmapId = roadmap?._id ? String(roadmap._id) : ''

  const handlePdfFile = async (file) => {
    if (!roadmapId || !file) return
    setPdfUploading(true)
    setPdfError('')
    setPdfReady(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/roadmaps/${roadmapId}/pdf`, { method: 'POST', body: fd })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : null
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      setPdfReady(true)
      setPdfFilename(data?.filename || file.name)
      setPdfChunkCount(Number(data?.chunkCount) || 0)
    } catch (e) {
      setPdfError(e?.message || 'Upload failed')
      setPdfReady(false)
    } finally {
      setPdfUploading(false)
    }
  }

  const handleAskSubmit = async () => {
    const q = askInput.trim()
    if (!q || !roadmapId || askSending || !pdfReady) return
    setAskMessages((m) => [...m, { role: 'user', content: q }])
    setAskInput('')
    setAskSending(true)
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/pdf/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : null
      if (!res.ok) throw new Error(data?.error || 'Query failed')
      setAskMessages((m) => [...m, { role: 'assistant', content: data?.reply || '' }])
    } catch (e) {
      setAskMessages((m) => [...m, { role: 'assistant', content: e?.message || 'Error' }])
    } finally {
      setAskSending(false)
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
        {roadmap ? (
          <RoadmapView
            roadmap={roadmap}
            roadmapId={roadmapId}
            pdfUploading={pdfUploading}
            pdfError={pdfError}
            pdfReady={pdfReady}
            pdfFilename={pdfFilename}
            pdfChunkCount={pdfChunkCount}
            onPdfFile={handlePdfFile}
            askMessages={askMessages}
            askInput={askInput}
            onAskInputChange={setAskInput}
            onAskSubmit={handleAskSubmit}
            askSending={askSending}
          />
        ) : null}
      </div>
    </div>
  )
}

export default App
