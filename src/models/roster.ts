import * as z from "zod";

// 名簿: the team's lists of dancer and prop names, used as suggestions when naming them.
export const RosterKindSchema = z.enum(["dancer", "prop"]);

export type RosterKind = z.infer<typeof RosterKindSchema>;

export const RosterCategorySchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
});

export type RosterCategory = z.infer<typeof RosterCategorySchema>;

export const RosterNameSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  categoryIds: z.array(z.string()), // in category order
  // Prop defaults, only present when set.
  length: z.number().optional(),
  width: z.number().optional(),
  color: z.string().optional(),
});

export type RosterName = z.infer<typeof RosterNameSchema>;

// One kind's names and categories.
export const RosterListSchema = z.object({
  categories: z.array(RosterCategorySchema), // in display order
  names: z.array(RosterNameSchema),
});

export type RosterList = z.infer<typeof RosterListSchema>;

export const RosterSchema = z.object({
  dancers: RosterListSchema,
  props: RosterListSchema,
});

export type Roster = z.infer<typeof RosterSchema>;

export const rosterListOf = (roster: Roster, kind: RosterKind): RosterList =>
  kind === "dancer" ? roster.dancers : roster.props;

// A prop name's defaults, as sent to the server; null clears one.
export type PropDefaults = {
  length: number | null,
  width: number | null,
  color: string | null,
}

export const AddRosterNamesResultSchema = z.object({
  roster: RosterSchema,
  added: z.number(),
  updated: z.number(),
  skipped: z.array(z.object({
    name: z.string(),
    reason: z.enum(["too_long", "exists"]),
  })),
});

export type AddRosterNamesResult = z.infer<typeof AddRosterNamesResultSchema>;

// [name id, category id]
const RosterLinkSchema = z.tuple([z.string(), z.string()]);
export type RosterLink = z.infer<typeof RosterLinkSchema>;

// The links that actually changed, so the result line counts only those.
export const RosterLinksResultSchema = z.object({
  roster: RosterSchema,
  added: z.array(RosterLinkSchema),
  removed: z.array(RosterLinkSchema),
});

export type RosterLinksResult = z.infer<typeof RosterLinksResultSchema>;

export const RosterRemoveResultSchema = z.object({
  roster: RosterSchema,
  removed: z.array(z.string()),
});

export type RosterRemoveResult = z.infer<typeof RosterRemoveResultSchema>;

export const RosterRestoreResultSchema = z.object({
  roster: RosterSchema,
  restored: z.array(z.string()),
  skipped: z.array(z.string()),
});

export type RosterRestoreResult = z.infer<typeof RosterRestoreResultSchema>;

// One prop name's defaults to set, for /api/roster/names/defaults: null clears a value, leaving it out keeps it.
export type RosterDefaultsItem = {
  id: string,
  length?: number | null,
  width?: number | null,
  color?: string | null,
}

// changed: the names whose values actually changed, for the result count.
export const RosterDefaultsResultSchema = z.object({
  roster: RosterSchema,
  changed: z.array(z.string()),
});

export type RosterDefaultsResult = z.infer<typeof RosterDefaultsResultSchema>;
