const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');

// Processa acquisto dal carrello
router.post('/checkout', async (req, res) => {
  const { 
    id_utente, 
    metodo_pagamento, 
    nome_intestatario, 
    numero_carta_mascherato 
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Ottieni tutti i prodotti nel carrello dell'utente
    const carrelloResult = await client.query(`
      SELECT c.*, p.nome, p.prezzo, p.quantita_disponibile
      FROM carrello c
      JOIN prodotto p ON c.id_prodotto = p.id_prodotto
      WHERE c.id_utente = $1
    `, [id_utente]);
    
    if (carrelloResult.rows.length === 0) {
      throw new Error('Carrello vuoto');
    }
    
    const carrello = carrelloResult.rows;
    let totaleAcquisto = 0;
    
    // 2. Verifica disponibilità e calcola totale
    for (const item of carrello) {
      if (item.quantita > item.quantita_disponibile) {
        throw new Error(`Quantità non disponibile per ${item.nome}. Disponibili: ${item.quantita_disponibile}`);
      }
      totaleAcquisto += item.prezzo * item.quantita;
    }
    
    // 3. Registra ogni acquisto nella tabella acquisti
    const acquisti = [];
    for (const item of carrello) {
      const acquisto = await client.query(`
        INSERT INTO acquisti (
          id_utente, id_prodotto, quantita, prezzo_unitario, 
          metodo_pagamento, nome_intestatario, numero_carta_mascherato
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        id_utente, 
        item.id_prodotto, 
        item.quantita, 
        item.prezzo,
        metodo_pagamento,
        nome_intestatario,
        numero_carta_mascherato
      ]);
      
      acquisti.push(acquisto.rows[0]);
      
      // 4. Aggiorna la quantità disponibile del prodotto
      await client.query(`
        UPDATE prodotto 
        SET quantita_disponibile = quantita_disponibile - $1 
        WHERE id_prodotto = $2
      `, [item.quantita, item.id_prodotto]);
    }
    
    // 5. Svuota il carrello dell'utente
    await client.query('DELETE FROM carrello WHERE id_utente = $1', [id_utente]);
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Acquisto completato con successo',
      acquisti: acquisti,
      totale: totaleAcquisto
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore durante il checkout:', err);
    res.status(400).json({ 
      error: err.message || 'Errore durante il processo di acquisto' 
    });
  } finally {
    client.release();
  }
});

// Ottieni storico acquisti dell'utente
router.get('/storico/:id_utente', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, p.nome as nome_prodotto, p.immagine,
             CASE 
               WHEN p.immagine IS NOT NULL 
               THEN CONCAT('http://localhost:3000/api/images/prodotti/', p.immagine)
               ELSE 'http://localhost:3000/api/images/prodotti/default.jpg'
             END as immagine_url
      FROM acquisti a
      JOIN prodotto p ON a.id_prodotto = p.id_prodotto
      WHERE a.id_utente = $1
      ORDER BY a.data_acquisto DESC
    `, [req.params.id_utente]);
    
    res.json(rows);
  } catch (err) {
    console.error('Errore recupero storico acquisti:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni dettagli di un singolo acquisto
router.get('/dettaglio/:id_acquisto', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, p.nome as nome_prodotto, p.immagine,
             CASE 
               WHEN p.immagine IS NOT NULL 
               THEN CONCAT('http://localhost:3000/api/images/prodotti/', p.immagine)
               ELSE 'http://localhost:3000/api/images/prodotti/default.jpg'
             END as immagine_url
      FROM acquisti a
      JOIN prodotto p ON a.id_prodotto = p.id_prodotto
      WHERE a.id_acquisto = $1
    `, [req.params.id_acquisto]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Acquisto non trovato' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Errore recupero dettaglio acquisto:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;