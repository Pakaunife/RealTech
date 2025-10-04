const express = require('express');
const authenticateToken = require('./auth');
const pool = require('../connection/DBconnect');
const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT nome, cognome, email FROM utenti WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;