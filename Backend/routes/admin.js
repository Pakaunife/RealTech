const express = require('express');
const router = express.Router();
const pool = require('../connection/DBconnect');
const authenticateToken = require('./auth');

router.get('/users',  authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(`
    SELECT 
      u.id, u.nome, u.cognome, u.email, u.is_admin, u.is_blocked,
      COUNT(o.id) AS orders_count
    FROM utenti u
    LEFT JOIN ordini o ON o.user_id = u.id
    WHERE u.id != $1
    GROUP BY u.id
    ORDER BY u.id
  `, [userId]);
  res.json(result.rows);
});

router.patch('/users/:id/block', async (req, res) => {
  const userId = req.params.id;
  const user = await pool.query('SELECT is_blocked FROM utenti WHERE id = $1', [userId]);
  if (user.rows.length === 0) return res.status(404).send('Utente non trovato');
  const newStatus = !user.rows[0].is_blocked;
  await pool.query('UPDATE utenti SET is_blocked = $1 WHERE id = $2', [newStatus, userId]);
  res.json({ success: true, is_blocked: newStatus });
});

router.patch('/users/:id/admin', async (req, res) => {
  const userId = req.params.id;
  const { makeAdmin } = req.body;
  await pool.query('UPDATE utenti SET is_admin = $1 WHERE id = $2', [makeAdmin, userId]);
  res.json({ success: true, is_admin: makeAdmin });
});


module.exports = router;