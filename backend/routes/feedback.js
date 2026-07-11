import express from 'express';
import { PrismaClient } from '@prisma/client';
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

// Get overall feedback summary
router.get('/summary', async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { user_id: req.user.id, ended_at: { not: null } },
      orderBy: { started_at: 'asc' } // chronologically
    });

    if (sessions.length === 0) {
      return res.json({
        total_sessions: 0,
        avg_score: 0,
        improvement_trend: [],
        common_weaknesses: []
      });
    }

    const totalScore = sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0);
    const avgScore = Math.round(totalScore / sessions.length);
    const improvement_trend = sessions.map(s => ({ date: s.started_at, score: s.overall_score }));

    // Extract common weaknesses from the latest sessions
    let allWeaknesses = [];
    sessions.slice(-3).forEach(s => {
      if (s.feedback_summary && s.feedback_summary.key_weaknesses) {
        allWeaknesses.push(...s.feedback_summary.key_weaknesses);
      }
    });

    res.json({
      total_sessions: sessions.length,
      avg_score: avgScore,
      improvement_trend,
      common_weaknesses: allWeaknesses.slice(0, 5) // just take top 5
    });
  } catch (error) {
    console.error('Feedback summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
