import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import resumeRoutes from './routes/resumes.js';
import analysisRoutes from './routes/analysis.js';
import interviewRoutes from './routes/interviews.js';
import feedbackRoutes from './routes/feedback.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase body size limit for base64 uploads

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/profile', profileRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
