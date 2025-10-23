const express = require('express');
const pool = require('../connection/DBconnect');
const router = express.Router();

// Ottieni tutti i pacchetti tematici
router.get('/', async (req, res) => {
  try { //gestisce errori
    //mettiamo dentro results tutti  i pkt per usarli anche nella query successiva
    const result = await pool.query(`
      SELECT
        id_pacchetto,
        nome,
        descrizione,
        prezzo_totale
      FROM pacchetto_tematico
      ORDER BY id_pacchetto
    `);

    //viene fatta una map +promise all in modo che per ogni pacchetto viene eseguita una query separata con quell'unico id ( $1) in modo parallelo (Promise.all)
    const pacchetti = await Promise.all(result.rows.map(async pacchetto => { //result.rows è un array di tutti i pacchetti tematici presi dal database. usiamo map per 
      // Calcola il prezzo effettivo sommando i prezzi scontati dei prodotti (se promo) o i prezzi normali
      const prodottiResult = await pool.query(`
        SELECT p.prezzo, p.prezzo_scontato, p.promo, pp.quantita
        FROM prodotto_pacchetto pp
        JOIN prodotto p ON pp.id_prodotto = p.id_prodotto
        WHERE pp.id_pacchetto = $1
      `, [pacchetto.id_pacchetto]); //pacchetto.id_pacchetto contiene il primo id pacchetto, poi il secondo, ecc. e li manda uno ad uno in $1, presi da result.rows.map
      let prezzoEffettivoPacchetto = 0;
      prodottiResult.rows.forEach(prod => {
        const quantita = prod.quantita || 1;
        prezzoEffettivoPacchetto += (prod.promo && prod.prezzo_scontato != null ? Number(prod.prezzo_scontato) : Number(prod.prezzo)) * quantita; //Per ogni prodotto del pacchetto controlla se il prodotto è in promo (prod.promo è true) e ha un prezzo scontato (prod.prezzo_scontato non è null), allora usa il prezzo scontato. Altrimenti usa il prezzo normale (prod.prezzo). Moltiplica il prezzo scelto per la quantità di quel prodotto nel pacchetto. Somma questo valore a prezzoEffettivoPacchetto.
      });
      /*  Cosa fa:
        1) Prima recupera tutti i pacchetti (result.rows).
        2) Poi, per ogni pacchetto, fa una query separata per i prodotti di quel pacchetto.
        3) Tutte queste query vengono avviate quasi in parallelo (Promise.all).
        4) Alla fine hai un array di risultati, uno per ogni pacchetto, con tutte le elaborazioni fatte.
        */
      prezzoEffettivoPacchetto = Math.round(prezzoEffettivoPacchetto * 100) / 100;
      const prezzoScontatoPacchetto = Math.round((prezzoEffettivoPacchetto * 0.85) * 100) / 100;
      return {
        /*
        id_pacchetto: pacchetto.id_pacchetto,
        nome: pacchetto.nome,
        descrizione: pacchetto.descrizione*/
        ...pacchetto,
        prezzo_originale: pacchetto.prezzo_totale,
        prezzo_scontato: prezzoScontatoPacchetto
      };
    }));

    res.json(pacchetti);
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
    const prezzoTotale = pacchetto.prezzo_totale != null ? Number(pacchetto.prezzo_totale) : 0;
    // Prodotti del pacchetto
    const prodottiResult = await pool.query(`
      SELECT 
        p.id_prodotto,
        p.nome,
        p.descrizione,
        p.prezzo,
        p.prezzo_scontato,
        p.promo,
        pp.quantita,
        m.nome as marchio,
        c.nome as categoria
      FROM prodotto_pacchetto pp
      JOIN prodotto p ON pp.id_prodotto = p.id_prodotto
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio 
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE pp.id_pacchetto = $1
    `, [pacchetto_id]);

    const prodotti = prodottiResult.rows.map(prodotto => ({
      ...prodotto //rende tutte le proprietà dell’oggetto prodotto
    }));
    //fa la stessa cosa di prima ma per un singolo pacchetto
    // Calcola il prezzo effettivo sommando i prezzi scontati dei prodotti (se promo) o i prezzi normali
    let prezzoEffettivoDettaglio = 0;
    prodottiResult.rows.forEach(prod => {
      const quantita = prod.quantita || 1;
      prezzoEffettivoDettaglio += (prod.promo && prod.prezzo_scontato != null ? Number(prod.prezzo_scontato) : Number(prod.prezzo)) * quantita;
    });
    prezzoEffettivoDettaglio = Math.round(prezzoEffettivoDettaglio * 100) / 100;
    const prezzoScontatoDettaglio = Math.round((prezzoEffettivoDettaglio * 0.85) * 100) / 100;
    res.json({
      pacchetto: {
        ...pacchetto,
        prezzo_originale: prezzoTotale,
        prezzo_scontato: prezzoScontatoDettaglio
      },
      prodotti: prodotti
    });
  } catch (err) {
    console.error('Errore nel recupero dettagli pacchetto:', err);
    res.status(500).json({ error: 'Errore nel recupero dettagli pacchetto' });
  }
});

module.exports = router;
