const Groq = require('groq-sdk');

// ── Existing: Student dashboard AI insights ───────────────────────────────────
exports.getAIInsights = async (req, res) => {
  try {
    const {
      overallAverage, totalSubmissions, gradedSubmissions,
      modules, skills, improvement
    } = req.body;

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === 'your_groq_key_here') {
      return res.status(500).json({
        success: false,
        message: 'Groq API key is not configured. Please set GROQ_API_KEY in your .env file.'
      });
    }

    const groq = new Groq({ apiKey });

    const prompt = `You are an encouraging academic performance coach. Based on this student's real performance data, give short, motivating and personalised feedback.

Student data: ${JSON.stringify({ overallAverage, totalSubmissions, gradedSubmissions, modules, skills, improvement })}

Respond ONLY with a valid JSON object (no markdown, no backticks) in exactly this format:
{
  "strength": {
    "title": "short title (max 5 words)",
    "message": "1-2 sentences encouraging message about what they do well"
  },
  "improvement": {
    "title": "short title (max 5 words)",
    "message": "1-2 sentences actionable suggestion for improvement"
  },
  "motivation": {
    "title": "short title (max 5 words)",
    "message": "1-2 sentences motivational message to keep them going"
  }
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model:       'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens:  500,
    });

    const text  = chatCompletion.choices[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('Failed to parse Groq response:', clean);
      return res.status(500).json({
        success: false,
        message: 'AI returned invalid response. Please try again.'
      });
    }

    res.json({ success: true, insights: parsed });

  } catch (err) {
    console.error('AI insights error:', err.message);
    let message = 'Failed to generate AI insights. Please try again.';
    if (err.status === 401) message = 'Groq API key is invalid. Please check your .env file.';
    if (err.status === 429) message = 'Groq rate limit reached. Please wait a moment and try again.';
    res.status(500).json({ success: false, message });
  }
};

// ── NEW: Lecturer marking AI feedback ─────────────────────────────────────────
exports.generateMarkingFeedback = async (req, res) => {
  try {
    const { studentName, assignmentName, moduleName, rubric, scores, pct, grade } = req.body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_key_here') {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY not configured.' });
    }

    const groq = new Groq({ apiKey });

    const rubricLines = rubric.map(r =>
      `- ${r.criterion}: ${scores[r.criterion] || 0}/${r.maxScore}`
    ).join('\n');

    const prompt = `You are an academic lecturer. Generate structured feedback for this student submission.

Student: ${studentName}
Assignment: ${assignmentName}
Module: ${moduleName}
Rubric scores:
${rubricLines}
Total: ${pct}% (${grade})

Return feedback in this exact format:
• Overall Performance Summary
• [2-3 sentences summarizing overall performance]

• Rubric Criterion Analysis:
${rubric.map(r => `• ${r.criterion} (${scores[r.criterion] || 0}/${r.maxScore}): [specific comment]`).join('\n')}

• Areas for Improvement:
• [specific area 1]
• [specific area 2]

• Suggested Improvements:
• [actionable suggestion 1]
• [actionable suggestion 2]`;

    const completion = await groq.chat.completions.create({
      messages:    [{ role: 'user', content: prompt }],
      model:       'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens:  1000,
    });

    const feedback = completion.choices[0]?.message?.content || 'Could not generate feedback.';
    res.json({ success: true, feedback });

  } catch (err) {
    console.error('Marking feedback error:', err.message);
    let message = 'Failed to generate feedback.';
    if (err.status === 429) message = 'Rate limit reached. Please wait a moment and try again.';
    res.status(500).json({ success: false, message });
  }
};