const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const PRINTIFY_BASE = 'https://api.printify.com/v1';

// POST /api/verify-payment
// Body: { transaction_id, expected_amount, cart, customer }
//
// The frontend's Flutterwave popup can be tampered with by anyone with
// browser dev tools — it is NEVER safe to trust "payment succeeded" from
// the browser alone. This route re-checks the transaction directly with
// Flutterwave's server using your SECRET key, and only creates the
// Printify order if that check passes and the amount matches.
router.post('/verify-payment', async (req, res) => {
  const { transaction_id, expected_amount, cart, customer } = req.body;

  if (!transaction_id || !expected_amount || !cart || !customer) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Verify the transaction really happened, server-to-server.
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );
    const verifyData = await verifyRes.json();

    const txn = verifyData?.data;
    const paymentOk =
      verifyData.status === 'success' &&
      txn?.status === 'successful' &&
      Number(txn.amount) >= Number(expected_amount) &&
      txn.currency === 'USD';

    if (!paymentOk) {
      return res.status(402).json({ error: 'Payment could not be verified' });
    }

    // 2. Payment is real — now create the order in Printify so it ships.
    const orderPayload = {
      external_id: transaction_id,
      label: `Aurène Noir order ${transaction_id}`,
      line_items: cart.map(item => ({
        product_id: item.printifyProductId,
        variant_id: item.printifyVariantId,
        quantity: item.quantity,
      })),
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        country: customer.country,
        region: customer.region,
        address1: customer.address1,
        city: customer.city,
        zip: customer.zip,
      },
    };

    const orderRes = await fetch(
      `${PRINTIFY_BASE}/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      }
    );

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error('Printify order creation failed:', errText);
      // Payment succeeded but order failed to create — this needs a human.
      // In production, send yourself an alert here (email/Telegram) so no
      // paid order silently falls through the cracks.
      return res.status(502).json({ error: 'Payment verified but order creation failed', detail: errText });
    }

    const order = await orderRes.json();
    res.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('verify-payment error:', err);
    res.status(500).json({ error: 'Server error verifying payment' });
  }
});

module.exports = router;
