const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db/database');
const { authRequired } = require('../middleware/auth');
const { reviewCode } = require('../services/aiService');
const { detectLanguage } = require('../services/languageDetector');

const router = express.Router();

// Create a new AI code review
router.post('/', authRequired, async (req, res) => {
  try {
    let { title, language, code, teamId } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ error: 'Code too long (max 50,000 characters)' });
    }

    if (!language || language === 'auto') {
      language = detectLanguage(code);
    }

    const { markdown, score, fixedCode } = await reviewCode(code, language);

    const info = db.prepare(`
      INSERT INTO reviews (user_id, team_id, title, language, code, review_markdown, score, fixed_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, teamId || null, title || 'Untitled Review', language, code, markdown, score, fixedCode);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'AI review failed' });
  }
});

// List current user's review history
router.get('/', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT id, title, language, score, created_at, is_public, team_id
    FROM reviews WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ reviews: rows });
});

// Get a single review (owner only)
router.get('/:id', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Review not found' });
  res.json({ review: row });
});

// Delete a review
router.delete('/:id', authRequired, (req, res) => {
  const result = db.prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Review not found' });
  res.json({ success: true });
});

// Generate / toggle a public share link
router.post('/:id/share', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Review not found' });

  let shareId = row.share_id;
  if (!shareId) shareId = nanoid(10);

  db.prepare('UPDATE reviews SET share_id = ?, is_public = 1 WHERE id = ?').run(shareId, row.id);
  res.json({ shareId });
});

router.post('/:id/unshare', authRequired, (req, res) => {
  const result = db.prepare('UPDATE reviews SET is_public = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Review not found' });
  res.json({ success: true });
});

// Public shared view (no auth)
router.get('/share/:shareId', (req, res) => {
  const row = db.prepare('SELECT * FROM reviews WHERE share_id = ? AND is_public = 1').get(req.params.shareId);
  if (!row) return res.status(404).json({ error: 'Shared review not found' });
  res.json({ review: row });
});

// Download report as markdown text file
router.get('/:id/download', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Review not found' });

  const content = `# Code Review Report: ${row.title}\n\nLanguage: ${row.language}\nDate: ${row.created_at}\nScore: ${row.score ?? 'N/A'}/100\n\n---\n\n## Submitted Code\n\n\`\`\`${row.language}\n${row.code}\n\`\`\`\n\n---\n\n${row.review_markdown}\n`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="review-${row.id}.md"`);
  res.send(content);
});

module.exports = router;
