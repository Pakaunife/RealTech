const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Per leggere JSON dal frontend

// Importa le rotte di autenticazione
const RegisterRoute= require('./routes/register');
const LoginRoute= require('./routes/login');

app.use('/api/auth', LoginRoute);
app.use('/api/auth', RegisterRoute);

// Avvio server
app.listen(3000, () => console.log('Backend attivo su http://localhost:3000'));