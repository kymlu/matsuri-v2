import { BaseModelSchema, BasePositionSchema } from "./base";
import * as z from "zod";

export const PropSchema = BaseModelSchema.extend({
  color: z.string(),
  length: z.number(),
  width: z.number(),
});

export type Prop = z.infer<typeof PropSchema>;

export const PropPositionSchema = BasePositionSchema.extend({
  propId: z.string(),
});

export type PropPosition = z.infer<typeof PropPositionSchema>;
