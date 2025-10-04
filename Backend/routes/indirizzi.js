const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');
const router = express.Router();

// Aggiungi un indirizzo
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { indirizzo, citta, cap, provincia, paese, predefinito } = req.body;
  try {
    if (predefinito) {
      // Imposta tutti gli altri indirizzi come non predefiniti
      await pool.query(
        'UPDATE indirizzi SET predefinito = FALSE WHERE user_id = $1',
        [userId]
      );
    }
    const result = await pool.query(
      `INSERT INTO indirizzi (user_id, indirizzo, citta, cap, provincia, paese, predefinito)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, indirizzo, citta, cap, provincia, paese, predefinito || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni tutti gli indirizzi dell’utente
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM indirizzi WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Imposta un indirizzo come predefinito
router.put('/:id/predefinito', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const indirizzoId = req.params.id;
  try {
    await pool.query(
      'UPDATE indirizzi SET predefinito = FALSE WHERE user_id = $1',
      [userId]
    );
    await pool.query(
      'UPDATE indirizzi SET predefinito = TRUE WHERE id = $1 AND user_id = $2',
      [indirizzoId, userId]
    );
    res.json({ message: 'Indirizzo impostato come predefinito' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;