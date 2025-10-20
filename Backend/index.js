require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const RegisterRoutes = require('./routes/register');
const LoginRoutes = require('./routes/login');
const ProductsRoutes = require('./routes/products');
const SuggestedRoutes = require('./routes/suggested');
const OrdersRoutes = require('./routes/orders');
const AddressesRoutes = require('./routes/indirizzi');
const ProfileRoutes = require('./routes/profile');
const CatalogoRoutes = require('./routes/catalogo');
const VetrinaRoutes = require('./routes/vetrina');
const CarrelloRoutes = require('./routes/carrello');
const AcquistiRoutes = require('./routes/acquisti');
const AdminRoutes = require('./routes/admin');
const immagineRoutes = require('./routes/immagine');
const WishListRoutes = require('./routes/wishlist');
const couponRoutes = require('./routes/coupon');
const PacchettiRoutes = require('./routes/pacchetti');
const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-file-name'],
  exposedHeaders: ['Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  optionsSuccessStatus: 200  
}));

app.use(express.json());

// Servire file statici per le immagini dei prodotti
app.use('/api/images', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', RegisterRoutes);
app.use('/api/auth', LoginRoutes);
app.use('/api/products', ProductsRoutes);
app.use('/api/products', SuggestedRoutes);
app.use('/api/orders', OrdersRoutes);
app.use('/api/indirizzi', AddressesRoutes);
app.use('/api/profile', ProfileRoutes);
app.use('/api/catalogo', CatalogoRoutes);
app.use('/api/catalogo', VetrinaRoutes);
app.use('/api/carrello', CarrelloRoutes);
app.use('/api/acquisti', AcquistiRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/immagine', immagineRoutes);
app.use('/api/wishlist', WishListRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/pacchetti', PacchettiRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});