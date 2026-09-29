const Database = require("better-sqlite3");

// Opens the file store.db (creates it if it doesn't exist)
const db = new Database("store.db");

// Create the 4 tables our store needs
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    emoji TEXT,
    stock INTEGER NOT NULL DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  );
`);

// Add sample products, but only if the table is empty
const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO products (name, description, price, emoji) VALUES (?, ?, ?, ?)",
  );
  insert.run("Wireless Headphones", "Bluetooth, 30-hour battery", 49.99, "🎧");
  insert.run("Smart Watch", "Tracks steps and heart rate", 79.5, "⌚");
  insert.run("Backpack", 'Water-resistant, fits a 15" laptop', 34.0, "🎒");
  insert.run("Mechanical Keyboard", "RGB, blue switches", 59.99, "⌨️");
  insert.run("Gaming Mouse", "6 buttons, adjustable DPI", 24.99, "🖱️");
  insert.run("Desk Lamp", "LED, three brightness levels", 19.99, "💡");
}

module.exports = db;
