import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import pdfRoutes from './routes/pdfRoutes.js'
import roadmapRoutes from './routes/roadmapRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/roadmaps', roadmapRoutes)
app.use('/api/roadmaps', pdfRoutes)

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const port = process.env.PORT || 5000
const mongoUri = process.env.MONGODB_URI

const start = async () => {
  if (!mongoUri) throw new Error('Missing MONGODB_URI')
  await mongoose.connect(mongoUri)
  app.listen(port, () => {
    console.log(`Server listening on ${port}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
