const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  lecturer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleCode:     { type: String, required: true },
  moduleName:     { type: String, required: true },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  deadline:       { type: Date },
  submissionMode: { type: String, default: 'PDF report submission' },
  maxWordCount:   { type: String, default: '3000-5000 words' },
  instructions:   { type: String, default: '' },
  maxScore:       { type: Number, default: 100 },

  // Uploaded document paths (served from /uploads/)
  instructionFile: { type: String, default: null },
  templateFile:    { type: String, default: null },

  rubric: [{
    criterion:   { type: String },
    maxScore:    { type: Number },
    description: { type: String },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);