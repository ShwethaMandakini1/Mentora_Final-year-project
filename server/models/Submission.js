const mongoose = require('mongoose');

const RubricScoreSchema = new mongoose.Schema({
  criterion:  { type: String },
  score:      { type: Number, default: 0 },
  maxScore:   { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
}, { _id: false });

const MissingPartSchema = new mongoose.Schema({
  part:       { type: String },
  importance: { type: String },
  suggestion: { type: String },
}, { _id: false });

const EnhancementSchema = new mongoose.Schema({
  area:       { type: String },
  current:    { type: String },
  suggestion: { type: String },
}, { _id: false });

const RubricBreakdownSchema = new mongoose.Schema({
  criterion: { type: String },
  score:     { type: Number },
  maxScore:  { type: Number },
  comment:   { type: String },
}, { _id: false });

const AIAnalysisSchema = new mongoose.Schema({
  status:          { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
  message:         { type: String },
  predictedScore:  { type: Number },
  predictedGrade:  { type: String },
  summary:         { type: String },
  missingParts:    [MissingPartSchema],
  enhancements:    [EnhancementSchema],
  strengths:       [{ type: String }],
  rubricBreakdown: [RubricBreakdownSchema],
  analysedAt:      { type: Date, default: Date.now },
}, { _id: false });

// ── NEW: Correction schema ────────────────────────────────────────────────────
const CorrectionSchema = new mongoose.Schema({
  note:    { type: String },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const SubmissionSchema = new mongoose.Schema({
  student:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lecturer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moduleCode:     { type: String, required: true },
  moduleName:     { type: String, required: true },
  assignmentName: { type: String, required: true },
  fileName:       { type: String, required: true },
  filePath:       { type: String, required: true },
  fileType:       { type: String },
  status:         { type: String, enum: ['Pending', 'Graded', 'Rejected'], default: 'Pending' },
  grade:          { type: String, default: '' },
  score:          { type: Number, default: 0 },
  feedback:       { type: String, default: '' },
  rubricScores:   [RubricScoreSchema],
  corrections:    [CorrectionSchema],   // ← NEW: lecturer correction notes
  aiAnalysis:     { type: AIAnalysisSchema, default: () => ({ status: 'pending' }) },
  submittedAt:    { type: Date, default: Date.now },
  gradedAt:       { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);