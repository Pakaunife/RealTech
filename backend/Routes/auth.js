const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Registrazione
router.post('/register', async (req, res) => {
  let {nome, cognome, email, password} = req.body;
  if (!nome || !cognome || !email || !password) return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    email = email.toLowerCase();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO utenti (nome, cognome, email, password) VALUES ($1, $2, $3, $4) RETURNING id, nome, email',
      [nome, cognome, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // email già esistente
      res.status(409).json({ message: 'Email già registrata' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

// Login
router.post('/login', async (req, res) => {
  const  password  = req.body.password;
  let email = req.body.email;
  if (!email || !password) return res.status(400).json({ message: 'Email e password obbligatorie' });
    email = email.toLowerCase();
  try {
    const result = await pool.query('SELECT * FROM utenti WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Credenziali non valide' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenziali non valide' });

    // Genera JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Cambia email
router.put('/change-email', authenticateToken, async (req, res) => {
  let { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ message: 'Nuova email obbligatoria' });
  newEmail = newEmail.toLowerCase();

  try {
    const result = await pool.query(
      'UPDATE utenti SET email = $1 WHERE id = $2 RETURNING id, nome, email',
      [newEmail, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email già registrata' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

// Cambia password
router.put('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Password obbligatorie' });

  try {
    const result = await pool.query('SELECT password FROM utenti WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Vecchia password errata' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE utenti SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    res.json({ message: 'Password aggiornata con successo' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;