const express = require('express');
const pool = require('../connection/DBconnect');

const router = express.Router();

// Prodotti in vetrina (selezionati dall'admin)
router.get('/vetrina', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_prodotto,
        p.nome,
        CASE WHEN p.promo = TRUE AND p.prezzo_scontato IS NOT NULL THEN p.prezzo_scontato ELSE p.prezzo END AS prezzo,
        p.prezzo_scontato,
        p.descrizione,
        p.immagine,
        p.quantita_disponibile,
        m.nome AS marchio,
        c.nome AS categoria
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE p.in_vetrina = TRUE
        AND p.bloccato = false
    `);

    const prodottiVetrina = result.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    }));

    res.json(prodottiVetrina);
  } catch (err) {
    console.error('Errore vetrina:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

module.exports = router;
