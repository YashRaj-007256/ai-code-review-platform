const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function isMember(teamId, userId) {
  return db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, userId);
}

// Create a team (creator becomes owner + member)
router.post('/', authRequired, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });

  const inviteCode = nanoid(8);
  const info = db.prepare('INSERT INTO teams (name, owner_id, invite_code) VALUES (?, ?, ?)')
    .run(name, req.user.id, inviteCode);

  db.prepare('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)')
    .run(info.lastInsertRowid, req.user.id, 'owner');

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ team });
});

// List teams current user belongs to
router.get('/', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, tm.role FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);
  res.json({ teams: rows });
});

// Join a team using invite code
router.post('/join', authRequired, (req, res) => {
  const { inviteCode } = req.body;
  const team = db.prepare('SELECT * FROM teams WHERE invite_code = ?').get(inviteCode);
  if (!team) return res.status(404).json({ error: 'Invalid invite code' });

  const already = isMember(team.id, req.user.id);
  if (already) return res.status(409).json({ error: 'Already a member of this team' });

  db.prepare('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)')
    .run(team.id, req.user.id, 'member');
  res.json({ team });
});

// List members of a team
router.get('/:id/members', authRequired, (req, res) => {
  if (!isMember(req.params.id, req.user.id)) return res.status(403).json({ error: 'Not a team member' });
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, tm.role, tm.joined_at
    FROM team_members tm JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
  `).all(req.params.id);
  res.json({ members: rows });
});

// List reviews shared with a team
router.get('/:id/reviews', authRequired, (req, res) => {
  if (!isMember(req.params.id, req.user.id)) return res.status(403).json({ error: 'Not a team member' });
  const rows = db.prepare(`
    SELECT r.id, r.title, r.language, r.score, r.created_at, u.name as author
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.team_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.json({ reviews: rows });
});

module.exports = router;
