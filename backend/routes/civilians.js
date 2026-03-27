const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// List / search civilians
router.get('/', (req, res) => {
  const { q, statut } = req.query;
  let query = `SELECT c.*, u.username as officer_name FROM civilians c LEFT JOIN users u ON c.created_by = u.id WHERE 1=1`;
  const params = [];
  if (q) {
    query += ` AND (c.nom LIKE ? OR c.prenom LIKE ? OR c.roblox_username LIKE ? OR c.telephone LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (statut) { query += ` AND c.statut = ?`; params.push(statut); }
  query += ` ORDER BY c.nom, c.prenom`;
  res.json(db.prepare(query).all(...params));
});

// Get single civilian with related records
router.get('/:id', (req, res) => {
  const civil = db.prepare('SELECT * FROM civilians WHERE id = ?').get(req.params.id);
  if (!civil) return res.status(404).json({ error: 'Civil non trouvé' });

  const fines = db.prepare('SELECT f.*, u.username as officer_name, u.grade FROM fines f LEFT JOIN users u ON f.officer_id = u.id WHERE f.civilian_id = ? ORDER BY f.date DESC').all(civil.id);
  const custodies = db.prepare('SELECT c.*, u.username as officer_name, u.grade FROM custody c LEFT JOIN users u ON c.officer_id = u.id WHERE c.civilian_id = ? ORDER BY c.date_debut DESC').all(civil.id);
  const pvs = db.prepare('SELECT p.*, u.username as officer_name, u.grade FROM pv p LEFT JOIN users u ON p.officer_id = u.id WHERE p.civilian_id = ? ORDER BY p.date DESC').all(civil.id);

  res.json({ ...civil, fines, custodies, pvs });
});

// Create civilian
router.post('/', (req, res) => {
  const { nom, prenom, date_naissance, nationalite, adresse, roblox_username, telephone, profession, antecedents, statut, notes } = req.body;
  if (!nom || !prenom) return res.status(400).json({ error: 'Nom et prénom requis' });

  const result = db.prepare(`INSERT INTO civilians (nom, prenom, date_naissance, nationalite, adresse, roblox_username, telephone, profession, antecedents, statut, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(nom, prenom, date_naissance || null, nationalite || 'Française', adresse || '', roblox_username || '', telephone || '', profession || '', antecedents || '', statut || 'actif', notes || '', req.user.id);

  res.status(201).json({ id: result.lastInsertRowid });
});

// Update civilian
router.put('/:id', (req, res) => {
  const civil = db.prepare('SELECT * FROM civilians WHERE id = ?').get(req.params.id);
  if (!civil) return res.status(404).json({ error: 'Civil non trouvé' });

  const { nom, prenom, date_naissance, nationalite, adresse, roblox_username, telephone, profession, antecedents, statut, notes } = req.body;
  db.prepare(`UPDATE civilians SET nom=?, prenom=?, date_naissance=?, nationalite=?, adresse=?, roblox_username=?, telephone=?, profession=?, antecedents=?, statut=?, notes=? WHERE id=?`)
    .run(nom || civil.nom, prenom || civil.prenom, date_naissance ?? civil.date_naissance, nationalite || civil.nationalite, adresse ?? civil.adresse, roblox_username ?? civil.roblox_username, telephone ?? civil.telephone, profession ?? civil.profession, antecedents ?? civil.antecedents, statut || civil.statut, notes ?? civil.notes, civil.id);

  res.json({ success: true });
});

// Delete / archive civilian
router.delete('/:id', (req, res) => {
  db.prepare("UPDATE civilians SET statut = 'archivé' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
