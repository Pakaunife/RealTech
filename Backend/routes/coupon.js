const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');
const authenticateToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/verifyadmin');

// Verifica e applica coupon
router.post('/verifica', authenticateToken, async (req, res) => {
  const { codice, totale_carrello } = req.body;
  const userId = req.user?.id; // ID utente loggato
  
  try {
    // Trova il coupon
    const result = await pool.query(
      `SELECT * FROM coupon 
       WHERE codice = $1 
       AND attivo = TRUE 
       AND (data_scadenza IS NULL OR data_scadenza >= CURRENT_DATE)
       AND (usi_massimi IS NULL OR usi_attuali < usi_massimi)`,
      [codice.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        valido: false, 
        messaggio: 'Coupon non valido, scaduto o esaurito' 
      });
    }

    const coupon = result.rows[0];

  
    if (coupon.uso_singolo && userId) {
      const utilizzoResult = await pool.query(
        'SELECT * FROM coupon_utilizzi WHERE coupon_id = $1 AND user_id = $2',
        [coupon.id, userId]
      );
      
      if (utilizzoResult.rows.length > 0) {
        return res.json({ 
          valido: false, 
          messaggio: 'Hai già utilizzato questo coupon' 
        });
      }
    }

    // Controlla importo minimo
    if (totale_carrello < coupon.importo_minimo) {
      return res.json({ 
        valido: false, 
        messaggio: `Importo minimo richiesto: €${coupon.importo_minimo}` 
      });
    }

    // Calcola sconto
    let sconto = 0;
    if (coupon.tipo_sconto === 'percentuale') {
      sconto = totale_carrello * (coupon.valore_sconto / 100);
    } else {
      sconto = Math.min(coupon.valore_sconto, totale_carrello);
    }

    const totale_scontato = Math.max(0, totale_carrello - sconto);

    res.json({ 
      valido: true, 
      coupon: {
        id: coupon.id,
        codice: coupon.codice,
        descrizione: coupon.descrizione,
        tipo_sconto: coupon.tipo_sconto,
        valore_sconto: coupon.valore_sconto
      },
      sconto: parseFloat(sconto.toFixed(2)),
      totale_originale: totale_carrello,
      totale_scontato: parseFloat(totale_scontato.toFixed(2)),
      messaggio: `Coupon applicato: ${coupon.descrizione}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      valido: false, 
      messaggio: 'Errore server' 
    });
  }
});

// Usa coupon (incrementa contatore utilizzi)
router.post('/usa', authenticateToken, async (req, res) => {
  const { coupon_id, ordine_id } = req.body;
  const userId = req.user.id;
  
  try {
    // Verifica che il coupon esista e sia valido
    const couponResult = await pool.query('SELECT * FROM coupon WHERE id = $1', [coupon_id]);
    
    if (couponResult.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon non trovato' });
    }
    
    const coupon = couponResult.rows[0];
    
    // ✅ NUOVO: Se uso singolo, registra l'utilizzo
    if (coupon.uso_singolo) {
      await pool.query(
        'INSERT INTO coupon_utilizzi (coupon_id, user_id) VALUES ($1, $2)',
        [coupon_id, userId]
      );
    }
    
    // Incrementa usi_attuali
    await pool.query(
      'UPDATE coupon SET usi_attuali = usi_attuali + 1 WHERE id = $1',
      [coupon_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Errore uso coupon:', err);
    res.status(500).json({ error: 'Errore nell\'uso del coupon' });
  }
});


router.get('/', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupon ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Errore GET coupon:', err);
    res.status(500).json({ error: 'Errore nel recupero dei coupon' });
  }
});

// POST - Crea nuovo coupon (solo admin)
router.post('/', authenticateToken, verifyAdmin, async (req, res) => {
  const { codice, descrizione, tipo_sconto, valore_sconto, importo_minimo, data_inizio, data_scadenza, usi_massimi, attivo, uso_singolo } = req.body;
  
  try {
    const esistente = await pool.query('SELECT * FROM coupon WHERE codice = $1', [codice]);
    
    if (esistente.rows.length > 0) {
      return res.status(409).json({ 
        exists: true, 
        coupon: esistente.rows[0],
        message: 'Coupon già esistente' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO coupon (codice, descrizione, tipo_sconto, valore_sconto, importo_minimo, data_inizio, data_scadenza, usi_massimi, attivo, uso_singolo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [codice, descrizione, tipo_sconto, valore_sconto, importo_minimo, data_inizio, data_scadenza, usi_massimi, attivo, uso_singolo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Errore POST coupon:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - Aggiorna coupon (solo admin)
router.put('/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { codice, descrizione, tipo_sconto, valore_sconto, importo_minimo, data_inizio, data_scadenza, usi_massimi, attivo, uso_singolo } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE coupon 
       SET codice = $1, descrizione = $2, tipo_sconto = $3, valore_sconto = $4, 
           importo_minimo = $5, data_inizio = $6, data_scadenza = $7, 
           usi_massimi = $8, attivo = $9, uso_singolo = $10
       WHERE id = $11
       RETURNING *`,
      [codice, descrizione, tipo_sconto, valore_sconto, importo_minimo, data_inizio, data_scadenza, usi_massimi, attivo, uso_singolo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Errore PUT coupon:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del coupon' });
  }
});

// DELETE - Rimuovi coupon (solo admin)
router.delete('/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM coupon WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon non trovato' });
    }
    
    res.json({ message: 'Coupon rimosso con successo', coupon: result.rows[0] });
  } catch (err) {
    console.error('Errore DELETE coupon:', err);
    res.status(500).json({ error: 'Errore nella rimozione del coupon' });
  }
});


module.exports = router;