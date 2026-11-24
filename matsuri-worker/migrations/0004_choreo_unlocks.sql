-- Server-side choreo passwords: a device that enters the right password gets a token, stored here as a hash.
-- Run before deploying the worker that checks it:
--   npx wrangler d1 execute matsuri-db --remote --file=migrations/0004_choreo_unlocks.sql

CREATE TABLE choreo_unlocks (
  id         TEXT PRIMARY KEY,
  choreo_id  TEXT NOT NULL REFERENCES choreos(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX choreo_unlocks_choreo ON choreo_unlocks(choreo_id);
