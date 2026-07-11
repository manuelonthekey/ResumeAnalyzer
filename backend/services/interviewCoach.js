import axios from 'axios';
import { extractJSON } from '../utils/jsonParser.js';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'openrouter/free';

async function callOpenRouter(messages, maxTokens = 1200, temperature = 0.5) {
  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    { model: MODEL, messages, temperature, max_tokens: maxTokens },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ResumeFlow'
      },
      timeout: 60000
    }
  );
  return response.data.choices[0].message.content;
}

function parseJSON(text, label) {
  const json = extractJSON(text);
  if (!json) {
    console.error(`[${label}] Failed to parse JSON from output:`, text);
    throw new Error(`Failed to parse JSON from ${label}`);
  }
  return json;
}

/**
 * Build a compact resume context for interview prompts.
 * Focuses on experience keywords and skills — what interviewers actually ask about.
 */
function buildInterviewContext(parsed) {
  if (!parsed) return 'Candidate resume not available.';
  const p = parsed.personal || {};
  
  const exp = (parsed.experience || []).map(e =>
    `• ${e.title} @ ${e.company}: ${e.keywords?.slice(0, 8).join(', ') || e.description?.substring(0, 100) || ''}`
  ).join('\n');

  const skills = parsed.skills || {};
  const allSkills = [...new Set([
    ...(skills.languages || []),
    ...(skills.frameworks || []),
    ...(skills.tools || []),
    ...(skills.other || []),
    ...(skills.all || [])
  ])].filter(Boolean).join(', ');

  const projects = (parsed.projects || []).map(p =>
    `• ${p.name}: ${p.keywords?.slice(0, 6).join(', ') || p.description?.substring(0, 80) || ''}`
  ).join('\n');

  const edu = (parsed.education || []).map(e =>
    `${e.degree} ${e.field ? '(' + e.field + ')' : ''} @ ${e.institution}`
  ).join('; ');

  return `Candidate: ${p.name || 'Unknown'}
Education: ${edu || 'N/A'}
Skills: ${allSkills || 'N/A'}
Experience:
${exp || 'N/A'}
Projects:
${projects || 'N/A'}`;
}

export async function generateInterviewQuestion(resumeStructure, sessionType, questionNumber, previousAnswers = []) {
  const resumeContext = buildInterviewContext(resumeStructure);

  const previousContext = previousAnswers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer?.substring(0, 100)}`)
    .join('\n\n');

  const typeGuidance = {
    behavioral: 'Ask about specific situations from their work experience using STAR method (Situation, Task, Action, Result). Reference their actual job titles/companies.',
    technical: 'Ask a technical question directly tied to their listed skills and tech stack. Test depth of understanding.',
    pm: 'Ask a product management question about prioritization, metrics, or product decisions relevant to their background.'
  }[sessionType] || 'Ask a relevant interview question based on their background.';

  const systemPrompt = `You are a senior interviewer conducting a ${sessionType} interview. Return ONLY the question — no preamble, no numbering, no explanation.`;

  const userPrompt = `${resumeContext}

Prior conversation:
${previousContext || '(first question — set the stage)'}

Instructions: ${typeGuidance}
Generate question #${questionNumber}. Make it specific to this candidate's actual experience. ONLY return the question text.`;

  try {
    let question = await callOpenRouter(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      200,
      0.75
    );
    // Clean up any unwanted prefixes models sometimes add
    question = question
      .replace(/^(Question\s*#?\d*:?\s*|Q\d+:?\s*|")/i, '')
      .replace(/"$/, '')
      .trim();
    return question;
  } catch (error) {
    console.error('generateInterviewQuestion error:', error.response?.data || error.message);
    throw new Error(`Failed to generate question: ${error.message}`);
  }
}

export async function generateFeedbackOnAnswer(question, userAnswer, resumeContext, sessionType) {
  const systemPrompt = `You are an expert ${sessionType} interviewer evaluating a candidate's answer. Return ONLY valid JSON — no markdown fences, no explanation.`;

  const userPrompt = `Question: "${question}"
Answer: "${userAnswer?.substring(0, 800)}"

Evaluate the answer on these criteria:
- Clarity and structure (STAR method for behavioral, correctness for technical)
- Specificity (does it reference real experience?)  
- Depth and completeness

Return this JSON exactly:
{
  "score": 72,
  "strengths": ["clear structure", "referenced specific project"],
  "weaknesses": ["missing quantified results", "too brief"],
  "suggestion": "One concrete tip to improve this answer next time",
  "follow_up_question": "A natural follow-up question based on their answer"
}`;

  try {
    const text = await callOpenRouter(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      800,
      0.4
    );
    return parseJSON(text, 'generateFeedbackOnAnswer');
  } catch (error) {
    console.error('generateFeedbackOnAnswer error:', error.response?.data || error.message);
    throw new Error(`Feedback generation failed: ${error.message}`);
  }
}

export async function generateSessionSummary(logs) {
  if (!logs || logs.length === 0) {
    return {
      overall_summary: 'No answers were recorded in this session.',
      key_strengths: [],
      key_weaknesses: [],
      action_items: ['Complete at least one question in your next session']
    };
  }

  const systemPrompt = `You are an expert interviewer giving a final debrief. Return ONLY valid JSON.`;

  const avgScore = Math.round(
    logs.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / logs.length
  );

  const history = logs.map(l =>
    `Q${l.question_number}: ${l.question_text}\nAnswer: ${l.user_answer?.substring(0, 200) || '(no answer)'}\nScore: ${l.confidence_score || 0}/100`
  ).join('\n\n');

  const userPrompt = `Session transcript:
${history}

Average score: ${avgScore}/100

Provide a final debrief. Return this JSON exactly:
{
  "overall_summary": "2-3 sentence holistic assessment of the session",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "key_weaknesses": ["weakness 1", "weakness 2"],
  "action_items": ["specific action 1", "specific action 2", "specific action 3"]
}`;

  try {
    const text = await callOpenRouter(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      1200,
      0.4
    );
    return parseJSON(text, 'generateSessionSummary');
  } catch (error) {
    console.error('generateSessionSummary error:', error.response?.data || error.message);
    throw new Error(`Summary generation failed: ${error.message}`);
  }
}
