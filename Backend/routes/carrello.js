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
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni carrello dell'utente
router.get('/:id_utente', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, p.nome, p.prezzo, p.immagine
      FROM carrello c
      JOIN prodotto p ON c.id_prodotto = p.id_prodotto
      WHERE c.id_utente = $1
    `, [req.params.id_utente]);
    
    // Aggiungi URL completo dell'immagine a ogni prodotto del carrello
    const carrelloConUrl = rows.map(item => ({
      ...item,
      immagine_url: item.immagine ? `http://localhost:3000/api/images/prodotti/${item.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    }));
    
    res.json(carrelloConUrl);
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
