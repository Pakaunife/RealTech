const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const pool = require('../connection/DBconnect');

// --- API Catalogo ---
const router = express.Router();

// Tutti i prodotti
router.get('/prodotti', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_prodotto, 
        p.nome, 
        c.nome AS categoria, 
        m.nome AS marchio, 
        p.prezzo
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});

module.exports = router;
