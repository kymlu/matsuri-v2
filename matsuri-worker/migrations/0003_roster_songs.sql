-- 曲: a team's songs, each with its sections in order, and each section's 振り with their count names.
-- Run before deploying the worker that serves /api/roster/songs:
--   npx wrangler d1 execute matsuri-db --remote --file=migrations/0003_roster_songs.sql

CREATE TABLE roster_songs (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE roster_song_sections (
  id         TEXT PRIMARY KEY,
  song_id    TEXT NOT NULL REFERENCES roster_songs(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE roster_song_actions (
  id         TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES roster_song_sections(id),
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,
  counts     TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE UNIQUE INDEX roster_songs_team_key ON roster_songs(team_id, name_key) WHERE deleted = 0;
CREATE UNIQUE INDEX roster_song_sections_key ON roster_song_sections(song_id, name_key);
CREATE UNIQUE INDEX roster_song_actions_key ON roster_song_actions(section_id, name_key);
