import { BaseModelSchema } from "./base";
import { DancerPositionSchema } from "./dancer";
import { DancerActionSchema } from "./dancerAction";
import { PropPositionSchema } from "./prop";
import * as z from "zod";

export const FormationSchema = z.object({
  dancerPositions: z.record(z.string(), DancerPositionSchema),
  dancerActions: z.array(DancerActionSchema),
  propPositions: z.record(z.string(), PropPositionSchema),
});

export type Formation = z.infer<typeof FormationSchema>;

export const ChoreoSectionSchema = BaseModelSchema.extend({
  order: z.number().optional(),
  head: z.number().optional(),
  note: z.string().optional(),
  formation: FormationSchema,
  duration: z.number().nonnegative().optional(), // seconds
});

export type ChoreoSection = z.infer<typeof ChoreoSectionSchema>;

export const SelectedObjectsSchema = z.object({
  dancers: z.array(DancerPositionSchema),
  props: z.array(PropPositionSchema),
});

export type SelectedObjects = z.infer<typeof SelectedObjectsSchema>;
