const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');
const router = express.Router();

// Aggiungi un prodotto alla wish list
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { prodotto_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO wish_list (user_id, prodotto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, prodotto_id]
    );
    res.json({ message: 'Prodotto aggiunto alla wish list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni la wish list dell'utente
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT p.* FROM prodotti p
       JOIN wish_list w ON w.prodotto_id = p.id
       WHERE w.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rimuovi un prodotto dalla wish list
router.delete('/:prodotto_id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const prodottoId = req.params.prodotto_id;
  try {
    await pool.query(
      'DELETE FROM wish_list WHERE user_id = $1 AND prodotto_id = $2',
      [userId, prodottoId]
    );
    res.json({ message: 'Prodotto rimosso dalla wish list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;