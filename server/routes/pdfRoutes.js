import express from 'express'
import multer from 'multer'
import { queryPdfForRoadmap, uploadPdfForRoadmap } from '../controllers/pdfController.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

const router = express.Router()

router.post('/:roadmapId/pdf', upload.single('file'), uploadPdfForRoadmap)
router.post('/:roadmapId/pdf/query', express.json(), queryPdfForRoadmap)

export default router
