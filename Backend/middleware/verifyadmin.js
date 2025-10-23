function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }
  
  const ruoliPermessi = ['admin', 'owner'];

  if (!ruoliPermessi.includes(req.user.ruolo)) {
    return res.status(403).json({ error: 'Accesso negato: solo admin' });
  }
  
  next();
}

module.exports = verifyAdmin;