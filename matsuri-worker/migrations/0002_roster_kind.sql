-- 名簿 for props: a kind on names and categories, and default size and colour for prop names.
-- Existing rows become dancers. Run before deploying the worker that reads kind:
--   npx wrangler d1 execute matsuri-db --remote --file=migrations/0002_roster_kind.sql
-- The unique indexes are briefly gone between the DROP and CREATE below, so run it when nobody is editing 名簿.

ALTER TABLE roster_categories ADD COLUMN kind TEXT NOT NULL DEFAULT 'dancer';
ALTER TABLE roster_names ADD COLUMN kind TEXT NOT NULL DEFAULT 'dancer';

-- Prop defaults; always NULL for dancers. Sizes in metres, colour as #RRGGBB.
ALTER TABLE roster_names ADD COLUMN default_length REAL;
ALTER TABLE roster_names ADD COLUMN default_width REAL;
ALTER TABLE roster_names ADD COLUMN default_color TEXT;

-- Names and categories are unique per kind, so a dancer and a prop can share a name.
DROP INDEX roster_names_team_key;
DROP INDEX roster_categories_team_key;
CREATE UNIQUE INDEX roster_names_team_key ON roster_names(team_id, kind, name_key) WHERE deleted = 0;
CREATE UNIQUE INDEX roster_categories_team_key ON roster_categories(team_id, kind, name_key) WHERE deleted = 0;
