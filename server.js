const express = require("express");
const session = require("express-session"); // NEW
const bcrypt = require("bcryptjs"); // NEW
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

// NEW: session setup (creates the login cookie)
app.use(
  session({
    secret: "change-this-to-a-long-random-string",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // stay logged in for 7 days
  }),
);

app.use(express.static("public"));

// ---------- PRODUCTS ----------
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// ---------- AUTH (NEW) ----------

// Register a new user
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    return res.status(400).json({ error: "That email is already registered" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hash);

  req.session.userId = result.lastInsertRowid; // log them in straight away
  res.json({ id: result.lastInsertRowid, name, email });
});

// Log in
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Wrong email or password" });
  }

  req.session.userId = user.id;
  res.json({ id: user.id, name: user.name, email: user.email });
});

// Log out
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Who am I? (the page uses this to know if someone is logged in)
app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json(null);
  const user = db
    .prepare("SELECT id, name, email FROM users WHERE id = ?")
    .get(req.session.userId);
  res.json(user || null);
});

app.listen(PORT, () => {
  console.log(`Store running at http://localhost:${PORT}`);
});
// ---------- ORDERS (NEW) ----------
app.post('/api/orders', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please log in to check out' });
  }

  const { items } = req.body; // [{ productId, quantity }, ...]
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Look up real prices from the database — never trust prices from the browser
  let total = 0;
  const lines = [];
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
    if (!product) return res.status(400).json({ error: 'Invalid product in cart' });
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `${product.name} is out of stock` });
    }
    total += product.price * item.quantity;
    lines.push({ product, quantity: item.quantity });
  }

  // Run everything as one transaction: either it all succeeds, or none of it does
  const placeOrder = db.transaction(() => {
    const order = db
      .prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)')
      .run(req.session.userId, total);

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
    );
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const line of lines) {
      insertItem.run(order.lastInsertRowid, line.product.id, line.quantity, line.product.price);
      updateStock.run(line.quantity, line.product.id);
    }

    return order.lastInsertRowid;
  });

  const orderId = placeOrder();
  res.json({ orderId, total });
});