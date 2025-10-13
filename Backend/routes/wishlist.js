const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');

// Ottieni la wishlist di un utente
router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.prodotto_id, p.nome, p.prezzo, p.immagine
       FROM wishlist w
       JOIN prodotto p ON w.prodotto_id = p.id_prodotto
       WHERE w.user_id = $1`, [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero wishlist' });
  }
});

// Aggiungi un prodotto alla wishlist
router.post('/', async (req, res) => {
  const { user_id, prodotto_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO wishlist (user_id, prodotto_id) VALUES ($1, $2)`, [user_id, prodotto_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiunta alla wishlist' });
  }
});

// Rimuovi un prodotto dalla wishlist
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM wishlist WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella rimozione dalla wishlist' });
  }
});

module.exports = router;