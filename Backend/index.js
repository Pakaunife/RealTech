require('dotenv').config();
const express = require('express');
const cors = require('cors');

const RegisterRoutes = require('./routes/register');
const LoginRoutes = require('./routes/login');
const ProductsRoutes = require('./routes/products');
const SuggestedRoutes = require('./routes/suggested');
const WishListRoutes = require('./routes/wishlist');
const OrdersRoutes = require('./routes/orders');
const AddressesRoutes = require('./routes/indirizzi');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', RegisterRoutes);
app.use('/api/auth', LoginRoutes);
app.use('/api/products', ProductsRoutes);
app.use('/api/products', SuggestedRoutes);
app.use('/api/wishlist', WishListRoutes);
app.use('/api/orders', OrdersRoutes);
app.use('/api/indirizzi', AddressesRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});