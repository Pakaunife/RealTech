const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');

// Aggiungi prodotto al carrello
router.post('/aggiungi', async (req, res) => {
  const { id_utente, id_prodotto, quantita } = req.body;
  
  try {
    // Verifica se il prodotto è già nel carrello
    const esistente = await pool.query(
      'SELECT * FROM carrello WHERE id_utente = $1 AND id_prodotto = $2',
      [id_utente, id_prodotto]
    );
    
    if (esistente.rows.length > 0) {
      // Aggiorna quantità
      await pool.query(
        'UPDATE carrello SET quantita = quantita + $1 WHERE id_utente = $2 AND id_prodotto = $3',
        [quantita, id_utente, id_prodotto]
      );
    } else {
      // Inserisci nuovo prodotto
      await pool.query(
        'INSERT INTO carrello (id_utente, id_prodotto, quantita) VALUES ($1, $2, $3)',
        [id_utente, id_prodotto, quantita]
      );
    }
    
    res.json({ success: true, message: 'Prodotto aggiunto al carrello' });
  } catch (err) {
    console.error('Errore in /aggiungiPacchetto:', err.stack || err);
    //debug log
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiungi pacchetto al carrello (salvato nella tabella carrello_pacchetto)
router.post('/aggiungiPacchetto', async (req, res) => {
  console.log('Richiesta di aggiunta pacchetto al carrello:', req.body);
  const { id_utente, id_pacchetto, quantita } = req.body;

  try {
    // Verifica se il pacchetto è già nel carrello
    const esistente = await pool.query(
      'SELECT * FROM carrello_pacchetto WHERE id_utente = $1 AND id_pacchetto = $2',
      [id_utente, id_pacchetto]
    );

    if (esistente.rows.length > 0) {
      // Aggiorna quantità
      await pool.query(
        'UPDATE carrello_pacchetto SET quantita = quantita + $1 WHERE id_utente = $2 AND id_pacchetto = $3',
        [quantita, id_utente, id_pacchetto]
      );
    } else {
      // Inserisci nuovo pacchetto
      await pool.query(
        'INSERT INTO carrello_pacchetto (id_utente, id_pacchetto, quantita) VALUES ($1, $2, $3)',
        [id_utente, id_pacchetto, quantita]
      );
    }

    res.json({ success: true, message: 'Pacchetto aggiunto al carrello' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni carrello dell'utente, Scopo: permettere al frontend di mostrare insieme prodotti singoli e pacchetti.
router.get('/:id_utente', async (req, res) => {
  try {
    const idUtente = req.params.id_utente;

    // Recupera prodotti nel carrello (includi informazioni promo/prezzo_scontato)
    const prodottiRes = await pool.query(`
      SELECT c.id_prodotto, c.quantita, p.nome, p.prezzo, p.prezzo_scontato, p.promo, p.immagine
      FROM carrello c
      JOIN prodotto p ON c.id_prodotto = p.id_prodotto
      WHERE c.id_utente = $1
      ORDER BY c.id_prodotto
    `, [idUtente]);

    const prodotti = prodottiRes.rows.map(item => {
      // Se il prodotto è in promo e prezzo_scontato è valorizzato, usare quello
      const prezzoUsato = (item.promo && item.prezzo_scontato != null) ? Number(item.prezzo_scontato) : Number(item.prezzo);
      return {
        tipo: 'prodotto',
        id_prodotto: item.id_prodotto,
        quantita: item.quantita,
        nome: item.nome,
        prezzo: Math.round(prezzoUsato * 100) / 100,
        immagine: item.immagine,
        immagine_url: item.immagine ? `http://localhost:3000/api/images/prodotti/${item.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
      };
    });

    // Recupera pacchetti nel carrello
    const pacchettiRes = await pool.query(`
      SELECT cp.id_pacchetto, cp.quantita, pt.nome, pt.prezzo_totale
      FROM carrello_pacchetto cp
      JOIN pacchetto_tematico pt ON cp.id_pacchetto = pt.id_pacchetto
      WHERE cp.id_utente = $1
      ORDER BY cp.id_pacchetto
    `, [idUtente]);

    // Per ogni pacchetto, calcola il prezzo scontato come nel pacchetti.js
    const pacchetti = await Promise.all(pacchettiRes.rows.map(async item => {
      // Recupera i prodotti del pacchetto
      const prodottiResult = await pool.query(`
        SELECT p.prezzo, p.prezzo_scontato, p.promo, pp.quantita
        FROM prodotto_pacchetto pp
        JOIN prodotto p ON pp.id_prodotto = p.id_prodotto
        WHERE pp.id_pacchetto = $1
      `, [item.id_pacchetto]); //Qui, [item.id_pacchetto] indica che $1 sarà sostituito dal valore di item.id_pacchetto.
      let prezzoEffettivoPacchetto = 0;
      prodottiResult.rows.forEach(prod => { //per ogni prodotto del pacchetto
        const quantita = prod.quantita || 1;
        prezzoEffettivoPacchetto += (prod.promo && prod.prezzo_scontato != null ? Number(prod.prezzo_scontato) : Number(prod.prezzo)) * quantita;
      });
      prezzoEffettivoPacchetto = Math.round(prezzoEffettivoPacchetto * 100) / 100;
      const prezzoScontatoPacchetto = Math.round((prezzoEffettivoPacchetto * 0.85) * 100) / 100;
      return { //risposta al frontend,Il frontend usa questi dati per mostrare il carrello all’utente, calcolare il totale, gestire quantità, ecc.
        tipo: 'pacchetto',
        id_pacchetto: item.id_pacchetto,
        quantita: item.quantita,
        nome: item.nome,
        prezzo: prezzoScontatoPacchetto
      };
    }));

    // Unisci prodotti e pacchetti
    const carrello = [...prodotti, ...pacchetti];

    res.json(carrello);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/rimuovi-pacchetto/:id_utente/:id_pacchetto', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM carrello_pacchetto WHERE id_utente = $1 AND id_pacchetto = $2',
      [req.params.id_utente, req.params.id_pacchetto]
    );
    res.json({ success: true, message: 'Pacchetto rimosso dal carrello' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Rimuovi prodotto dal carrello
router.delete('/rimuovi/:id_utente/:id_prodotto', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM carrello WHERE id_utente = $1 AND id_prodotto = $2',
      [req.params.id_utente, req.params.id_prodotto]
    );
    
    res.json({ success: true, message: 'Prodotto rimosso dal carrello' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Rimuovi pacchetto dal carrello
router.delete('/rimuoviPacchetto/:id_utente/:id_pacchetto', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM carrello_pacchetto WHERE id_utente = $1 AND id_pacchetto = $2',
      [req.params.id_utente, req.params.id_pacchetto]
    );

    res.json({ success: true, message: 'Pacchetto rimosso dal carrello' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna quantità pacchetto
router.put('/aggiornaPacchetto', async (req, res) => {
  const { id_utente, id_pacchetto, quantita } = req.body;

  try {
    if (quantita <= 0) {
      // Se quantità <= 0, rimuovi il pacchetto
      await pool.query(
        'DELETE FROM carrello_pacchetto WHERE id_utente = $1 AND id_pacchetto = $2',
        [id_utente, id_pacchetto]
      );
    } else {
      // Aggiorna quantità
      await pool.query(
        'UPDATE carrello_pacchetto SET quantita = $1 WHERE id_utente = $2 AND id_pacchetto = $3',
        [quantita, id_utente, id_pacchetto]
      );
    }

    res.json({ success: true, message: 'Pacchetto aggiornato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna quantità
router.put('/aggiorna', async (req, res) => {
  const { id_utente, id_prodotto, quantita } = req.body;
  
  try {
    if (quantita <= 0) {
      // Se quantità <= 0, rimuovi il prodotto
      await pool.query(
        'DELETE FROM carrello WHERE id_utente = $1 AND id_prodotto = $2',
        [id_utente, id_prodotto]
      );
    } else {
      // Aggiorna quantità
      await pool.query(
        'UPDATE carrello SET quantita = $1 WHERE id_utente = $2 AND id_prodotto = $3',
        [quantita, id_utente, id_prodotto]
      );
    }
    
    res.json({ success: true, message: 'Carrello aggiornato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
