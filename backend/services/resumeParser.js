import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AFFINDA_API_KEY = process.env.AFFINDA_API_KEY;
const AFFINDA_COLLECTION_ID = process.env.AFFINDA_COLLECTION_ID;
const AFFINDA_BASE_URL = 'https://api.affinda.com/v3';

export async function parseResumeWithAffinda(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('Uploaded file not found on disk.');
  if (!AFFINDA_COLLECTION_ID) throw new Error('AFFINDA_COLLECTION_ID is missing from .env. Run: node setup/initAffinda.js');

  const fileBuffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', fileBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });
  form.append('collection', AFFINDA_COLLECTION_ID);

  let documentIdentifier;
  try {
    const uploadResponse = await axios.post(
      `${AFFINDA_BASE_URL}/documents`,
      form,
      {
        headers: { ...form.getHeaders(), 'Authorization': `Bearer ${AFFINDA_API_KEY}` },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    documentIdentifier = uploadResponse.data.meta?.identifier || uploadResponse.data.identifier;
    if (!documentIdentifier) throw new Error('No document identifier returned by Affinda.');
    console.log(`📄 Affinda document uploaded: ${documentIdentifier}`);
  } catch (error) {
    const detail = error.response?.data;
    throw new Error(`Affinda upload failed (${error.response?.status}): ${JSON.stringify(detail) || error.message}`);
  }

  const affindaDoc = await waitForProcessing(documentIdentifier);
  const data = affindaDoc?.data || {};
  const rawText = data.rawText || '';
  const parsedStructure = normalizeAffindaOutput(data, rawText);

  return { rawText, parsedStructure };
}

async function waitForProcessing(documentId, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await axios.get(
      `${AFFINDA_BASE_URL}/documents/${documentId}`,
      { headers: { 'Authorization': `Bearer ${AFFINDA_API_KEY}` } }
    );
    const doc = response.data;
    const isReady = doc.meta?.isReady ?? doc.meta?.ready ?? !!doc.data;
    if (isReady && doc.data) {
      console.log(`✅ Affinda parsing complete after ${attempt + 1} attempt(s)`);
      return doc;
    }
    console.log(`⏳ Affinda parsing... (attempt ${attempt + 1}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Affinda parsing timed out after 60 seconds.');
}

function safeStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.raw) return String(val.raw).trim();
  if (typeof val === 'object' && val.parsed) return String(val.parsed).trim();
  return String(val).trim();
}

/**
 * Extract meaningful keywords from free-text descriptions
 * Instead of returning whole sentences, pull out noun/verb chunks
 */
function extractKeywordsFromText(text) {
  if (!text) return [];
  const stopWords = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with',
    'by','from','up','about','into','through','during','is','was','are',
    'were','be','been','being','have','has','had','do','does','did','will',
    'would','could','should','may','might','shall','can','need','dare','ought',
    'used','able','i','we','you','he','she','they','it','its','my','our',
    'your','his','her','their','this','that','these','those','as','if','when',
    'where','while','who','which','what','how','then','than','so','yet','both',
    'each','more','most','other','some','such','no','nor','not','only','own',
    'same','very','just','also','well','new','across','within','using','via',
    'across','various','multiple','several','many','including'
  ]);
  // split on whitespace/punctuation, filter short and stopwords
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 3 && !stopWords.has(w));
  return [...new Set(words)]; // deduplicate
}

function normalizeAffindaOutput(data, rawText) {
  // -- SKILLS --
  // Affinda returns skills as array of {name, type, sources, ...}
  // We group by type but also collect everything as a flat "all" list
  const allSkills = (data.skills || []);
  
  const languages = [];
  const frameworks = [];
  const tools = [];
  const other = [];

  for (const s of allSkills) {
    const name = safeStr(s.name || s);
    if (!name) continue;
    const type = (s.type || '').toLowerCase();
    if (['programming language', 'language', 'programming_language'].includes(type)) {
      languages.push(name);
    } else if (['framework', 'library', 'framework/library'].includes(type)) {
      frameworks.push(name);
    } else if (['tool', 'software', 'platform', 'database'].includes(type)) {
      tools.push(name);
    } else {
      other.push(name);
    }
  }

  // If Affinda didn't type the skills, extract from raw text as fallback
  // Also extract keywords from experience and project descriptions
  const experienceKeywords = (data.workExperience || [])
    .flatMap(e => extractKeywordsFromText(safeStr(e.jobDescription)))
    .filter(Boolean);
  
  const projectKeywords = (data.projects || [])
    .flatMap(p => extractKeywordsFromText(safeStr(p.description)))
    .filter(Boolean);

  // -- EXPERIENCE with keyword extraction --
  const experience = (data.workExperience || []).map(exp => {
    const description = safeStr(exp.jobDescription);
    return {
      title: safeStr(exp.jobTitle),
      company: safeStr(exp.organization),
      duration_start: safeStr(exp.dates?.startDate) || safeStr(exp.startDate),
      duration_end: safeStr(exp.dates?.endDate) || safeStr(exp.endDate),
      description,
      // Bullet keywords extracted from the description
      keywords: extractKeywordsFromText(description).slice(0, 15),
      achievements: [],
    };
  });

  // -- PROJECTS with keyword extraction --
  const projects = (data.projects || []).map(p => {
    const description = safeStr(p.description);
    return {
      name: safeStr(p.name || p.title),
      description,
      keywords: extractKeywordsFromText(description).slice(0, 10),
      technologies: Array.isArray(p.technologies) ? p.technologies.map(safeStr) : [],
      link: safeStr(p.link || p.url),
    };
  });

  return {
    personal: {
      name: safeStr(data.name),
      email: safeStr(data.emails?.[0]) || safeStr(data.email),
      phone: safeStr(data.phoneNumbers?.[0]) || safeStr(data.phoneNumber),
      location: safeStr(data.location?.formatted) || safeStr(data.location?.rawInput) || safeStr(data.location),
      links: [
        ...(data.linkedin ? [{ type: 'linkedin', url: safeStr(data.linkedin) }] : []),
        ...(data.github ? [{ type: 'github', url: safeStr(data.github) }] : []),
        ...(data.websites || []).map(w => ({ type: 'website', url: safeStr(w) })),
      ],
    },
    education: (data.education || []).map(edu => ({
      degree: safeStr(edu.accreditation?.education) || safeStr(edu.qualification),
      field: safeStr(edu.accreditation?.educationLevel) || safeStr(edu.fieldOfStudy),
      institution: safeStr(edu.organization),
      year_end: edu.dates?.completionDate
        ? new Date(edu.dates.completionDate).getFullYear()
        : (edu.completionDate ? new Date(edu.completionDate).getFullYear() : null),
      cgpa: safeStr(edu.grade?.raw) || safeStr(edu.grade) || null,
    })),
    experience,
    skills: {
      languages,
      frameworks,
      tools,
      other,
      // Combined deduplicated flat list — most useful for ATS / display
      all: [...new Set([...languages, ...frameworks, ...tools, ...other])],
      // Keywords from descriptions — contextual, not just skill names
      experience_keywords: [...new Set(experienceKeywords)].slice(0, 40),
      project_keywords: [...new Set(projectKeywords)].slice(0, 30),
    },
    projects,
  };
}
