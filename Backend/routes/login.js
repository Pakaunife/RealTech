const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../connection/DBconnect');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', async (req, res) => {
  const  password  = req.body.password;
  let email = req.body.email;
  if (!email || !password) return res.status(400).json({ message: 'Email e password obbligatorie' });
    email = email.toLowerCase();
  try {
    const result = await pool.query('SELECT * FROM utenti WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Credenziali non valide' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenziali non valide' });

    // Genera JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;