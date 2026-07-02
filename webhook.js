const express = require('express');
const router = express.Router();

// POST /api/webhook/printify
// Register this URL in Printify: Shop > Settings > Webhooks
// Events to subscribe to: product:publish:started, product:publish:succeeded
//
// Whenever you create/publish a new product in Printify (a new tee, hoodie,
// whatever), Printify calls this URL automatically. Right now it just logs
// the event — the storefront already stays in sync because it calls
// GET /api/products live on every page load (see routes/products.js).
//
// If later you want the site to feel instant instead of "fetch on load",
// this is the place to add a cache-refresh or push update to the frontend.
router.post('/webhook/printify', (req, res) => {
  const event = req.body;
  console.log('Printify webhook received:', event?.type || 'unknown event');

  // Always respond 200 quickly — Printify retries if it doesn't get one.
  res.status(200).json({ received: true });
});

module.exports = router;
