import { BaseModelSchema, CoordinatesSchema } from "./base";
import { DancerPositionSchema } from "./dancer";
import { DancerActionSchema } from "./dancerAction";
import { PropPositionSchema } from "./prop";
import * as z from "zod";

export const MovementTypeSchema = z.enum(["straight", "curved"]);
export type MovementType = z.infer<typeof MovementTypeSchema>;

export const MovementSchema = z.object({
  points: CoordinatesSchema.array(),
  tension: MovementTypeSchema,
});

export type Movement = z.infer<typeof MovementSchema>;

export type MovementCacheBySectionByDancer = Record<string, MovementCacheByDancer>;
export type MovementCacheByDancer = Record<string, MovementCache>;
export type MovementCache = {
  points: number[],
  tension: MovementType,
}
export type PathSvgCacheByDancerBySection = Record<string, PathSvgCacheBySection>;
export type PathSvgCacheBySection = Record<string, PathSvgCache>;
export type PathSvgCache = {
  path: string,
};

export const FormationSchema = z.object({
  dancerPositions: z.record(z.string(), DancerPositionSchema),
  dancerMovements: z.record(z.string(), MovementSchema).optional(),
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