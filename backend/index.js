const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Per leggere JSON dal frontend

// Importa le rotte di autenticazione
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Avvio server
app.listen(3000, () => console.log('Backend attivo su http://localhost:3000'));