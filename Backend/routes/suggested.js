const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    // Prendi l’ultimo prodotto visualizzato
    const visualRes = await pool.query(
      'SELECT prodotto_id FROM visualizzazioni WHERE user_id = $1 ORDER BY visualizzato_il DESC LIMIT 3',
      [req.user.id]
    );
    const viewedIds = visualRes.rows.map(r => r.prodotto_id);
        if (viewedIds.length === 0) return res.json([]);
   
    // Prendi il prezzo dell’ultimo prodotto visualizzato
    const prodResLast = await pool.query(
    `SELECT categoria_id, prezzo FROM prodotti WHERE id = ANY($1)`,
    [viewedIds]
);
   if (prodResLast.rows.length === 0) return res.json([]);
    
    const categorie = [...new Set(prodResLast.rows.map(r => r.categoria_id))];
    const prezzi = prodResLast.rows.map(r => Number(r.prezzo));
    const minPrezzo = Math.round((Math.min(...prezzi) - 50) * 100) / 100;
    const maxPrezzo = Math.round((Math.max(...prezzi) + 50) * 100) / 100;

    const prodRes = await pool.query(
      `SELECT * FROM prodotti 
       WHERE id != ALL($1)
       AND categoria_id = ANY($2)
       AND prezzo BETWEEN $3  AND $4
       LIMIT 10`,
      [viewedIds, categorie, minPrezzo,  maxPrezzo]
    );
    console.log(minPrezzo)

   res.json(prodRes.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
 
});


module.exports = router;
