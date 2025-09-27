const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());  // serve per leggere JSON dal frontend

// 🔹 Connessione al database PostgreSQL
const pool = new Pool({
connectionString: "postgres://postgres:0703@localhost:5432/STAR_CINEMA"
});

// 🔹 API: lista film
app.get('/api/film', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM film'); // legge tutti i film
    res.json(result.rows);  // ritorna JSON
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Avvio server
app.listen(3000, () => console.log('Backend attivo su http://localhost:3000'));
