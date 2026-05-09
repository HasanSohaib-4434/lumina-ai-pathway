import { BookOpen, CheckCircle2, Link as LinkIcon, Milestone } from 'lucide-react'

const asArray = (v) => (Array.isArray(v) ? v : [])

const RoadmapView = ({ roadmap }) => {
  const { title, description, levels } = roadmap || {}

  return (
    <div className="mt-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">{title || 'Roadmap'}</div>
            {description ? <div className="mt-2 text-sm text-zinc-400">{description}</div> : null}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
            <Milestone className="h-4 w-4" />
            Timeline
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
    </div>
  )
}

export default RoadmapView
