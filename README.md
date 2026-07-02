# Aurène Noir — Backend

This is the part that:
1. Pulls your live Printify catalog so the storefront never goes stale
2. Listens for new Printify products (webhook)
3. Verifies every Flutterwave payment for real before creating the Printify order — so nobody can fake a payment from their browser

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your real values (Printify token, Printify shop ID, Flutterwave **secret** key)
3. `npm start` — runs on `http://localhost:4000`

## Deploying (Render, free tier)

1. Push this folder to a GitHub repo
2. Go to render.com → New → Web Service → connect the repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Under "Environment" add the same variables from your `.env` file — **never** upload the `.env` file itself
6. Deploy. You'll get a URL like `aurene-backend.onrender.com`

## Connect it to Printify

Printify dashboard → your shop → Settings → Webhooks → add:
`https://your-backend-url.onrender.com/api/webhook/printify`
Subscribe to: `product:publish:succeeded`

## Connect it to the frontend

In `index.html`, replace the hardcoded `PRODUCTS` array with:
```js
const res = await fetch('https://your-backend-url.onrender.com/api/products');
const { products } = await res.json();
```

And in the Flutterwave `callback`, POST to `/api/verify-payment` instead of just logging to console.

## Security notes

- The Printify token and Flutterwave secret key live ONLY in this backend's environment variables — never in the frontend, never in GitHub.
- If a token has ever been pasted in a chat, plain text file, or screenshot, treat it as compromised and regenerate it.
