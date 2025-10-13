const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Ottieni il profilo dell'utente
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT id, nome, cognome, email, telefono, data_nascita, sesso FROM utenti WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Errore nel recupero profilo:', err);
    res.status(500).json({ message: err.message });
  }
});

// Aggiorna il profilo
router.put('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { nome, cognome, telefono, data_nascita, sesso } = req.body; // Aggiungi sesso qui
  
  try {
    const result = await pool.query(
      `UPDATE utenti 
       SET nome = $1, cognome = $2, telefono = $3, data_nascita = $4, sesso = $5
       WHERE id = $6
       RETURNING id, nome, cognome, email, telefono, data_nascita, sesso`,
      [nome, cognome, telefono, data_nascita, sesso, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Errore nell\'aggiornamento profilo:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cambia password
router.put('/password', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { vecchia_password, nuova_password } = req.body;
  
  try {
    // Verifica la vecchia password
    const result = await pool.query('SELECT password FROM utenti WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    const isValidPassword = await bcrypt.compare(vecchia_password, result.rows[0].password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Password attuale non corretta' });
    }
    
    // Hash della nuova password
    const hashedPassword = await bcrypt.hash(nuova_password, 10);
    
    await pool.query('UPDATE utenti SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    
    res.json({ message: 'Password cambiata con successo' });
  } catch (err) {
    console.error('Errore nel cambio password:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cambia email
router.put('/email', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { nuova_email, password } = req.body;
  
  try {
    // Verifica la password
    const result = await pool.query('SELECT password FROM utenti WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    const isValidPassword = await bcrypt.compare(password, result.rows[0].password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Password non corretta' });
    }
    
    // Verifica se l'email è già usata
    const emailCheck = await pool.query(
      'SELECT id FROM utenti WHERE email = $1 AND id != $2',
      [nuova_email, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email già in uso' });
    }
    
    // Aggiorna l'email
    await pool.query('UPDATE utenti SET email = $1 WHERE id = $2', [nuova_email, userId]);
    
    res.json({ message: 'Email cambiata con successo' });
  } catch (err) {
    console.error('Errore nel cambio email:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;