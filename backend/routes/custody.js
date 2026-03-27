const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { statut, civilian_id } = req.query;
  let query = `SELECT cu.*, c.nom, c.prenom, c.roblox_username, u.username as officer_name, u.grade FROM custody cu LEFT JOIN civilians c ON cu.civilian_id = c.id LEFT JOIN users u ON cu.officer_id = u.id WHERE 1=1`;
  const params = [];
  if (statut) { query += ' AND cu.statut = ?'; params.push(statut); }
  if (civilian_id) { query += ' AND cu.civilian_id = ?'; params.push(civilian_id); }
  query += ' ORDER BY cu.date_debut DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/stats', (req, res) => {
  const stats = {
    en_cours: db.prepare("SELECT COUNT(*) as c FROM custody WHERE statut = 'en_cours'").get().c,
    total: db.prepare('SELECT COUNT(*) as c FROM custody').get().c,
  };
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const custody = db.prepare(`SELECT cu.*, c.nom, c.prenom, c.roblox_username, u.username as officer_name, u.grade FROM custody cu LEFT JOIN civilians c ON cu.civilian_id = c.id LEFT JOIN users u ON cu.officer_id = u.id WHERE cu.id = ?`).get(req.params.id);
  if (!custody) return res.status(404).json({ error: 'GAV non trouvée' });
  res.json(custody);
});

router.post('/', (req, res) => {
  const { civilian_id, motif, details, lieu } = req.body;
  if (!civilian_id || !motif) return res.status(400).json({ error: 'Champs manquants' });

  const result = db.prepare(`INSERT INTO custody (civilian_id, officer_id, motif, details, lieu) VALUES (?, ?, ?, ?, ?)`)
    .run(civilian_id, req.user.id, motif, details || '', lieu || 'Brigade de Gendarmerie - Pacifique RP');

  res.status(201).json({ id: result.lastInsertRowid });
});

router.patch('/:id/cloturer', (req, res) => {
  const { statut, notes } = req.body;
  const validStatuts = ['terminée', 'levée', 'prolongée'];
  if (!validStatuts.includes(statut)) return res.status(400).json({ error: 'Statut invalide' });

  db.prepare('UPDATE custody SET statut = ?, date_fin = ?, notes = ? WHERE id = ?').run(statut, new Date().toISOString(), notes || '', req.params.id);
  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const gav = db.prepare('SELECT * FROM custody WHERE id = ?').get(req.params.id);
  if (!gav) return res.status(404).json({ error: 'GAV non trouvée' });
  const { motif, details, lieu, notes } = req.body;
  db.prepare('UPDATE custody SET motif=?, details=?, lieu=?, notes=? WHERE id=?').run(motif || gav.motif, details ?? gav.details, lieu || gav.lieu, notes ?? gav.notes, gav.id);
  res.json({ success: true });
});

module.exports = router;
