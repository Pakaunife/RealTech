const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');

// Verifica e applica coupon
router.post('/verifica', async (req, res) => {
  const { codice, totale_carrello } = req.body;
  
  try {
    // Trova il coupon (nomi colonne corretti)
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
router.post('/usa', async (req, res) => {
  const { coupon_id } = req.body;
  try {
    await pool.query(
      `UPDATE coupon SET usi_attuali = usi_attuali + 1 WHERE id = $1`,
      [coupon_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'uso del coupon' });
  }
});

module.exports = router;