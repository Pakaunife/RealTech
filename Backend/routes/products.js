const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');
const router = express.Router();

// Imposta prodotto in vetrina o promo
router.put('/:id/vetrina', authenticateToken, async (req, res) => {
  const { in_vetrina, promo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE prodotti SET in_vetrina = $1, promo = $2 WHERE id = $3 RETURNING *',
      [in_vetrina, promo, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni prodotti in vetrina
router.get('/vetrina', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prodotti WHERE in_vetrina = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni prodotti in promo
router.get('/promo', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prodotti WHERE promo = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO visualizzazioni (user_id, prodotto_id) VALUES ($1, $2)',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Visualizzazione registrata' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;