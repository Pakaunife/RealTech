const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');

// Funzione per mascherare il numero carta
function mascheraNumeroCarta(numeroCompleto) {
  if (!numeroCompleto) return null;
  const numero = numeroCompleto.replace(/\s/g, ''); 
  if (numero.length < 4) return '****';
  return '**** **** **** ' + numero.slice(-4);
}

// Processa acquisto dal carrello
//Il frontend invia tutti i dati dell’ordine (utente, prodotti, pagamento, indirizzo, ecc.) tramite una richiesta POST a /checkout.
//Il backend riceve questi dati, verifica il carrello, controlla la disponibilità dei prodotti, applica eventuali sconti/coupon, registra l’ordine e svuota il carrello.
router.post('/checkout', async (req, res) => {
  
  if (!id_utente) {
    return res.status(400).json({ 
      error: 'ID utente mancante' 
    });
  }
  // Verifica che l'indirizzo sia presente
  if (!indirizzo_consegna) {
    return res.status(400).json({ 
      error: 'Indirizzo di consegna mancante' 
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Ottieni tutti i prodotti nel carrello dell'utente (includi promo/prezzo_scontato)
    const carrelloResult = await client.query(`
      SELECT c.*, p.nome, p.prezzo, p.prezzo_scontato, p.promo, p.quantita_disponibile
      FROM carrello c
      JOIN prodotto p ON c.id_prodotto = p.id_prodotto
      WHERE c.id_utente = $1
    `, [id_utente]);
    
    if (carrelloResult.rows.length === 0) {
      throw new Error('Carrello vuoto');
    }
    
    const carrello = carrelloResult.rows;
    let totaleCalcolato = 0;

    // 2. Verifica disponibilità e calcola totale usando prezzo scontato se il prodotto è in promo
    for (const item of carrello) {
      if (item.quantita > item.quantita_disponibile) {
        throw new Error(`Quantità non disponibile per ${item.nome}. Disponibili: ${item.quantita_disponibile}`);
      }
      const prezzoUsato = (item.promo && item.prezzo_scontato != null) ? Number(item.prezzo_scontato) : Number(item.prezzo);
      // salva il prezzo effettivo nell'item così lo puoi riutilizzare quando inserisci ordine/acquisti
      item.prezzo_eff = Math.round(prezzoUsato * 100) / 100;
      totaleCalcolato += item.prezzo_eff * item.quantita;
    }
    
    // Usa il totale passato dal frontend (con eventuali sconti applicati)
    const totaleOriginaleFinale = totale_originale || totaleCalcolato;
    const scontoFinale = sconto_applicato || 0;
    const totaleFinale = totale || totaleCalcolato;
    
    // 3. Crea l'ordine principale nella tabella ordini
    const ordineResult = await client.query(`
      INSERT INTO ordini (
        user_id, 
        indirizzo_consegna,
        totale_originale,
        sconto_coupon,
        totale, 
        stato, 
        data_ordine,
        metodo_pagamento,
        nome_intestatario,
        numero_carta_mascherato,
        coupon_utilizzato
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      id_utente,
      indirizzo_consegna,
      totaleOriginaleFinale,  
      scontoFinale,           
      totaleFinale,
      'In lavorazione',
      new Date(),
      metodo_pagamento,
      nome_intestatario,
      mascheraNumeroCarta(numero_carta),
      coupon_applicato ? coupon_applicato.codice : null
    ]);
    
    const ordine = ordineResult.rows[0];
    const ordineId = ordine.id;
    
    // 4. Inserisci i prodotti dell'ordine in ordine_prodotti
    const prodottiOrdine = [];
    for (const item of carrello) {
      const prodottoOrdine = await client.query(`
        INSERT INTO ordine_prodotti (
          ordine_id, 
          prodotto_id, 
          quantita, 
          prezzo
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        ordineId,
        item.id_prodotto,
        item.quantita,
        item.prezzo_eff || item.prezzo
      ]);
      
      prodottiOrdine.push(prodottoOrdine.rows[0]);
      
      // 5. Aggiorna la quantità disponibile del prodotto
      await client.query(`
        UPDATE prodotto 
        SET quantita_disponibile = quantita_disponibile - $1 
        WHERE id_prodotto = $2
      `, [item.quantita, item.id_prodotto]);
    }
    
    // 6. Registra anche nella tabella acquisti (per mantenere compatibilità)
    for (const item of carrello) {
      await client.query(`
        INSERT INTO acquisti (
          id_utente, id_prodotto, quantita, prezzo_unitario, 
          metodo_pagamento, nome_intestatario, numero_carta_mascherato,
          ordine_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id_utente, 
        item.id_prodotto, 
        item.quantita, 
        item.prezzo_eff || item.prezzo,
        metodo_pagamento,
        nome_intestatario,
        mascheraNumeroCarta(numero_carta),
        ordineId
      ]);
    }
    
    // 7. Svuota il carrello dell'utente
    await client.query('DELETE FROM carrello WHERE id_utente = $1', [id_utente]);
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Acquisto completato con successo',
      ordine: ordine,
      prodotti: prodottiOrdine,
      totale: totaleFinale
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

module.exports = router;