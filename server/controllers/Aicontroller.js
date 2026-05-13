/**
 * aiController.js
 * Handles AI-related API endpoints.
 *
 * Routes:
 *   POST /api/ai/insights         — generates personalised student analytics insights
 *   POST /api/ai/marking-feedback — generates lecturer feedback text based on rubric scores
 */

const { generateInsights } = require('../ai/insightGenerator');
const Groq = require('groq-sdk');

// ── POST /api/ai/insights ─────────────────────────────────────────────────────
exports.getInsights = async (req, res) => {
  try {
    const {
      overallAverage,
      totalSubmissions,
      gradedSubmissions,
      modules,
      skills,
      improvement,
    } = req.body;

    if (!gradedSubmissions || gradedSubmissions === 0) {
      return res.status(400).json({
        success: false,
        message: 'No graded submissions yet. Insights will be available once your assignments are marked.',
      });
    }

    const insights = await generateInsights({
      overallAverage:    overallAverage    ?? 0,
      totalSubmissions:  totalSubmissions  ?? 0,
      gradedSubmissions: gradedSubmissions ?? 0,
      modules:           modules           ?? [],
      skills:            skills            ?? [],
      improvement:       improvement       ?? null,
    });

    res.json({ success: true, insights });
  } catch (err) {
    console.error('AI INSIGHTS ERROR:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate insights. Please try again.' });
  }
};

// ── POST /api/ai/marking-feedback ─────────────────────────────────────────────
// Called by LecturerMarking.jsx "Generate AI Feedback" button.
// Receives the rubric criteria + lecturer scores and returns a
// professionally written feedback paragraph for the student.
exports.markingFeedback = async (req, res) => {
  try {
    const {
      studentName,
      assignmentName,
      moduleName,
      rubric,       // [{ criterion, maxScore }]
      scores,       // { [criterion]: score }
      pct,          // final percentage
      grade,        // final letter grade
    } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!assignmentName) {
      return res.status(400).json({ success: false, message: 'assignmentName is required.' });
    }
    if (!rubric || rubric.length === 0) {
      return res.status(400).json({ success: false, message: 'Rubric criteria are required.' });
    }

    // ── Build rubric breakdown text for the prompt ────────────────────────
    const rubricLines = rubric.map(r => {
      const scored  = scores?.[r.criterion];
      const scoreVal = (scored !== undefined && scored !== '') ? Number(scored) : 0;
      const maxVal   = Number(r.maxScore) || 0;
      const pctVal   = maxVal > 0 ? Math.round((scoreVal / maxVal) * 100) : 0;
      return `  • ${r.criterion}: ${scoreVal}/${maxVal} (${pctVal}%)`;
    }).join('\n');

    // ── Build the prompt ──────────────────────────────────────────────────
    const prompt = `You are an experienced academic lecturer writing formal feedback for a student's assignment submission.

Assignment: "${assignmentName}"
Module: ${moduleName || 'N/A'}
Student: ${studentName || 'Student'}
Overall Score: ${pct ?? 0}% — Grade: ${grade || 'N/A'}

Rubric scores awarded:
${rubricLines}

Write 3–4 paragraphs of constructive, professional academic feedback for this student. Your feedback must:
1. Open with an overall impression of the work referencing the grade earned.
2. Highlight specific strengths based on criteria where the student scored well (above 70%).
3. Clearly explain areas that need improvement for criteria with lower scores, with actionable advice.
4. Close with encouragement and a forward-looking suggestion.

Rules:
- Write in second person ("Your work...", "You have demonstrated...").
- Be specific — reference actual criterion names from the rubric.
- Keep a formal but supportive academic tone.
- Do NOT mention the numerical scores directly in the feedback text.
- Output only the feedback paragraphs — no headings, no bullet points, no preamble.`;

    // ── Call Groq API (same model used by gradeService) ─────────────────
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages:    [{ role: 'user', content: prompt }],
      model:       'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens:  1000,
    });

    const feedback = completion.choices[0]?.message?.content?.trim() || '';

    if (!feedback) {
      return res.status(500).json({ success: false, message: 'AI returned an empty response. Please try again.' });
    }

    res.json({ success: true, feedback });
  } catch (err) {
    console.error('AI MARKING FEEDBACK ERROR:', err.message);
    res.status(500).json({
      success: false,
      message: err.message?.includes('auth') || err.message?.includes('API')
        ? 'AI service error. Please check GROQ_API_KEY in your .env file.'
        : 'Failed to generate feedback. Please try again.',
    });
  }
};