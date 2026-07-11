import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInterviewQuestion, generateFeedbackOnAnswer, generateSessionSummary } from '../services/interviewCoach.js';
import jwt from 'jsonwebtoken';

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

// Start an interview session
router.post('/start', async (req, res) => {
  const { resume_id, session_type } = req.body;
  const user_id = req.user.id;

  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resume_id, user_id }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const session = await prisma.interviewSession.create({
      data: {
        resume_id,
        user_id,
        session_type,
        question_count: 0
      }
    });

    // Generate first question
    const first_question = await generateInterviewQuestion(
      resume.parsed_structure,
      session_type,
      1,
      []
    );

    res.status(201).json({
      session_id: session.id,
      first_question
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Answer a question and get feedback + next question
router.post('/:session_id/answer', async (req, res) => {
  const { session_id } = req.params;
  const { question_number, question_text, answer } = req.body;

  try {
    const session = await prisma.interviewSession.findFirst({
      where: { id: session_id, user_id: req.user.id },
      include: { resume: true, feedback_logs: { orderBy: { question_number: 'asc' } } }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get feedback on answer
    const feedback = await generateFeedbackOnAnswer(
      question_text,
      answer,
      session.resume.parsed_structure,
      session.session_type
    );

    // Save log
    const log = await prisma.interviewFeedbackLog.create({
      data: {
        session_id,
        question_number,
        question_text,
        user_answer: answer,
        feedback,
        confidence_score: feedback.score || null
      }
    });

    // Update session
    await prisma.interviewSession.update({
      where: { id: session_id },
      data: { question_count: { increment: 1 } }
    });

    // Generate next question
    const previousAnswers = session.feedback_logs.map(l => ({
      question: l.question_text,
      answer: l.user_answer
    }));
    previousAnswers.push({ question: question_text, answer });

    const next_question = await generateInterviewQuestion(
      session.resume.parsed_structure,
      session.session_type,
      question_number + 1,
      previousAnswers
    );

    res.json({
      feedback,
      next_question
    });
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({ error: error.message });
  }
});

// End session
router.post('/:session_id/end', async (req, res) => {
  const { session_id } = req.params;

  try {
    const session = await prisma.interviewSession.findFirst({
      where: { id: session_id, user_id: req.user.id },
      include: { feedback_logs: true }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Generate summary
    const summary = await generateSessionSummary(session.feedback_logs);

    let overall_score = null;
    if (session.feedback_logs.length > 0) {
      const total = session.feedback_logs.reduce((sum, log) => sum + (log.confidence_score || 0), 0);
      overall_score = Math.round(total / session.feedback_logs.length);
    }

    const updatedSession = await prisma.interviewSession.update({
      where: { id: session_id },
      data: {
        ended_at: new Date(),
        feedback_summary: summary,
        overall_score
      }
    });

    res.json(updatedSession);
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session history
router.get('/history', async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { user_id: req.user.id },
      orderBy: { started_at: 'desc' },
      take: 10
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single session details
router.get('/:session_id', async (req, res) => {
  try {
    const session = await prisma.interviewSession.findFirst({
      where: { id: req.params.session_id, user_id: req.user.id },
      include: { feedback_logs: { orderBy: { question_number: 'asc' } } }
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
