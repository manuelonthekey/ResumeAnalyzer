import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { parseResumeWithAffinda } from '../services/resumeParser.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

// Auth middleware (simplified for MVP)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

// Upload resume
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const { rawText, parsedStructure } = await parseResumeWithAffinda(filePath);

    const resume = await prisma.resume.create({
      data: {
        user_id: req.user.id,
        filename: req.file.originalname,
        raw_text: rawText,
        parsed_structure: parsedStructure,
      }
    });

    // Cleanup local file
    fs.unlinkSync(filePath);

    res.status(201).json({
      resume_id: resume.id,
      parsed_structure: parsedStructure
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's resumes
router.get('/', async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { user_id: req.user.id },
      orderBy: { uploaded_at: 'desc' }
    });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resume (cascade manual delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const resume = await prisma.resume.findFirst({
      where: { id, user_id }
    });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    // Delete associated ResumeAnalyses
    await prisma.resumeAnalysis.deleteMany({
      where: { resume_id: id }
    });

    // Fetch and delete all InterviewSessions and their InterviewFeedbackLogs
    const sessions = await prisma.interviewSession.findMany({
      where: { resume_id: id }
    });
    for (const session of sessions) {
      await prisma.interviewFeedbackLog.deleteMany({
        where: { session_id: session.id }
      });
    }
    await prisma.interviewSession.deleteMany({
      where: { resume_id: id }
    });

    // Finally, delete the resume itself
    await prisma.resume.delete({
      where: { id }
    });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
