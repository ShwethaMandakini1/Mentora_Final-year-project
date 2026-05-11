/**
 * aiController.js
 * Handles AI-related API endpoints.
 *
 * Routes:
 *   POST /api/ai/insights  — generates personalised student analytics insights
 */

const { generateInsights } = require('../ai/insightGenerator');

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

    // Guard: need at least one graded submission
    if (!gradedSubmissions || gradedSubmissions === 0) {
      return res.status(400).json({
        success: false,
        message:  'No graded submissions yet. Insights will be available once your assignments are marked.',
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