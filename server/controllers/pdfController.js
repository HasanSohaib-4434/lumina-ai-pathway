import axios from 'axios'
import FormData from 'form-data'
import mongoose from 'mongoose'
import PdfKnowledge from '../models/PdfKnowledge.js'
import Roadmap from '../models/Roadmap.js'

const aiBase = () => process.env.AI_SERVICE_URL || 'http://localhost:8000'

export const uploadPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const exists = await Roadmap.exists({ _id: roadmapId })
    if (!exists) return res.status(404).json({ error: 'Roadmap not found' })
    if (!req.file?.buffer) return res.status(400).json({ error: 'PDF file required' })

    const form = new FormData()
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'document.pdf',
      contentType: req.file.mimetype || 'application/pdf',
    })

    const { data } = await axios.post(`${aiBase()}/process-pdf`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    })

    const { chunks, embeddings, filename } = data || {}
    if (!Array.isArray(chunks) || !Array.isArray(embeddings)) {
      return res.status(502).json({ error: 'Invalid AI service response' })
    }
    if (chunks.length !== embeddings.length) {
      return res.status(502).json({ error: 'Chunk and embedding count mismatch' })
    }

    const bundle = chunks.map((text, i) => ({
      text: String(text),
      vector: embeddings[i].map((n) => Number(n)),
    }))

    const doc = await PdfKnowledge.findOneAndUpdate(
      { roadmapId },
      {
        roadmapId,
        filename: filename || req.file.originalname || '',
        chunks: bundle,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    return res.json({
      ok: true,
      chunkCount: doc.chunks.length,
      filename: doc.filename,
      roadmapId: String(doc.roadmapId),
    })
  } catch (e) {
    const d = e?.response?.data?.detail
    let msg = e?.message || 'Upload failed'
    if (typeof d === 'string') msg = d
    else if (Array.isArray(d)) msg = d.map((x) => x?.msg || JSON.stringify(x)).join(' ')
    else if (d && typeof d === 'object') msg = JSON.stringify(d)
    const code = typeof e?.response?.status === 'number' ? e.response.status : 500
    return res.status(code).json({ error: msg })
  }
}

export const queryPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : ''
    if (!question) return res.status(400).json({ error: 'question is required' })

    const doc = await PdfKnowledge.findOne({ roadmapId })
    if (!doc || !doc.chunks?.length) {
      return res.status(404).json({ error: 'No PDF indexed for this roadmap' })
    }

    const chunkTexts = doc.chunks.map((c) => c.text)
    const embRows = doc.chunks.map((c) => c.vector)

    const { data } = await axios.post(
      `${aiBase()}/search`,
      {
        query: question,
        chunks: chunkTexts,
        embeddings: embRows,
        top_k: 5,
      },
      { timeout: 60000 },
    )

    const matches = Array.isArray(data?.matches) ? data.matches : []
    const reply = matches.length
      ? matches.map((m) => m.text || '').filter(Boolean).join('\n\n---\n\n')
      : 'No relevant passages found.'

    return res.json({ matches, reply })
  } catch (e) {
    const d = e?.response?.data?.detail
    let msg = e?.message || 'Search failed'
    if (typeof d === 'string') msg = d
    else if (Array.isArray(d)) msg = d.map((x) => x?.msg || JSON.stringify(x)).join(' ')
    else if (d && typeof d === 'object') msg = JSON.stringify(d)
    const code = typeof e?.response?.status === 'number' ? e.response.status : 500
    return res.status(code).json({ error: msg })
  }
}
