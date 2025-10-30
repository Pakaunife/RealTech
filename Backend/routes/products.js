const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/verifyadmin');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Ensure prezzo_scontato column exists so we can store discounted prices separately from the original price
pool.query('ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS prezzo_scontato numeric;').catch(err => {
  console.error('Could not ensure prezzo_scontato column exists:', err.message || err);
});

// Imposta prodotto in vetrina o promo
router.put('/:id/vetrina', authenticateToken, verifyAdmin, async (req, res) => {
  const { in_vetrina, promo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE prodotto SET in_vetrina = $1, promo = $2 WHERE id_prodotto = $3 RETURNING *',
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
    const result = await pool.query('SELECT * FROM prodotto WHERE in_vetrina = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni prodotti in promo
router.get('/promo', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prodotto WHERE promo = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/load',authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query('SELECT prodotto.*, c.nome as nome_categoria, m.nome as nome_marchio FROM prodotto  join categoria c on prodotto.id_categoria = c.id_categoria join marchio m on prodotto.id_marchio = m.id_marchio');
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
    // Insert: prezzo is the original price; prezzo_scontato stores a discounted price (nullable)
    const prezzoOriginal = Number(req.body.prezzo);
    let prezzoScontatoForInsert = null;
    if (req.body.promo) {
      if (req.body.prezzo_scontato != null) {
        prezzoScontatoForInsert = Number(req.body.prezzo_scontato);
      } else if (req.body.sconto != null) {
        const raw = prezzoOriginal * (1 - Number(req.body.sconto) / 100);
        prezzoScontatoForInsert = Math.round((raw + Number.EPSILON) * 100) / 100;
      }
    }
    await pool.query(
      `INSERT INTO prodotto (nome, descrizione, prezzo, prezzo_scontato, quantita_disponibile, id_categoria, id_marchio, immagine, in_vetrina, promo, bloccato) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        req.body.nome,
        req.body.descrizione,
        prezzoOriginal,
        prezzoScontatoForInsert,
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
  console.log('PUT /products/' + req.params.id + ' body:', req.body);
  // fetch existing product to determine prezzo (original) and prezzo_scontato
  const existingRes = await pool.query('SELECT * FROM prodotto WHERE id_prodotto = $1', [req.params.id]);
    if (existingRes.rowCount === 0) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }
    const existing = existingRes.rows[0];

    // For this schema we keep `prezzo` as the original price and `prezzo_scontato` as an optional discounted price.
    // Determine the base original price (prefer body.prezzo if provided, otherwise existing.prezzo)
    const baseOriginalPrice = req.body.prezzo != null ? Number(req.body.prezzo) : Number(existing.prezzo);

    let prezzoScontatoToPersist = existing.prezzo_scontato != null ? Number(existing.prezzo_scontato) : null;

    if (req.body.promo) {
      // If admin provided prezzo_scontato explicitly, use it.
      if (req.body.prezzo_scontato != null) {
        prezzoScontatoToPersist = Number(req.body.prezzo_scontato);
      } else if (req.body.sconto != null) {
        // Always compute sconto from the original price (baseOriginalPrice) to avoid compounding discounts
        const raw = baseOriginalPrice * (1 - Number(req.body.sconto) / 100);
        prezzoScontatoToPersist = Math.round((raw + Number.EPSILON) * 100) / 100;
      } else {
        // promo true but no sconto provided: keep existing prezzo_scontato if any, otherwise null
        prezzoScontatoToPersist = prezzoScontatoToPersist;
      }
    } else {
      // promo removed: clear prezzo_scontato
      prezzoScontatoToPersist = null;
    }

    const result = await pool.query(
      `UPDATE prodotto
       SET nome = $1,
           prezzo = $2,
           prezzo_scontato = $3,
           descrizione = $4,
           immagine = $5,
           quantita_disponibile = $6,
           id_categoria = $7,
           id_marchio = $8,
           in_vetrina = $9,
           promo = $10,
           bloccato = $11
       WHERE id_prodotto = $12
       RETURNING *`,
      [
        req.body.nome,
        baseOriginalPrice,
        prezzoScontatoToPersist,
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