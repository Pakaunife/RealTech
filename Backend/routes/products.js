const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');
const router = express.Router();
const path = require('path');
const fs = require('fs');

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

router.get('/load',authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prodotto');
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

router.post('/insert', authenticateToken, async (req, res) => {
  try
  {
    await pool.query(
      `INSERT INTO prodotto (nome, descrizione, prezzo, quantita_disponibile, id_categoria, id_marchio, immagine, in_vetrina, promo, bloccato) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.body.nome,
        req.body.descrizione,
        req.body.prezzo,
        req.body.quantita_disponibile,
        req.body.id_categoria,
        req.body.id_marchio,
        req.body.immagine,
        req.body.in_vetrina || false,
        req.body.promo || false,
        req.body.bloccato || false
      ]
    );
    res.json({ message: 'Prodotto inserito con successo' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE prodotto
       SET nome = $1,
           prezzo = $2,
           descrizione = $3,
           immagine = $4,
           quantita_disponibile = $5,
           id_categoria = $6,
           id_marchio = $7,
           in_vetrina = $8,
           promo = $9,
           bloccato = $10
       WHERE id_prodotto = $11
       RETURNING *`,
      [
        req.body.nome,
        req.body.prezzo,
        req.body.descrizione,
        req.body.immagine,
        req.body.quantita_disponibile,
        req.body.id_categoria,
        req.body.id_marchio,
        req.body.in_vetrina,
        req.body.promo,
        req.body.bloccato,
        req.params.id
      ]
    );
     if (req.body.immagine && req.body.immagineVecchia && req.body.immagine !== req.body.immagineVecchia) {
      const oldImagePath = path.join(__dirname, '../assets/prodotti/', req.body.immagineVecchia);
      fs.unlink(oldImagePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Errore eliminazione vecchia immagine:', err);
        }
         });
        }
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticateToken,async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) return res.status(400).json({ message: 'Nome prodotto mancante' });

    const result = await pool.query(
      `SELECT * FROM prodotto WHERE LOWER(nome) = LOWER($1)`,
      [nome]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;