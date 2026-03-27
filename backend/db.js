const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'pacifique_rp.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'opj' CHECK(role IN ('admin', 'opj')),
    matricule TEXT,
    grade TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending', 'active', 'disabled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER
  );

  CREATE TABLE IF NOT EXISTS civilians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    date_naissance TEXT,
    nationalite TEXT DEFAULT 'Française',
    adresse TEXT,
    roblox_username TEXT,
    telephone TEXT,
    profession TEXT,
    antecedents TEXT DEFAULT '',
    statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'recherché', 'interdit_séjour', 'archivé')),
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    civilian_id INTEGER NOT NULL,
    officer_id INTEGER NOT NULL,
    montant INTEGER NOT NULL,
    motif TEXT NOT NULL,
    details TEXT,
    localisation TEXT,
    statut TEXT NOT NULL DEFAULT 'non_payée' CHECK(statut IN ('payée', 'non_payée', 'contestée', 'annulée')),
    date TEXT NOT NULL DEFAULT (datetime('now')),
    date_paiement TEXT,
    pv_id INTEGER,
    FOREIGN KEY(civilian_id) REFERENCES civilians(id),
    FOREIGN KEY(officer_id) REFERENCES users(id),
    FOREIGN KEY(pv_id) REFERENCES pv(id)
  );

  CREATE TABLE IF NOT EXISTS custody (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    civilian_id INTEGER NOT NULL,
    officer_id INTEGER NOT NULL,
    motif TEXT NOT NULL,
    details TEXT,
    lieu TEXT DEFAULT 'Brigade de Gendarmerie - Pacifique RP',
    date_debut TEXT NOT NULL DEFAULT (datetime('now')),
    date_fin TEXT,
    statut TEXT NOT NULL DEFAULT 'en_cours' CHECK(statut IN ('en_cours', 'terminée', 'levée', 'prolongée')),
    notes TEXT,
    FOREIGN KEY(civilian_id) REFERENCES civilians(id),
    FOREIGN KEY(officer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    civilian_id INTEGER NOT NULL,
    officer_id INTEGER NOT NULL,
    type_pv TEXT NOT NULL DEFAULT 'constatation' CHECK(type_pv IN ('constatation', 'audition', 'arrestation', 'contravention', 'flagrant_delit')),
    titre TEXT NOT NULL,
    faits TEXT NOT NULL,
    articles_violes TEXT,
    sanctions TEXT,
    localisation TEXT,
    temoins TEXT,
    custody_id INTEGER,
    fine_id INTEGER,
    statut TEXT NOT NULL DEFAULT 'brouillon' CHECK(statut IN ('brouillon', 'finalisé', 'classé')),
    date TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(civilian_id) REFERENCES civilians(id),
    FOREIGN KEY(officer_id) REFERENCES users(id),
    FOREIGN KEY(custody_id) REFERENCES custody(id),
    FOREIGN KEY(fine_id) REFERENCES fines(id)
  );
`);

// Migration: ajouter colonne status si elle n'existe pas
try {
  db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','disabled'))");
} catch {}

// Seed default admin if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('Admin1234!', 12);
  db.prepare(`INSERT INTO users (username, password_hash, role, grade, matricule) VALUES (?, ?, 'admin', 'Commandant', 'CMD-001')`).run('admin', hash);
  console.log('[DB] Admin par défaut créé: admin / Admin1234!');
}

module.exports = db;
