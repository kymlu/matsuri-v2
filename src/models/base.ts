import * as z from "zod";

export const BaseModelSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
});

export type BaseModel = z.infer<typeof BaseModelSchema>;

export const CoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const BasePositionSchema = CoordinatesSchema.extend({
  sectionId: z.string(),
  rotation: z.int().optional(),
});

export type BasePosition = z.infer<typeof BasePositionSchema>;