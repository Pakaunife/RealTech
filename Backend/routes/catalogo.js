const express = require('express');
const pool = require('../connection/DBconnect');

// --- API Catalogo ---
const router = express.Router();

// Tutti i prodotti
router.get('/prodotti', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nome, id_categoria
      FROM categoria;

    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});
// Prodotti per categoria specifica
router.get('/prodotti/categoria/:nome', async (req, res) => {   //Riceve il nome della categoria come parametro
  try {
    const nomeCategoria = req.params.nome;
    const result = await pool.query(`
      SELECT 
        p.id_prodotto, 
        p.nome, 
        p.prezzo,
        p.descrizione,
        p.immagine,
        p.quantita_disponibile,
        m.nome AS marchio,
        c.nome AS categoria
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE c.nome = $1
    `, [nomeCategoria]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});
router.get('/brand', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nome, id_marchio
      FROM marchio
      ORDER BY nome
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});

module.exports = router;
