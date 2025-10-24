const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    // Prendi l’ultimo prodotto visualizzato
    const visualRes = await pool.query(
      'SELECT prodotto_id FROM visualizzazioni WHERE user_id = $1 ORDER BY visualizzato_at DESC LIMIT 3',
      [req.user.id]
    );
    const viewedIds = visualRes.rows.map(r => r.prodotto_id);
        if (viewedIds.length === 0) return res.json([]);
   
    // Prendi il prezzo dell’ultimo prodotto visualizzato
    const prodResLast = await pool.query(
    `SELECT 
     id_categoria, 
     CASE 
       WHEN promo = TRUE AND prezzo_scontato IS NOT NULL THEN prezzo_scontato
       ELSE prezzo
     END AS prezzo
   FROM prodotto 
   WHERE id_prodotto = ANY($1)`,
    [viewedIds]
);
   if (prodResLast.rows.length === 0) return res.json([]);

    const categorie = [...new Set(prodResLast.rows.map(r => r.id_categoria))];
    const prezzi = prodResLast.rows.map(r => Number(r.prezzo));
    const minPrezzo = Math.round((Math.min(...prezzi) - 50) * 100) / 100;
    const maxPrezzo = Math.round((Math.max(...prezzi) + 50) * 100) / 100;

    const prodRes = await pool.query(
      `SELECT * FROM prodotto 
      WHERE id_prodotto != ALL($1)
     AND id_categoria = ANY($2)
     AND (
       CASE 
         WHEN promo = TRUE AND prezzo_scontato IS NOT NULL THEN prezzo_scontato
         ELSE prezzo
       END
     ) BETWEEN $3 AND $4
   LIMIT 6`,
      [viewedIds, categorie, minPrezzo,  maxPrezzo]
    );

   const prodottiSuggeriti = prodRes.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    }));

   res.json(prodottiSuggeriti);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
 
});

router.post('/visualizza', authenticateToken, async (req, res) => {
  const { prodotto_id } = req.body;
  const user_id = req.user.id;
  try {
    // Inserisci o aggiorna la visualizzazione
    await pool.query(
      `INSERT INTO visualizzazioni (user_id, prodotto_id, visualizzato_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, prodotto_id)
       DO UPDATE SET visualizzato_at = NOW()`,
      [user_id, prodotto_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
