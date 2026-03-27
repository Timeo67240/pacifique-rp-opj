const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'dev_secret';

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  if (user.status === 'pending') return res.status(403).json({ error: 'Votre compte est en attente de validation par un administrateur.' });
  if (user.status === 'disabled' || !user.active) return res.status(403).json({ error: 'Votre compte a été désactivé.' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, grade: user.grade, matricule: user.matricule },
    SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, grade: user.grade, matricule: user.matricule } });
});

// Inscription publique (compte en attente de validation)
router.post('/register', (req, res) => {
  const { username, password, grade } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min. 6 caractères)' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Cet identifiant est déjà utilisé' });

  const hash = bcrypt.hashSync(password, 12);
  db.prepare("INSERT INTO users (username, password_hash, role, grade, status, active) VALUES (?, ?, 'opj', ?, 'pending', 0)")
    .run(username, hash, grade || '');

  res.status(201).json({ message: 'Demande envoyée. Un administrateur doit valider votre compte.' });
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, role, grade, matricule, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// Admin: list all users
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role, grade, matricule, active, status, created_at FROM users ORDER BY status ASC, created_at DESC').all();
  res.json(users);
});

// Admin: create user directly (actif immédiatement)
router.post('/users', authenticate, requireAdmin, (req, res) => {
  const { username, password, role, grade, matricule } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });
  if (!['admin', 'opj'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare("INSERT INTO users (username, password_hash, role, grade, matricule, status, active, created_by) VALUES (?, ?, ?, ?, ?, 'active', 1, ?)")
    .run(username, hash, role || 'opj', grade || '', matricule || '', req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, username, role });
});

// Admin: approuver un compte en attente
router.patch('/users/:id/approve', authenticate, requireAdmin, (req, res) => {
  const { role, grade, matricule } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  db.prepare("UPDATE users SET status = 'active', active = 1, role = ?, grade = ?, matricule = ? WHERE id = ?")
    .run(role || 'opj', grade || user.grade || '', matricule || user.matricule || '', user.id);
  res.json({ success: true });
});

// Admin: rejeter/supprimer un compte en attente
router.delete('/users/:id/reject', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ? AND status = ?').run(req.params.id, 'pending');
  res.json({ success: true });
});

// Admin: update user
router.patch('/users/:id', authenticate, requireAdmin, (req, res) => {
  const { role, grade, matricule, active, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  if (role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
  if (grade !== undefined) db.prepare('UPDATE users SET grade = ? WHERE id = ?').run(grade, user.id);
  if (matricule !== undefined) db.prepare('UPDATE users SET matricule = ? WHERE id = ?').run(matricule, user.id);
  if (active !== undefined) db.prepare('UPDATE users SET active = ?, status = ? WHERE id = ?').run(active ? 1 : 0, active ? 'active' : 'disabled', user.id);
  if (password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 12), user.id);

  res.json({ success: true });
});

// Admin: delete user
router.delete('/users/:id', authenticate, requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer son propre compte' });
  db.prepare("UPDATE users SET active = 0, status = 'disabled' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
