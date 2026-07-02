const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const PRINTIFY_BASE = 'https://api.printify.com/v1';

// GET /api/products
// Pulls the live product catalog from Printify so the storefront
// never has to hardcode prices or products again.
router.get('/products', async (req, res) => {
  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const token = process.env.PRINTIFY_API_TOKEN;

    const response = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Printify request failed', detail: text });
    }

    const data = await response.json();

    // Only send the fields the storefront actually needs — keeps the
    // response small and avoids leaking internal Printify metadata.
    const products = data.data.map(p => ({
      id: p.id,
      name: p.title,
      description: p.description,
      image: p.images?.[0]?.src || null,
      price: p.variants?.[0]?.price ? p.variants[0].price / 100 : null,
      isPublished: p.visible,
    })).filter(p => p.isPublished);

    res.json({ products });
  } catch (err) {
    console.error('Error fetching Printify products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;
