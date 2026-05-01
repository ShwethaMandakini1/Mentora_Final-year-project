const fs      = require('fs');
const path    = require('path');
const mammoth = require('mammoth');

// ── Main export ───────────────────────────────────────────────
exports.extractText = async (filePath) => {
  const absPath = path.join(__dirname, '..', filePath);
  const ext     = path.extname(absPath).toLowerCase();

  try {
    if (ext === '.pdf') {
      console.log('Extracting text from PDF:', path.basename(absPath));
      const buffer = fs.readFileSync(absPath);

      // dynamic import to avoid caching issues
      delete require.cache[require.resolve('pdf-parse')];
      const pdfParse = require('pdf-parse');

      const data = await pdfParse(buffer);
      const text = data?.text || '';
      console.log(`PDF extraction got ${text.trim().length} chars`);
      return text;

    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: absPath });
      console.log(`DOCX extraction got ${(result.value || '').length} chars`);
      return result.value || '';
    }

    return '';
  } catch (err) {
    console.error('File parse error:', err.message);
    return '';
  }
};