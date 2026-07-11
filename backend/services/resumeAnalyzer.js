import axios from 'axios';
import dotenv from 'dotenv';
import { computeAtsScore } from '../utils/atsScorer.js';
import { extractJSON } from '../utils/jsonParser.js';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Primary free model — fast and reliable
const MODEL = 'openrouter/free';

async function callOpenRouter(messages, maxTokens = 1500, temperature = 0.5) {
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
 * Build a compact, token-efficient resume summary for prompts.
 * We use keywords from parsed structure rather than raw JSON dump.
 */
function buildResumeSummary(parsed) {
  if (!parsed) return 'No resume data available.';
  const p = parsed.personal || {};
  const edu = (parsed.education || []).map(e =>
    `${e.degree} ${e.field ? 'in ' + e.field : ''} @ ${e.institution} (${e.year_end || 'N/A'})`
  ).join('; ');

  const exp = (parsed.experience || []).map(e =>
    `${e.title} @ ${e.company} [${e.duration_start || ''} - ${e.duration_end || 'Present'}]: ${
      e.keywords?.slice(0, 8).join(', ') || e.description?.substring(0, 120) || ''
    }`
  ).join('\n');

  const skills = parsed.skills || {};
  const allSkills = [
    ...(skills.languages || []),
    ...(skills.frameworks || []),
    ...(skills.tools || []),
    ...(skills.other || []),
    ...(skills.all || [])
  ];
  const uniqueSkills = [...new Set(allSkills)].filter(Boolean).join(', ');
  const expKw = (skills.experience_keywords || []).slice(0, 20).join(', ');

  const projects = (parsed.projects || []).map(p =>
    `${p.name}: ${p.keywords?.slice(0, 6).join(', ') || p.description?.substring(0, 100) || ''}`
  ).join('; ');

  return `Name: ${p.name}
Education: ${edu || 'N/A'}
Experience:
${exp || 'N/A'}
Skills: ${uniqueSkills || expKw || 'N/A'}
Projects: ${projects || 'N/A'}`;
}

export async function analyzeResume(parsedResume, jdText) {
  const resumeSummary = buildResumeSummary(parsedResume);

  const systemPrompt = `You are an expert resume reviewer. Analyze the resume and return ONLY valid JSON with no markdown, no explanation. Be specific and actionable.`;

  const userPrompt = `Resume Summary:
${resumeSummary}

${jdText ? `Job Description:\n${jdText.substring(0, 1500)}` : 'No job description provided.'}

Return this exact JSON (no markdown fences, just raw JSON):
{
  "overall_rating": 7,
  "summary": "2-3 sentence overall assessment",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["area 1", "area 2"],
  "suggestions": [
    {"section": "experience", "suggestion": "Add quantified impact numbers"},
    {"section": "skills", "suggestion": "Group by category"}
  ],
  "ats_keywords_missing": ["keyword1", "keyword2"]
}`;

  try {
    const text = await callOpenRouter(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      1200,
      0.4
    );

    const analysis = parseJSON(text, 'analyzeResume');

    // ATS score via local keyword matching
    let jd_match_score = null;
    if (jdText && parsedResume) {
      const resumeText = JSON.stringify(parsedResume);
      jd_match_score = computeAtsScore(resumeText, jdText) / 100;
    }
    analysis.jd_match_score = jd_match_score;
    return analysis;
  } catch (error) {
    console.error('analyzeResume error:', error.response?.data || error.message);
    throw new Error(`AI review failed: ${error.message}`);
  }
}
