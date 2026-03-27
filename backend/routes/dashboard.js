const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    civils: db.prepare("SELECT COUNT(*) as c FROM civilians WHERE statut != 'archivé'").get().c,
    amendes_today: db.prepare('SELECT COUNT(*) as c FROM fines WHERE date >= ?').get(today + 'T00:00:00').c,
    gav_en_cours: db.prepare("SELECT COUNT(*) as c FROM custody WHERE statut = 'en_cours'").get().c,
    pv_today: db.prepare('SELECT COUNT(*) as c FROM pv WHERE date >= ?').get(today + 'T00:00:00').c,
    amendes_non_payees: db.prepare("SELECT COUNT(*) as c FROM fines WHERE statut = 'non_payée'").get().c,
    pv_total: db.prepare('SELECT COUNT(*) as c FROM pv').get().c,
  };
  res.json(stats);
});

router.get('/recent', (req, res) => {
  const recent_fines = db.prepare(`SELECT f.id, f.montant, f.motif, f.date, f.statut, c.nom, c.prenom FROM fines f LEFT JOIN civilians c ON f.civilian_id = c.id WHERE f.officer_id = ? ORDER BY f.date DESC LIMIT 5`).all(req.user.id);
  const recent_gav = db.prepare(`SELECT cu.id, cu.motif, cu.date_debut, cu.statut, c.nom, c.prenom FROM custody cu LEFT JOIN civilians c ON cu.civilian_id = c.id WHERE cu.officer_id = ? ORDER BY cu.date_debut DESC LIMIT 5`).all(req.user.id);
  const recent_pv = db.prepare(`SELECT p.id, p.numero, p.titre, p.date, p.statut, c.nom, c.prenom FROM pv p LEFT JOIN civilians c ON p.civilian_id = c.id WHERE p.officer_id = ? ORDER BY p.date DESC LIMIT 5`).all(req.user.id);
  res.json({ recent_fines, recent_gav, recent_pv });
});

module.exports = router;
