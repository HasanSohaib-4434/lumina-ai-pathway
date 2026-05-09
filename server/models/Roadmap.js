import mongoose from 'mongoose'

const LevelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tasks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    resources: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false },
)

const RoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  levels: { type: [LevelSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Roadmap', RoadmapSchema)
