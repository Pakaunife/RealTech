const express = require('express');
const pool = require('../connection/DBconnect');
const router = express.Router();

// Ottieni tutti i pacchetti tematici con i prodotti associati
router.get('/', async (req, res) => {
  try {
    // Query per ottenere i pacchetti con i prodotti associati
    // Calcola dinamicamente il prezzo totale del pacchetto usando prezzo_scontato quando presente per ogni prodotto
    const result = await pool.query(`
      SELECT 
        pt.id_pacchetto,
        pt.nome,
        pt.descrizione, 
        -- Somma delle quantità * prezzo effettivo (prezzo_scontato se promo, altrimenti prezzo)
        COALESCE(SUM(pp.quantita * (CASE WHEN p.promo = TRUE AND p.prezzo_scontato IS NOT NULL THEN p.prezzo_scontato ELSE p.prezzo END)), 0) AS prezzo_totale,
        pt.immagine,
        COUNT(pp.id_prodotto) as numero_prodotti
      FROM pacchetto_tematico pt
      LEFT JOIN prodotto_pacchetto pp ON pt.id_pacchetto = pp.id_pacchetto
      LEFT JOIN prodotto p ON pp.id_prodotto = p.id_prodotto
      GROUP BY pt.id_pacchetto, pt.nome, pt.descrizione, pt.immagine
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
        p.prezzo_scontato,
        p.promo,
        p.immagine,
        pp.quantita,
        m.nome as marchio,
        c.nome as categoria,
        -- prezzo effettivo per questo prodotto nel pacchetto
        CASE WHEN p.promo = TRUE AND p.prezzo_scontato IS NOT NULL THEN p.prezzo_scontato ELSE p.prezzo END AS prezzo_effettivo
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

    // Calcola il prezzo totale lato server (sommando prezzo_effettivo * quantita)
    const prezzoTotaleCalcolato = prodottiConUrl.reduce((sum, p) => sum + (Number(p.prezzo_effettivo || p.prezzo) * Number(p.quantita || 0)), 0);

    // Se almeno un prodotto del pacchetto è in promo o il prezzo calcolato differisce da quello memorizzato, aggiorna la tabella
    const anyPromo = prodottiConUrl.some(p => p.promo === true);
    const prezzoMemorizzato = pacchetto.prezzo_totale != null ? Number(pacchetto.prezzo_totale) : null;
    if (anyPromo || prezzoMemorizzato === null || Number(prezzoTotaleCalcolato) !== prezzoMemorizzato) {
      try {
        await pool.query('UPDATE pacchetto_tematico SET prezzo_totale = $1 WHERE id_pacchetto = $2', [prezzoTotaleCalcolato, pacchetto_id]);
        // aggiorna l'oggetto restituito
        pacchetto.prezzo_totale = prezzoTotaleCalcolato;
      } catch (updateErr) {
        console.error('Errore aggiornamento prezzo_totale pacchetto:', updateErr);
      }
    } else {
      // non cambiare il prezzo memorizzato
      pacchetto.prezzo_totale = prezzoMemorizzato;
    }

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