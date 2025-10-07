const multer = require('multer');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/prodotti/');
  },
  filename: function (req, file, cb) {
    // Usa timestamp + nome originale per evitare conflitti
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });


router.post('/upload', (req, res) => {
  // Usa multer solo se il file NON esiste già
  const fileName = req.headers['x-file-name'];
  if (!fileName) {
    return res.status(400).json({ message: 'Nome file mancante nell\'header x-file-name' });
  }
  const filePath = path.join('src/assets/prodotti/', fileName);

  // Se il file esiste già, restituisci il nome senza caricare
  if (fs.existsSync(filePath)) {
    return res.json({ filename: fileName, message: 'File già presente, non caricato.' });
  }

  // Altrimenti usa multer per caricare
  upload.single('immagine')(req, res, function (err) {
    if (err) {
        console.error('Errore upload:', err);
        return res.status(500).json({ message: 'Errore upload', error: err });}
    if (!req.file) return res.status(400).json({ message: 'Nessun file caricato' });
    res.json({ filename: req.file.filename });
  });
});

module.exports = router;