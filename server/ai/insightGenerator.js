/**
 * insightGenerator.js
 * Uses Groq API to generate personalised student analytics insights.
 */

const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(data) {
  const {
    overallAverage,
    totalSubmissions,
    gradedSubmissions,
    modules = [],
    skills  = [],
    improvement,
  } = data;

  const moduleLines = modules.length > 0
    ? modules.map(m => `  - ${m.module}: avg ${m.averageScore}% (${m.grade})`).join('\n')
    : '  - No module data yet';

  const skillLines = skills.length > 0
    ? skills.map(s => `  - ${s.skill}: ${s.percentage}%`).join('\n')
    : '  - No rubric skill data yet';

  const improvementLine = improvement === null
    ? 'Not enough submissions to calculate improvement trend.'
    : improvement > 0
      ? `Performance has improved by ${improvement}% compared to earlier submissions.`
      : improvement < 0
        ? `Performance has declined by ${Math.abs(improvement)}% compared to earlier submissions.`
        : 'Performance is stable across submissions.';

  return `
You are an academic advisor AI for a university submission platform called Mentora.

A student has the following academic performance data:

Overall Average: ${overallAverage}%
Total Submissions: ${totalSubmissions} (${gradedSubmissions} graded)

Module Performance:
${moduleLines}

Skill Assessment (rubric criteria scores):
${skillLines}

Improvement Trend: ${improvementLine}

Based on this data, generate three short, personalised, encouraging academic insights:
1. Strength – Highlight what the student is doing well.
2. Improvement – Identify one area to focus on with a concrete suggestion.
3. Motivation – A brief motivational message relevant to their progress.

Respond ONLY with a valid JSON object in exactly this format (no markdown, no backticks, no extra text):
{
  "strength": {
    "title": "short title (max 6 words)",
    "message": "2-3 sentence insight"
  },
  "improvement": {
    "title": "short title (max 6 words)",
    "message": "2-3 sentence insight with a concrete suggestion"
  },
  "motivation": {
    "title": "short title (max 6 words)",
    "message": "1-2 sentence motivational message"
  }
}
`.trim();
}

async function generateInsights(performanceData) {
  const prompt = buildPrompt(performanceData);

  const response = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    max_tokens:  600,
    temperature: 0.7,
    messages:    [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0]?.message?.content || '';

  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      strength: {
        title:   'Keep up the good work',
        message: 'You are making steady progress with your submissions. Keep engaging with the material.',
      },
      improvement: {
        title:   'Room to grow',
        message: 'Focus on addressing rubric criteria carefully. Reading the assignment brief in detail before starting can improve your scores.',
      },
      motivation: {
        title:   'You are on the right track',
        message: 'Every submission is a step forward. Stay consistent and your grades will reflect your effort.',
      },
    };
  }

  return parsed;
}

module.exports = { generateInsights };