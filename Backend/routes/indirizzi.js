const express = require('express');
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');
const router = express.Router();

// Aggiungi un indirizzo
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { indirizzo, citta, cap, provincia, paese, predefinito } = req.body;
  try {

    const checkDuplicate = await pool.query(
      `SELECT * FROM indirizzi 
       WHERE user_id = $1 
       AND LOWER(indirizzo) = LOWER($2) 
       AND LOWER(citta) = LOWER($3) 
       AND cap = $4`,
      [userId, indirizzo, citta, cap]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ message: 'Questo indirizzo è già presente' });
    }
    if (predefinito) {
      // Imposta tutti gli altri indirizzi come non predefiniti
      await pool.query(
        'UPDATE indirizzi SET predefinito = FALSE WHERE user_id = $1',
        [userId]
      );
    }
    const result = await pool.query(
      `INSERT INTO indirizzi (user_id, indirizzo, citta, cap, provincia, paese, predefinito)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, indirizzo, citta, cap, provincia, paese, predefinito || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni tutti gli indirizzi dell’utente
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM indirizzi WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Imposta un indirizzo come predefinito
router.put('/:id/predefinito', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const indirizzoId = req.params.id;
  try {
    await pool.query(
      'UPDATE indirizzi SET predefinito = FALSE WHERE user_id = $1',
      [userId]
    );
    await pool.query(
      'UPDATE indirizzi SET predefinito = TRUE WHERE id = $1 AND user_id = $2',
      [indirizzoId, userId]
    );
    res.json({ message: 'Indirizzo impostato come predefinito' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const indirizzoId = req.params.id;
  const { indirizzo, citta, cap, provincia, paese, predefinito } = req.body;
  
  try {
    // Verifica che l'indirizzo appartenga all'utente
    const checkOwnership = await pool.query(
      'SELECT * FROM indirizzi WHERE id = $1 AND user_id = $2',
      [indirizzoId, userId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ message: 'Indirizzo non trovato' });
    }

    // Controlla duplicati (escludi l'indirizzo corrente)
    const checkDuplicate = await pool.query(
      `SELECT * FROM indirizzi 
       WHERE user_id = $1 
       AND id != $2
       AND LOWER(indirizzo) = LOWER($3) 
       AND LOWER(citta) = LOWER($4) 
       AND cap = $5`,
      [userId, indirizzoId, indirizzo, citta, cap]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ message: 'Questo indirizzo è già presente' });
    }

    // Se viene impostato come predefinito, rimuovi il flag dagli altri
    if (predefinito) {
      await pool.query(
        'UPDATE indirizzi SET predefinito = FALSE WHERE user_id = $1',
        [userId]
      );
    }

    // Aggiorna l'indirizzo
    const result = await pool.query(
      `UPDATE indirizzi 
       SET indirizzo = $1, citta = $2, cap = $3, provincia = $4, paese = $5, predefinito = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [indirizzo, citta, cap, provincia, paese, predefinito || false, indirizzoId, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Errore nella modifica indirizzo:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const indirizzoId = req.params.id;
  
  console.log('DELETE indirizzo:', indirizzoId, 'per user:', userId);
  
  try {
    const result = await pool.query(
      'DELETE FROM indirizzi WHERE id = $1 AND user_id = $2 RETURNING *',
      [indirizzoId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Indirizzo non trovato' });
    }
    
    res.json({ message: 'Indirizzo eliminato con successo' });
  } catch (err) {

    res.status(500).json({ message: err.message });
  }
});

module.exports = router;