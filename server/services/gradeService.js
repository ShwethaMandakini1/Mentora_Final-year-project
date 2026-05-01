const Groq = require('groq-sdk');

exports.analyseSubmission = async ({ text, assignmentName, moduleCode, moduleName, rubric, context }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const groq = new Groq({ apiKey });

  const rubricText = rubric && rubric.length > 0
    ? `Marking Rubric:\n${rubric.map(r => `- ${r.criterion} (max ${r.maxScore} marks): ${r.description || ''}`).join('\n')}`
    : 'No specific rubric provided. Use general academic criteria.';

  const contextText = context
    ? `\nLecturer Instructions & Context:\n${context}`
    : '';

  const prompt = `You are a strict academic evaluator. Your first job is to check if the submission is relevant to the assignment. If it is NOT relevant, you must give a very low score.

Assignment: ${assignmentName}
Module: ${moduleCode} - ${moduleName}
${rubricText}${contextText}

Student submission text:
"""
${text.slice(0, 6000)}
"""

STRICT RULES YOU MUST FOLLOW:
1. First determine if the submission topic matches the assignment topic. For example:
   - If the assignment is about "Software Engineering" but the submission is about "Nursing" → this is WRONG SUBMISSION → predictedScore must be 0-10
   - If the assignment is about "HCI" but the submission is about "Machine Learning" → WRONG SUBMISSION → predictedScore must be 0-10
   - Only give a good score if the submission is clearly about the correct assignment topic
2. Base ALL feedback strictly on the rubric criteria provided
3. Every missing part must reference a specific rubric criterion or assignment requirement
4. Never give generic feedback unrelated to this specific assignment

Respond ONLY with a valid JSON object (no markdown, no backticks):
{
  "predictedScore": <0-10 if wrong topic, otherwise 0-100 based on rubric>,
  "predictedGrade": "<A+/A/A-/B+/B/B-/C+/C/F>",
  "summary": "<If wrong topic: clearly state the submission does not match the assignment. If correct topic: 2-3 sentences about quality>",
  "missingParts": [
    { "part": "<specific missing section from rubric/instructions>", "importance": "<High/Medium/Low>", "suggestion": "<specific advice>" }
  ],
  "enhancements": [
    { "area": "<specific rubric criterion>", "current": "<what student wrote>", "suggestion": "<specific improvement>" }
  ],
  "strengths": [
    "<specific strength related to rubric, or 'None - submission does not match assignment topic' if wrong topic>"
  ],
  "rubricBreakdown": [
    { "criterion": "<exact rubric criterion>", "score": <0 if wrong topic, otherwise estimated>, "maxScore": <rubric max>, "comment": "<specific comment>" }
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages:    [{ role: 'user', content: prompt }],
    model:       'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens:  2000,
  });

  const raw   = completion.choices[0]?.message?.content || '';
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('Failed to parse AI response:', clean);
    throw new Error('AI returned invalid response');
  }
};