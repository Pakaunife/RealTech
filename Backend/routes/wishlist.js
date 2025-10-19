const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');

// Ottieni la wishlist di un utente
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.id_prodotto as id, p.nome, p.prezzo, p.immagine, p.quantita_disponibile, p.descrizione, m.nome as marchio, c.nome as categoria
      FROM wish_list w
      JOIN prodotto p ON w.prodotto_id = p.id_prodotto join categoria c on p.id_categoria = c.id_categoria join marchio m on p.id_marchio = m.id_marchio
      WHERE w.user_id = $1
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero della wishlist' });
  }
});

// Aggiungi un prodotto alla wishlist
router.post('/', async (req, res) => {
  const { user_id, prodotto_id } = req.body;
  console.log('Ricevuto:', req.body);
  try {
    await pool.query(
      `INSERT INTO wish_list (user_id, prodotto_id) VALUES ($1, $2)`, [user_id, prodotto_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiunta alla wishlist' });
  }
});

// Rimuovi un prodotto dalla wishlist
router.delete('/:user_id/:prodotto_id', async (req, res) => {
  const { user_id, prodotto_id } = req.params;
  try {
    await pool.query(
      'DELETE FROM wish_list WHERE user_id = $1 AND prodotto_id = $2',
      [user_id, prodotto_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella rimozione dalla wishlist' });
  }
});

module.exports = router;