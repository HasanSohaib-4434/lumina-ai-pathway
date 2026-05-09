import mongoose from 'mongoose'

const ChunkVectorSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    vector: { type: [Number], required: true },
  },
  { _id: false },
)

const PdfKnowledgeSchema = new mongoose.Schema({
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
    unique: true,
  },
  filename: { type: String, default: '' },
  chunks: { type: [ChunkVectorSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('PdfKnowledge', PdfKnowledgeSchema)
