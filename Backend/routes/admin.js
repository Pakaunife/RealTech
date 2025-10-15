const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');


router.patch('/users/:id/block', authenticateToken,async (req, res) => {
  const userId = req.params.id;
  const user = await pool.query('SELECT is_blocked FROM utenti WHERE id = $1', [userId]);
  if (user.rows.length === 0) return res.status(404).send('Utente non trovato');
  const newStatus = !user.rows[0].is_blocked;
  await pool.query('UPDATE utenti SET is_blocked = $1 WHERE id = $2', [newStatus, userId]);
  res.json({ success: true, is_blocked: newStatus });
});

router.patch('/users/:id/admin', authenticateToken,async (req, res) => {
  const userId = req.params.id;
  const { ruolo } = req.body;
  await pool.query('UPDATE utenti SET ruolo = $1 WHERE id = $2', [ruolo, userId]);
  res.json({ success: true, ruolo });
});

router.get('/statistiche-utenti',  authenticateToken,async (req, res) => {
  const userId = req.user.id;
  try {
    console.log('Richiesta statistiche utenti admin');
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nome,
        u.cognome,
        u.email,
        u.is_blocked,
        u.ruolo,
        COUNT(o.id) as numero_ordini,
        COALESCE(SUM(o.totale), 0) as totale_speso,
        MAX(o.data_ordine) as ultimo_ordine
      FROM utenti u
      LEFT JOIN ordini o ON u.id = o.user_id
      where u.id != $1
      GROUP BY u.id, u.nome, u.cognome, u.email, u.is_blocked, u.ruolo
      ORDER BY numero_ordini DESC, totale_speso DESC
    `, [userId]);
    
    console.log('Statistiche trovate:', result.rows.length, 'utenti');
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero statistiche utenti:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Endpoint per ordini di un utente specifico (per l'admin)
router.get('/users/:userId/ordini', authenticateToken, async (req, res) => {
  const userId = req.params.userId;
  try {
    console.log('Richiesta ordini per utente ID:', userId);
    
    const result = await pool.query(`
      SELECT 
        o.id,
        o.totale,
        o.stato,
        o.data_ordine,
        o.metodo_pagamento,
        COALESCE(SUM(op.quantita), 0) as numero_prodotti  
      FROM ordini o
      LEFT JOIN ordine_prodotti op ON o.id = op.ordine_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.totale, o.stato, o.data_ordine, o.metodo_pagamento
      ORDER BY o.data_ordine DESC
    `, [userId]);
    
    console.log('Ordini trovati per utente', userId, ':', result.rows.length, 'ordini');
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero ordini utente:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/prodotti/:id', authenticateToken, async (req, res) => {
  const prodottoId = req.params.id;
  
  try {
    console.log('Richiesta rimozione prodotto ID:', prodottoId);
    
    // Verifica se il prodotto esiste
    const checkResult = await pool.query(
      'SELECT * FROM prodotto WHERE id_prodotto = $1',
      [prodottoId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    
    // Verifica se ci sono ordini associati a questo prodotto
    const ordersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM ordine_prodotti WHERE prodotto_id = $1',
      [prodottoId]
    );
    
    if (parseInt(ordersCheck.rows[0].count) > 0) {
      // Se ci sono ordini, marca il prodotto come bloccato invece di eliminarlo
      await pool.query(
        'UPDATE prodotto SET bloccato = true WHERE id_prodotto = $1',
        [prodottoId]
      );
      
      return res.json({ 
        message: 'Prodotto marcato come bloccato (aveva ordini associati)',
        action: 'blocked'
      });
    }
    
    // Se non ci sono ordini, elimina definitivamente
    const deleteResult = await pool.query(
      'DELETE FROM prodotto WHERE id_prodotto = $1 RETURNING *',
      [prodottoId]
    );
    
    console.log('Prodotto eliminato:', deleteResult.rows[0]);
    
    res.json({ 
      message: 'Prodotto eliminato con successo',
      action: 'deleted',
      prodotto: deleteResult.rows[0]
    });
    
  } catch (err) {
    console.error('Errore nella rimozione del prodotto:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.get('/ordini/:ordineId/dettaglio', authenticateToken, async (req, res) => {
  const ordineId = req.params.ordineId;
  try {
    console.log('Richiesta dettaglio ordine ID:', ordineId);
    
    // Informazioni ordine
    const ordineResult = await pool.query(`
      SELECT 
        o.*,
        u.nome as nome_cliente,
        u.cognome as cognome_cliente,
        u.email as email_cliente
      FROM ordini o
      JOIN utenti u ON o.user_id = u.id
      WHERE o.id = $1
    `, [ordineId]);
    
    if (ordineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    // Prodotti dell'ordine 
    const prodottiResult = await pool.query(`
      SELECT 
        p.nome,
        op.quantita,
        op.prezzo as prezzo_unitario,  -- <-- prezzo dalla tabella ordine_prodotti
        (op.quantita * op.prezzo) as subtotale
      FROM ordine_prodotti op
      JOIN prodotto p ON op.prodotto_id = p.id_prodotto
      WHERE op.ordine_id = $1
    `, [ordineId]);
    
    res.json({
      ordine: ordineResult.rows[0],
      prodotti: prodottiResult.rows
    });
  } catch (err) {
    console.error('Errore nel recupero dettaglio ordine:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// AGGIUNGI endpoint per aggiornare stato ordine
router.patch('/ordini/:ordineId/stato', authenticateToken, async (req, res) => {
  const ordineId = req.params.ordineId;
  const { stato } = req.body;
  
  try {
    console.log('Aggiornamento stato ordine ID:', ordineId, 'nuovo stato:', stato);
    
    const result = await pool.query(`
      UPDATE ordini 
      SET stato = $1 
      WHERE id = $2 
      RETURNING *
    `, [stato, ordineId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    console.log('Stato ordine aggiornato:', result.rows[0]);
    res.json({ message: 'Stato aggiornato con successo', ordine: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiornamento stato ordine:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});


module.exports = router;