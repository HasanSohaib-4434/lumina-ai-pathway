import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen,
  CheckCircle2,
  FileUp,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  Milestone,
  Send,
  X,
} from 'lucide-react'

const asArray = (v) => (Array.isArray(v) ? v : [])

const RoadmapView = ({
  roadmap,
  roadmapId,
  pdfUploading,
  pdfError,
  pdfReady,
  pdfFilename,
  pdfChunkCount,
  onPdfFile,
  askMessages,
  askInput,
  onAskInputChange,
  onAskSubmit,
  askSending,
}) => {
  const { title, description, levels } = roadmap || {}
  const fileRef = useRef(null)
  const [chatOpen, setChatOpen] = useState(false)

  const onPickPdf = (e) => {
    const f = e.target.files?.[0]
    if (f) onPdfFile(f)
    e.target.value = ''
  }

  return (
    <div className="relative mt-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">{title || 'Roadmap'}</div>
            {description ? <div className="mt-2 text-sm text-zinc-400">{description}</div> : null}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
              <Milestone className="h-4 w-4" />
              Timeline
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onPickPdf} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pdfUploading || !roadmapId}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pdfUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {pdfUploading ? 'Indexing PDF…' : 'Upload PDF'}
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-600/50 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-500 hover:bg-sky-500/20"
              >
                <MessageCircle className="h-4 w-4" />
                Ask PDF
              </button>
            </div>
            {pdfError ? <div className="max-w-xs text-right text-xs text-red-400">{pdfError}</div> : null}
            {pdfReady ? (
              <div className="text-right text-xs text-emerald-400">
                Indexed {pdfChunkCount} chunks{pdfFilename ? ` · ${pdfFilename}` : ''}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-8 grid gap-6">
          {asArray(levels).map((level, idx) => (
            <div key={`${level?.title || 'level'}-${idx}`} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">{level?.title || `Level ${idx + 1}`}</div>
                </div>
              </div>
              {asArray(level?.tasks).length ? (
                <div className="grid gap-2">
                  {asArray(level?.tasks).map((t, ti) => (
                    <div key={`${idx}-t-${ti}`} className="flex items-start gap-2 text-sm text-zinc-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <div>{typeof t === 'string' ? t : t?.title || ''}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {asArray(level?.resources).length ? (
                <div className="grid gap-2 pt-1">
                  {asArray(level?.resources).map((r, ri) => {
                    const label = typeof r === 'string' ? r : r?.title || r?.name || ''
                    const url = typeof r === 'object' ? r?.url : ''
                    return (
                      <div key={`${idx}-r-${ri}`} className="flex items-start gap-2 text-sm text-zinc-300">
                        <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                        {url ? (
                          <a className="underline decoration-zinc-700 underline-offset-4 hover:decoration-zinc-400" href={url} target="_blank" rel="noreferrer">
                            {label || url}
                          </a>
                        ) : (
                          <div>{label}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {createPortal(
        <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
          {chatOpen ? (
            <div className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                  <MessageCircle className="h-4 w-4 text-sky-400" />
                  Ask PDF
                </div>
                <button type="button" onClick={() => setChatOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-3 text-sm">
                {!pdfReady ? (
                  <div className="text-zinc-500">Upload a PDF first to search its contents.</div>
                ) : null}
                {askMessages.map((m, i) => (
                  <div key={`${i}-${m.role}`} className={`rounded-xl px-3 py-2 ${m.role === 'user' ? 'ml-6 bg-sky-500/15 text-sky-100' : 'mr-6 bg-zinc-900 text-zinc-300'}`}>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                ))}
                {askSending ? (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </div>
                ) : null}
              </div>
              <form
                className="flex gap-2 border-t border-zinc-800 p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  onAskSubmit()
                }}
              >
                <input
                  value={askInput}
                  onChange={(e) => onAskInputChange(e.target.value)}
                  placeholder="Ask about your PDF…"
                  disabled={!pdfReady || askSending}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-700 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!pdfReady || askSending || !askInput.trim()}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white p-2 text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/50 ring-2 ring-sky-500/30 transition hover:border-sky-500/50 hover:text-sky-300"
            aria-label="Toggle Ask PDF"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default RoadmapView
