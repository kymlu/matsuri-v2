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
