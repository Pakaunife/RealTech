const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Crea un nuovo ordine (con indirizzo e prodotti)
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { indirizzo_consegna, prodotti, totale } = req.body;
  try {
    const pagamentoOk = true;
    if (!pagamentoOk) {
      return res.status(400).json({ message: 'Pagamento fallito' });
    }
    // Crea ordine
    const ordineRes = await pool.query(
      'INSERT INTO ordini (user_id, indirizzo_consegna, totale, stato) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, indirizzo_consegna, totale, 'confermato']
    );
    const ordineId = ordineRes.rows[0].id;
    // Inserisci prodotti nell’ordine
    for (const p of prodotti) {
      await pool.query(
        'INSERT INTO ordine_prodotti (ordine_id, prodotto_id, quantita) VALUES ($1, $2, $3)',
        [ordineId, p.prodotto_id, p.quantita]
      );
    }
    res.json({ message: 'Ordine confermato', ordine_id: ordineId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni lo storico degli ordini dell'utente loggato
router.get('/storico', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT * FROM ordini WHERE user_id = $1 ORDER BY data_ordine DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni lo stato di un ordine specifico
router.get('/:id/stato', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const ordineId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT stato FROM ordini WHERE id = $1 AND user_id = $2`,
      [ordineId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    res.json({ stato: result.rows[0].stato });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM ordini WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero ordini' });
  }
});

router.get('/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  try {
    console.log('Recupero dettagli ordine ID:', orderId); // Debug
    
    const ordineResult = await pool.query(
      `SELECT 
         id, 
         user_id, 
         indirizzo_consegna, 
         totale_originale,
         sconto_coupon,
         totale, 
         stato, 
         data_ordine,
         metodo_pagamento,
         nome_intestatario,
         numero_carta_mascherato,
         coupon_utilizzato
       FROM ordini WHERE id = $1`, [orderId]
    );
    
    if (ordineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    const ordine = ordineResult.rows[0];
    console.log('Ordine recuperato dal database:', ordine); // Debug

    const prodottiResult = await pool.query(
      `SELECT 
         p.nome,
         p.immagine, 
         op.quantita, 
         op.prezzo AS prezzo_unitario,
         (op.quantita * op.prezzo) AS subtotale,
         CASE 
           WHEN p.immagine IS NOT NULL 
           THEN CONCAT('http://localhost:3000/api/images/prodotti/', p.immagine)
           ELSE 'http://localhost:3000/api/images/prodotti/default.jpg'
         END as immagine_url
       FROM ordine_prodotti op
       JOIN prodotto p ON op.prodotto_id = p.id_prodotto
       WHERE op.ordine_id = $1`, [orderId]
    );

    console.log('Prodotti recuperati:', prodottiResult.rows); // Debug

    res.json({ 
      ordine: ordine, 
      prodotti: prodottiResult.rows 
    });
    
  } catch (err) {
    console.error('Errore nel recupero dettagli ordine:', err);
    res.status(500).json({ error: 'Errore nel recupero dettagli ordine' });
  }
});


router.get('/tracking/:id', async (req, res) => {
  try {
    const idOrdine = req.params.id;
    const result = await pool.query(
      `SELECT * FROM tracking_ordine  WHERE id_ordine = $1 ORDER BY data_aggiornamento DESC LIMIT 1`, [idOrdine]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tracking non trovato' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel tracking ordine' });
  }
});;



module.exports = router;