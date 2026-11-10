// One row type per D1 table, matching schema.sql. Update both together.
// SQLite has no booleans or dates: 0/1 flags are numbers and dates are TEXT.

export type TeamRow = {
  id: string,
  name: string,
  slug: string,
  created_at: string,
  updated_at: string,
}

export type UserRow = {
  id: string,
  email: string,
  password_hash: string,
  created_at: string,
  updated_at: string,
  name: string,
}

export type TeamMemberRow = {
  id: string,
  team_id: string,
  user_id: string,
  deleted: 0 | 1,
  created_at: string,
  updated_at: string,
  role: string,
}

export type ChoreoRow = {
  id: string,
  name: string,
  created_at: string | null,
  event_name: string | null,
  event_start_date: string | null,
  event_end_date: string | null,
  team_id: string | null,
  password: string | null, // untyped column in the schema
}

export type ChoreoFileRow = {
  id: string,
  choreo_id: string,
  version: number,
  is_current: 0 | 1,
  stage_width: number,
  stage_length: number,
  dancer_count: number,
  prop_count: number,
  uploaded_by: string | null, // team_members.id
  uploaded_at: string | null,
}

export type SessionRow = {
  id: string,
  user_id: string,
  team_id: string,
  token: string,
  expires_at: string,
  created_at: string,
}

export type InviteTokenRow = {
  id: string,
  user_id: string,
  team_id: string,
  token_hash: string,
  used_at: string | null,
  created_at: string,
}

export type PasswordResetTokenRow = {
  id: string,
  user_id: string,
  code_hash: string,
  expires_at: string,
  used_at: string | null,
  attempts: number,
  created_at: string,
}

export type RosterCategoryRow = {
  id: string,
  team_id: string,
  name: string,
  name_key: string, // toNameKey(name), for uniqueness only
  sort_order: number,
  deleted: 0 | 1,
  created_at: string,
  updated_at: string,
  kind: "dancer" | "prop",
}

export type RosterNameRow = {
  id: string,
  team_id: string,
  name: string,
  name_key: string, // toNameKey(name), for uniqueness only
  deleted: 0 | 1,
  created_by: string | null, // team_members.id
  created_at: string,
  updated_at: string,
  kind: "dancer" | "prop",
  // Prop defaults, always null for dancers. Metres, and #RRGGBB.
  default_length: number | null,
  default_width: number | null,
  default_color: string | null,
}

export type RosterNameCategoryRow = {
  name_id: string,
  category_id: string,
}
