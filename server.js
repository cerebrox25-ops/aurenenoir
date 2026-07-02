require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productsRoute = require('./routes/products');
const webhookRoute = require('./routes/webhook');
const paymentRoute = require('./routes/payment');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', productsRoute);
app.use('/api', webhookRoute);
app.use('/api', paymentRoute);

app.get('/', (req, res) => {
  res.send('Aurène Noir backend is running.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Aurène Noir backend listening on port ${PORT}`);
});
