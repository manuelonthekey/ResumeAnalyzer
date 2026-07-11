import { distance } from 'fastest-levenshtein';

export function computeAtsScore(resumeText, jdText) {
  if (!jdText) return null;

  const resumeLower = resumeText.toLowerCase();
  const jdKeywords = extractKeywords(jdText);
  
  if (jdKeywords.length === 0) return 0;

  let matchedCount = 0;
  const resumeKeywords = extractKeywords(resumeText);

  for (const jdKeyword of jdKeywords) {
    // Try exact match first (fast path)
    if (resumeKeywords.includes(jdKeyword)) {
      matchedCount++;
      continue;
    }

    // Try fuzzy match for typos/variants
    for (const resumeKeyword of resumeKeywords) {
      const similarity = stringSimilarity(jdKeyword, resumeKeyword);
      if (similarity >= 0.85) {  // 85% match threshold
        matchedCount++;
        break;  // only count once per JD keyword
      }
    }
  }

  // Weight by keyword importance
  const importantKeywords = ['python', 'javascript', 'react', 'nodejs', 'postgresql', 'aws'];
  let weightedMatches = 0;
  let totalWeight = 0;

  for (const keyword of jdKeywords) {
    const weight = importantKeywords.includes(keyword) ? 1.5 : 1.0;
    totalWeight += weight;
    
    if (resumeKeywords.includes(keyword)) {
      weightedMatches += weight;
    }
  }

  const score = totalWeight > 0 ? (weightedMatches / totalWeight) * 100 : 0;
  return Math.min(Math.round(score), 100);
}

export function extractKeywords(text) {
  const stopwords = new Set(['the', 'a', 'and', 'or', 'in', 'on', 'at', 'to', 'from', 'of', 'is', 'are', 'with', 'for', 'this', 'that', 'have', 'but', 'not']);
  const words = text
    .toLowerCase()
    .match(/\b[a-z0-9_+#.]+\b/g) || [];
  
  return [...new Set(words.filter(w => w.length >= 3 && !stopwords.has(w)))];
}

function stringSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = distance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}
