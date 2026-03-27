const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function generateNumero() {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `PV-${year}-${rand}`;
}

router.get('/', (req, res) => {
  const { civilian_id, officer_id, type_pv, statut } = req.query;
  let query = `SELECT p.*, c.nom, c.prenom, c.roblox_username, u.username as officer_name, u.grade FROM pv p LEFT JOIN civilians c ON p.civilian_id = c.id LEFT JOIN users u ON p.officer_id = u.id WHERE 1=1`;
  const params = [];
  if (civilian_id) { query += ' AND p.civilian_id = ?'; params.push(civilian_id); }
  if (officer_id) { query += ' AND p.officer_id = ?'; params.push(officer_id); }
  if (type_pv) { query += ' AND p.type_pv = ?'; params.push(type_pv); }
  if (statut) { query += ' AND p.statut = ?'; params.push(statut); }
  query += ' ORDER BY p.date DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: db.prepare('SELECT COUNT(*) as c FROM pv').get().c,
    today: db.prepare('SELECT COUNT(*) as c FROM pv WHERE date >= ?').get(today + 'T00:00:00').c,
    finalises: db.prepare("SELECT COUNT(*) as c FROM pv WHERE statut = 'finalisé'").get().c,
  };
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const pv = db.prepare(`SELECT p.*, c.nom, c.prenom, c.roblox_username, c.date_naissance, c.adresse, u.username as officer_name, u.grade, u.matricule as officer_matricule FROM pv p LEFT JOIN civilians c ON p.civilian_id = c.id LEFT JOIN users u ON p.officer_id = u.id WHERE p.id = ?`).get(req.params.id);
  if (!pv) return res.status(404).json({ error: 'PV non trouvé' });
  res.json(pv);
});

router.post('/', (req, res) => {
  const { civilian_id, type_pv, titre, faits, articles_violes, sanctions, localisation, temoins, custody_id, fine_id } = req.body;
  if (!civilian_id || !titre || !faits) return res.status(400).json({ error: 'Champs manquants' });

  let numero;
  let attempts = 0;
  do {
    numero = generateNumero();
    attempts++;
  } while (db.prepare('SELECT id FROM pv WHERE numero = ?').get(numero) && attempts < 10);

  const result = db.prepare(`INSERT INTO pv (numero, civilian_id, officer_id, type_pv, titre, faits, articles_violes, sanctions, localisation, temoins, custody_id, fine_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(numero, civilian_id, req.user.id, type_pv || 'constatation', titre, faits, articles_violes || '', sanctions || '', localisation || '', temoins || '', custody_id || null, fine_id || null);

  res.status(201).json({ id: result.lastInsertRowid, numero });
});

router.put('/:id', (req, res) => {
  const pv = db.prepare('SELECT * FROM pv WHERE id = ?').get(req.params.id);
  if (!pv) return res.status(404).json({ error: 'PV non trouvé' });
  const { titre, faits, articles_violes, sanctions, localisation, temoins, statut, type_pv } = req.body;
  db.prepare(`UPDATE pv SET titre=?, faits=?, articles_violes=?, sanctions=?, localisation=?, temoins=?, statut=?, type_pv=? WHERE id=?`)
    .run(titre || pv.titre, faits || pv.faits, articles_violes ?? pv.articles_violes, sanctions ?? pv.sanctions, localisation ?? pv.localisation, temoins ?? pv.temoins, statut || pv.statut, type_pv || pv.type_pv, pv.id);
  res.json({ success: true });
});

router.patch('/:id/statut', (req, res) => {
  const { statut } = req.body;
  if (!['brouillon', 'finalisé', 'classé'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
  db.prepare('UPDATE pv SET statut = ? WHERE id = ?').run(statut, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare("UPDATE pv SET statut = 'classé' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
