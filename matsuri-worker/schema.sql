-- Reference copy of the live D1 tables (matsuri-db). Not run by the worker.
-- Statements are as SQLite stores them, so columns added later sit after the closing line.
-- Tables are ordered so each comes after the tables it references.
--
-- Regenerate:  npx wrangler d1 export matsuri-db --remote --no-data --output=schema.sql
-- Local setup: npx wrangler d1 execute matsuri-db --local --file=schema.sql

CREATE TABLE teams (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
, name TEXT not null);

CREATE TABLE team_members (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id),
  user_id    TEXT NOT NULL REFERENCES users(id),
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')), role text not null default "admin",
  UNIQUE(team_id, user_id)
);

CREATE TABLE choreos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
, "event_name" TEXT, "event_start_date" TEXT, "event_end_date" TEXT, team_id    TEXT REFERENCES teams(id), password);

CREATE TABLE choreo_files (
  id TEXT PRIMARY KEY,
  choreo_id TEXT NOT NULL REFERENCES choreos(id),
  version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1,
  stage_width REAL NOT NULL,
  stage_length REAL NOT NULL,
  dancer_count INTEGER NOT NULL,
  prop_count INTEGER NOT NULL,
  uploaded_by TEXT REFERENCES team_members(id),
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  team_id    TEXT NOT NULL REFERENCES teams(id),
  token      TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE invite_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  team_id    TEXT NOT NULL REFERENCES teams(id),
  token_hash TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE password_reset_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  code_hash  TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE roster_categories (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, kind TEXT NOT NULL DEFAULT 'dancer');

CREATE TABLE roster_names (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES team_members(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, kind TEXT NOT NULL DEFAULT 'dancer', default_length REAL, default_width REAL, default_color TEXT);

CREATE TABLE roster_name_categories (
  name_id     TEXT NOT NULL REFERENCES roster_names(id),
  category_id TEXT NOT NULL REFERENCES roster_categories(id),
  PRIMARY KEY (name_id, category_id)
);

CREATE UNIQUE INDEX roster_names_team_key ON roster_names(team_id, kind, name_key) WHERE deleted = 0;
CREATE UNIQUE INDEX roster_categories_team_key ON roster_categories(team_id, kind, name_key) WHERE deleted = 0;
CREATE INDEX roster_name_categories_category ON roster_name_categories(category_id);
