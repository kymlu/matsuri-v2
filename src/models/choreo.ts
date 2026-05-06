import { BaseModelSchema } from "./base";
import { ChoreoSectionSchema } from "./choreoSection";
import { DancerSchema } from "./dancer";
import { ObstacleSchema, PropSchema } from "./prop";
import * as z from "zod";

export const StageTypeSchema = z.enum(["stage", "parade"]);
export type StageType = z.infer<typeof StageTypeSchema>;

export const YAxisDirectionSchema = z.enum(["top-down", "bottom-up"]);
export type YAxisDirection = z.infer<typeof YAxisDirectionSchema>;

export const StageMarginsSchema = z.object({
  topMargin: z.number(),
  leftMargin: z.number(),
  rightMargin: z.number(),
  bottomMargin: z.number(),
});
export type StageMargins = z.infer<typeof StageMarginsSchema>;

export const StageGeometrySchema = z.object({
  stageWidth: z.number(),
  stageLength: z.number(),
  margin: StageMarginsSchema,
  yAxis: YAxisDirectionSchema,
});
export type StageGeometry = z.infer<typeof StageGeometrySchema>;

export const ChoreoSchema = BaseModelSchema.extend({
  event: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  stageType: StageTypeSchema,
  stageGeometry: StageGeometrySchema,
  sections: z.array(ChoreoSectionSchema),
  dancers: z.record(z.string().nonempty(), DancerSchema),
  props: z.record(z.string().nonempty(), PropSchema),
  obstacles: z.record(z.string().nonempty(), ObstacleSchema).optional(),
  lastUpdated: z.string().optional(),
  version: z.number().optional(),
  isDirty: z.boolean().optional(),
});
export type Choreo = z.infer<typeof ChoreoSchema>;

export const EventDetailsSchema = z.object({
  event: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type EventDetails = z.infer<typeof EventDetailsSchema>;