const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { civilian_id, officer_id, statut } = req.query;
  let query = `SELECT f.*, c.nom, c.prenom, c.roblox_username, u.username as officer_name, u.grade FROM fines f LEFT JOIN civilians c ON f.civilian_id = c.id LEFT JOIN users u ON f.officer_id = u.id WHERE 1=1`;
  const params = [];
  if (civilian_id) { query += ' AND f.civilian_id = ?'; params.push(civilian_id); }
  if (officer_id) { query += ' AND f.officer_id = ?'; params.push(officer_id); }
  if (statut) { query += ' AND f.statut = ?'; params.push(statut); }
  query += ' ORDER BY f.date DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: db.prepare('SELECT COUNT(*) as c FROM fines').get().c,
    today: db.prepare("SELECT COUNT(*) as c FROM fines WHERE date >= ?").get(today + 'T00:00:00').c,
    non_payees: db.prepare("SELECT COUNT(*) as c FROM fines WHERE statut = 'non_payée'").get().c,
    montant_total: db.prepare("SELECT COALESCE(SUM(montant),0) as s FROM fines WHERE statut = 'payée'").get().s,
  };
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const fine = db.prepare(`SELECT f.*, c.nom, c.prenom, c.roblox_username, u.username as officer_name, u.grade FROM fines f LEFT JOIN civilians c ON f.civilian_id = c.id LEFT JOIN users u ON f.officer_id = u.id WHERE f.id = ?`).get(req.params.id);
  if (!fine) return res.status(404).json({ error: 'Amende non trouvée' });
  res.json(fine);
});

router.post('/', (req, res) => {
  const { civilian_id, montant, motif, details, localisation, pv_id } = req.body;
  if (!civilian_id || !montant || !motif) return res.status(400).json({ error: 'Champs manquants' });

  const result = db.prepare(`INSERT INTO fines (civilian_id, officer_id, montant, motif, details, localisation, pv_id) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(civilian_id, req.user.id, montant, motif, details || '', localisation || '', pv_id || null);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.patch('/:id/statut', (req, res) => {
  const { statut } = req.body;
  if (!['payée', 'non_payée', 'contestée', 'annulée'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
  const date_paiement = statut === 'payée' ? new Date().toISOString() : null;
  db.prepare('UPDATE fines SET statut = ?, date_paiement = ? WHERE id = ?').run(statut, date_paiement, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare("UPDATE fines SET statut = 'annulée' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
