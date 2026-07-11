import express from 'express';
import { PrismaClient } from '@prisma/client';
import { analyzeResume } from '../services/resumeAnalyzer.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

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

function hash(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

async function analyzeResumeWithRetry(resume, jd, maxRetries = 2) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await analyzeResume(resume, jd);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // exponential backoff
    }
  }
}

// Request analysis
router.post('/analyze', async (req, res) => {
  const { resume_id, jd_text } = req.body;
  const user_id = req.user.id;

  try {
    const jd_text_hash = hash(jd_text);

    // Check if analysis already cached
    const cached = await prisma.resumeAnalysis.findFirst({
      where: { resume_id, jd_text_hash }
    });
    if (cached && cached.analysis_result) {
      return res.json(cached);
    }

    // Fetch resume
    const resume = await prisma.resume.findFirst({
      where: { id: resume_id, user_id }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Call OpenRouter with timeout + retry
    let analysis;
    try {
      analysis = await analyzeResumeWithRetry(
        resume.parsed_structure,
        jd_text,
        2
      );
    } catch (error) {
      return res.status(502).json({ 
        error: 'Analysis service temporarily unavailable',
        fallback: { summary: 'Unable to analyze at this moment. Try again in 30 seconds.' }
      });
    }

    // Save to DB
    const savedAnalysis = await prisma.resumeAnalysis.create({
      data: {
        resume_id,
        jd_text: jd_text || null,
        jd_text_hash,
        analysis_result: analysis,
        ats_score: analysis.jd_match_score !== null ? Math.round(analysis.jd_match_score * 100) : null
      }
    });

    res.json(savedAnalysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analyses for a resume
router.get('/:resume_id', async (req, res) => {
  try {
    // Verify ownership
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.resume_id, user_id: req.user.id }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const analyses = await prisma.resumeAnalysis.findMany({
      where: { resume_id: req.params.resume_id },
      orderBy: { generated_at: 'desc' }
    });

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
