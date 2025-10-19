const express = require('express');
const pool = require('../connection/DBconnect');

// --- API Catalogo ---
const router = express.Router();

// Tutti i prodotti
router.get('/prodotti', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nome, id_categoria, immagine
      FROM categoria;

    `);
    
    // Aggiungi URL completo dell'immagine a ogni categoria
    const categorieConUrl = result.rows.map(categoria => ({
      ...categoria,
      immagine_url: categoria.immagine ? `http://localhost:3000/api/images/categorie/${categoria.immagine}` : null
    }));
    
    res.json(categorieConUrl);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});
// Prodotti per categoria specifica
router.get('/prodotti/categoria/:nome', async (req, res) => {   //Riceve il nome della categoria come parametro
  try {
    const nomeCategoria = req.params.nome;
    const result = await pool.query(`
      SELECT 
        p.id_prodotto, 
        p.nome, 
        p.prezzo,
        p.descrizione,
        p.immagine,
        p.quantita_disponibile,
        m.nome AS marchio,
        c.nome AS categoria
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE c.nome = $1
    `, [nomeCategoria]);
    
    // Aggiungi URL completo dell'immagine a ogni prodotto
    const prodottiConUrl = result.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    }));
    
    res.json(prodottiConUrl);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Prodotti più acquistati (top N) — aggrega la tabella `acquisti`
router.get('/popular', async (req, res) => {
  try {
    
    const { limit = 3 } = req.query;

    // Semplice: prendi i product_id più acquistati (somma delle quantità) e uniscili ai dettagli prodotto
    const result = await pool.query(`
      SELECT p.id_prodotto, p.nome, p.prezzo, p.descrizione, p.immagine, p.quantita_disponibile, m.nome AS marchio, c.nome AS categoria, COALESCE(a.total_purchased, 0) as total_purchased
      FROM (
        SELECT id_prodotto, SUM(quantita) AS total_purchased
        FROM acquisti
        GROUP BY id_prodotto
        ORDER BY total_purchased DESC
        LIMIT $1
      ) a
      JOIN prodotto p ON p.id_prodotto = a.id_prodotto
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE p.quantita_disponibile > 0 AND p.bloccato = false
      ORDER BY a.total_purchased DESC, p.nome
    `, [limit]);

    const prodottiPopular = result.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    }));

    res.json(prodottiPopular);
  } catch (err) {
    console.error('Errore popular (acquisti):', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

router.get('/brand', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nome, id_marchio
      FROM marchio
      ORDER BY nome
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Endpoint per suggerimenti di ricerca
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    
    const result = await pool.query(`
      SELECT 
        p.id_prodotto, 
        p.nome, 
        p.prezzo,
        p.immagine,
        m.nome AS marchio,
        c.nome AS categoria
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE (LOWER(p.nome) LIKE $1 OR LOWER(m.nome) LIKE $1 OR LOWER(c.nome) LIKE $1)
      AND p.quantita_disponibile > 0 
      AND p.bloccato = false
      ORDER BY 
        CASE 
          WHEN LOWER(p.nome) LIKE $2 THEN 1
          WHEN LOWER(p.nome) LIKE $1 THEN 2
          WHEN LOWER(m.nome) LIKE $1 THEN 3
          ELSE 4
        END,
        p.nome
      LIMIT $3
    `, [searchTerm, `${q.trim().toLowerCase()}%`, limit]);
    
    // Aggiungi URL completo dell'immagine a ogni prodotto
    const suggestions = result.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    }));
    
    res.json(suggestions);
  } catch (err) {
    console.error('Errore suggestions:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Endpoint per ottenere un singolo prodotto tramite id, usato per aprire il dettaglio prodotto
router.get('/prodotto/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(`
      SELECT 
        p.id_prodotto,
        p.nome,
        p.prezzo,
        p.descrizione,
        p.immagine,
        p.quantita_disponibile,
        m.nome AS marchio,
        c.nome AS categoria
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE p.id_prodotto = $1
      LIMIT 1
    `, [id]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }

    const prodotto = result.rows[0];
    const prodottoConUrl = {
      ...prodotto,
      immagine_url: prodotto.immagine ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 'http://localhost:3000/api/images/prodotti/default.jpg'
    };

    res.json(prodottoConUrl);
  } catch (err) {
    console.error('Errore get prodotto by id:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

module.exports = router;
