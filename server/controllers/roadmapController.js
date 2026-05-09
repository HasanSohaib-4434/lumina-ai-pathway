import { GoogleGenAI } from '@google/genai'
import Roadmap from '../models/Roadmap.js'

const stripMarkdownCodeFence = (s) => {
  if (!s) return ''
  const trimmed = String(s).trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (match) return match[1].trim()
  return trimmed
}

const extractJsonObject = (s) => {
  const str = stripMarkdownCodeFence(s)
  const start = str.indexOf('{')
  const end = str.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return str.slice(start, end + 1)
}

const normalizeRoadmap = (obj) => {
  const title = typeof obj?.title === 'string' ? obj.title.trim() : ''
  const description = typeof obj?.description === 'string' ? obj.description.trim() : ''
  const levels = Array.isArray(obj?.levels)
    ? obj.levels
        .filter((l) => l && typeof l === 'object')
        .map((l) => ({
          title: typeof l.title === 'string' ? l.title.trim() : '',
          tasks: Array.isArray(l.tasks) ? l.tasks : [],
          resources: Array.isArray(l.resources) ? l.resources : [],
        }))
        .filter((l) => l.title)
    : []
  if (!title || !levels.length) return null
  return { title, description, levels }
}

export const generateRoadmap = async (req, res) => {
  try {
    const { goal, duration } = req.body || {}
    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) return res.status(400).json({ error: 'Goal is required' })
    if (!duration || typeof duration !== 'string' || !duration.trim()) return res.status(400).json({ error: 'Duration is required' })
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

    const ai = new GoogleGenAI({ apiKey })
    const system = [
      'Return ONLY a raw JSON object with no markdown and no extra text.',
      'The JSON must match exactly this shape:',
      '{ "title": string, "description": string, "levels": [{ "title": string, "tasks": [string], "resources": [string] }] }',
      'Rules:',
      '- levels must be ordered from beginner to advanced',
      '- each level must have 5-12 concrete tasks',
      '- resources must be useful and practical and be plain strings',
      '- keep descriptions concise and actionable',
    ].join('\n')

    const user = [`Goal: ${goal.trim()}`, `Duration: ${duration.trim()}`].join('\n')

    const resp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        { role: 'user', parts: [{ text: `${system}\n\n${user}` }] },
      ],
      config: { temperature: 0.4 },
    })

    const content = stripMarkdownCodeFence(resp?.text || '')
    const candidate = extractJsonObject(content) || content
    let parsed = null
    try {
      parsed = JSON.parse(candidate)
    } catch {
      return res.status(502).json({ error: 'AI returned invalid JSON' })
    }

    const normalized = normalizeRoadmap(parsed)
    if (!normalized) return res.status(502).json({ error: 'AI returned an unexpected structure' })

    const doc = await Roadmap.create(normalized)
    return res.json(doc.toObject())
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}
