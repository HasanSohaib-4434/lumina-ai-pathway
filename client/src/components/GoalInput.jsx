import { Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

const GoalInput = ({ loading, onSubmit }) => {
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState('8 weeks')

  const canSubmit = useMemo(() => goal.trim().length > 2 && !loading, [goal, loading])

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ goal: goal.trim(), duration })
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-3">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to achieve?"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-700"
          />
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none ring-0 focus:border-zinc-700"
          >
            <option value="2 weeks">2 weeks</option>
            <option value="4 weeks">4 weeks</option>
            <option value="8 weeks">8 weeks</option>
            <option value="12 weeks">12 weeks</option>
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-950 transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating…' : 'Generate Path'}
        </button>
      </form>
    </div>
  )
}

export default GoalInput
