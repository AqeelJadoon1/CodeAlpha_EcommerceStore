# CodeAlpha E-commerce Store

My Task 1 submission for the CodeAlpha Full Stack Development internship — a basic online store with product listings, a cart, and checkout.

## What it does

You can browse products, click into a product's own page, add it to a cart, create an account, log in, and check out. Checkout actually deducts stock and saves an order to the database — it's not just a UI mockup.

## Features

- Product listing + individual product detail pages
- Shopping cart (kept in the browser so it survives page reloads)
- User registration and login (passwords hashed with bcrypt, sessions via cookies)
- Order processing — checkout recalculates prices server-side (never trusts the cart blindly), checks stock, and saves the order and order items as one atomic transaction

## Tech stack

- Frontend: plain HTML/CSS/JS, no framework
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)
- Auth: bcrypt + express-session

## Running it locally

```bash
git clone https://github.com/AqeelJadoon1/CodeAlpha_EcommerceStore.git
cd CodeAlpha_EcommerceStore
npm install
node server.js
```

Then open `http://localhost:3000`. The database file (`store.db`) gets created automatically on first run with a handful of sample products.

## Project structure

```
server.js       - routes (products, auth, orders)
db.js           - SQLite schema + seed data
public/
  index.html    - product grid
  product.html  - single product + add to cart
  cart.html     - cart + checkout
  account.html  - login / register
```

## A note on the cart

The cart lives in `localStorage`, not the database — that means it's temporary and per-browser, which is normal for most small stores. At checkout, the server re-fetches real prices from the DB rather than trusting whatever's in the browser, since the cart could technically be edited in dev tools.

## Known limitations

- No order history page yet (orders are saved, just not shown back to the user)
- No image uploads — products use emoji as placeholders instead of real photos
