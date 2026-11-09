-- 名簿: a team-wide list of names, each in any number of categories.
-- Run before deploying the worker that serves /api/roster:
--   npx wrangler d1 execute matsuri-db --remote --file=migrations/0001_roster.sql

CREATE TABLE roster_categories (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE roster_names (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES team_members(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE roster_name_categories (
  name_id     TEXT NOT NULL REFERENCES roster_names(id),
  category_id TEXT NOT NULL REFERENCES roster_categories(id),
  PRIMARY KEY (name_id, category_id)
);

-- One live name or category per spelling per team; deleted rows don't block adding it again.
CREATE UNIQUE INDEX roster_names_team_key ON roster_names(team_id, name_key) WHERE deleted = 0;
CREATE UNIQUE INDEX roster_categories_team_key ON roster_categories(team_id, name_key) WHERE deleted = 0;
CREATE INDEX roster_name_categories_category ON roster_name_categories(category_id);
