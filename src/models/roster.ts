import * as z from "zod";

// 名簿: the team's list of names, used as suggestions when naming dancers.
export const RosterCategorySchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
});

export type RosterCategory = z.infer<typeof RosterCategorySchema>;

export const RosterNameSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  categoryIds: z.array(z.string()), // in category order
});

export type RosterName = z.infer<typeof RosterNameSchema>;

export const RosterSchema = z.object({
  categories: z.array(RosterCategorySchema), // in display order
  names: z.array(RosterNameSchema),
});

export type Roster = z.infer<typeof RosterSchema>;

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
