const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connessione a PostgreSQL
const pool = new Pool({
  user: 'postgres',       // il tuo utente postgres
  host: 'localhost',
  database: 'Real_Teck',  // nome db
  password: '0703',   // la tua password postgres
  port: 5432,
});

// --- API Catalogo ---
// Tutti i prodotti
app.get('/api/prodotti', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_prodotto, 
        p.nome, 
        c.nome AS categoria, 
        m.nome AS marchio, 
        p.prezzo
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});

// --- Avvio server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server backend avviato su http://localhost:${PORT}`);
});
