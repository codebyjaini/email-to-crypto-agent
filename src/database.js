import Database from 'better-sqlite3';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('wallets.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    address TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    chain_id INTEGER DEFAULT 11155111,
    is_primary INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    from_address TEXT,
    to_address TEXT,
    amount TEXT,
    token TEXT DEFAULT 'ETH',
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
  CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
`);

// Encryption helpers
const ALGORITHM = 'aes-256-gcm';

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData, key) {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// User operations
export function createUser(email) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO users (id, email) VALUES (?, ?)');
  stmt.run(id, email.toLowerCase());
  return { id, email: email.toLowerCase() };
}

export function getUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

export function getOrCreateUser(email) {
  let user = getUserByEmail(email);
  if (!user) {
    user = createUser(email);
  }
  return user;
}

// Wallet operations
export function saveWallet(userId, address, privateKey, encryptionKey, chainId = 11155111) {
  const id = uuidv4();
  const encryptedPrivateKey = encrypt(privateKey, encryptionKey);
  
  // Check if user has any wallets
  const existingWallets = db.prepare('SELECT COUNT(*) as count FROM wallets WHERE user_id = ?').get(userId);
  const isPrimary = existingWallets.count === 0 ? 1 : 0;
  
  const stmt = db.prepare(`
    INSERT INTO wallets (id, user_id, address, encrypted_private_key, chain_id, is_primary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, address, encryptedPrivateKey, chainId, isPrimary);
  return { id, address, chainId, isPrimary: Boolean(isPrimary) };
}

export function getWalletByEmail(email, encryptionKey) {
  const stmt = db.prepare(`
    SELECT w.*, u.email 
    FROM wallets w
    JOIN users u ON w.user_id = u.id
    WHERE u.email = ? AND w.is_primary = 1
  `);
  const wallet = stmt.get(email.toLowerCase());
  
  if (wallet && encryptionKey) {
    wallet.privateKey = decrypt(wallet.encrypted_private_key, encryptionKey);
  }
  return wallet;
}

export function getWalletByAddress(address) {
  const stmt = db.prepare('SELECT * FROM wallets WHERE address = ?');
  return stmt.get(address.toLowerCase());
}

export function getAllUserWallets(email) {
  const stmt = db.prepare(`
    SELECT w.id, w.address, w.chain_id, w.is_primary, w.created_at
    FROM wallets w
    JOIN users u ON w.user_id = u.id
    WHERE u.email = ?
  `);
  return stmt.all(email.toLowerCase());
}

// Transaction operations
export function saveTransaction(userId, type, fromAddress, toAddress, amount, token = 'ETH') {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO transactions (id, user_id, type, from_address, to_address, amount, token)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, type, fromAddress, toAddress, amount, token);
  return { id, type, fromAddress, toAddress, amount, token, status: 'pending' };
}

export function updateTransactionStatus(id, txHash, status) {
  const stmt = db.prepare('UPDATE transactions SET tx_hash = ?, status = ? WHERE id = ?');
  stmt.run(txHash, status, id);
}

export function getTransactionsByEmail(email, limit = 10) {
  const stmt = db.prepare(`
    SELECT t.*
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE u.email = ?
    ORDER BY t.created_at DESC
    LIMIT ?
  `);
  return stmt.all(email.toLowerCase(), limit);
}

export function getUserByAddress(address) {
  const stmt = db.prepare(`
    SELECT u.* FROM users u
    JOIN wallets w ON u.id = w.user_id
    WHERE w.address = ?
  `);
  return stmt.get(address.toLowerCase());
}

export { db, encrypt, decrypt };
