const express = require('express');
const pool = require('../connection/DBconnect');
const router = express.Router();

// Ottieni tutti i pacchetti tematici con i prodotti associati
router.get('/', async (req, res) => {
  try {
    // Query per ottenere i pacchetti con i prodotti associati
    const result = await pool.query(`
      SELECT 
        pt.id_pacchetto,
        pt.nome,
        pt.descrizione, 
        pt.prezzo_totale,
        pt.immagine,
        COUNT(pp.id_prodotto) as numero_prodotti
      FROM pacchetto_tematico pt
      LEFT JOIN prodotto_pacchetto pp ON pt.id_pacchetto = pp.id_pacchetto
      GROUP BY pt.id_pacchetto, pt.nome, pt.descrizione, pt.prezzo_totale, pt.immagine
      ORDER BY pt.id_pacchetto
    `);

    // Aggiungi URL completo dell'immagine a ogni pacchetto
    const pacchettiConUrl = result.rows.map(pacchetto => ({
      ...pacchetto,
      immagine_url: pacchetto.immagine ? 
        `http://localhost:3000/api/images/pacchetti/${pacchetto.immagine}` : 
        'http://localhost:3000/api/images/pacchetti/default.jpg'
    }));

    res.json(pacchettiConUrl);
  } catch (err) {
    console.error('Errore nel recupero pacchetti:', err);
    res.status(500).json({ error: 'Errore nel recupero dei pacchetti' });
  }
});

// Ottieni dettagli di un singolo pacchetto con tutti i prodotti
router.get('/:id', async (req, res) => {
  try {
    const pacchetto_id = req.params.id;

    // Informazioni del pacchetto
    const pacchettoResult = await pool.query(`
      SELECT * FROM pacchetto_tematico WHERE id_pacchetto = $1
    `, [pacchetto_id]);

    if (pacchettoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pacchetto non trovato' });
    }

    const pacchetto = pacchettoResult.rows[0];

    // Prodotti del pacchetto
    const prodottiResult = await pool.query(`
      SELECT 
        p.id_prodotto,
        p.nome,
        p.descrizione,
        p.prezzo,
        p.immagine,
        pp.quantita,
        m.nome as marchio,
        c.nome as categoria
      FROM prodotto_pacchetto pp
      JOIN prodotto p ON pp.id_prodotto = p.id_prodotto
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio 
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE pp.id_pacchetto = $1
    `, [pacchetto_id]);

    // Aggiungi URL immagini ai prodotti
    const prodottiConUrl = prodottiResult.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? 
        `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 
        'http://localhost:3000/api/images/prodotti/default.jpg'
    }));

    // Aggiungi URL immagine al pacchetto
    pacchetto.immagine_url = pacchetto.immagine ? 
      `http://localhost:3000/api/images/pacchetti/${pacchetto.immagine}` : 
      'http://localhost:3000/api/images/pacchetti/default.jpg';

    res.json({
      pacchetto: pacchetto,
      prodotti: prodottiConUrl
    });
  } catch (err) {
    console.error('Errore nel recupero dettagli pacchetto:', err);
    res.status(500).json({ error: 'Errore nel recupero dettagli pacchetto' });
  }
});

module.exports = router;